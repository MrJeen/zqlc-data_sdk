import axios from 'axios';
import {
  BOOLEAN_STATUS,
  CHAINS,
  CONTRACT_ATTRIBUTE,
  NFT_METADATA_LOCK,
  NFT_UPDATE_LIST,
  RABBITMQ_DELAY_EXCHANGE,
  RABBITMQ_NFT_METADATA_ROUTING_KEY,
  RABBITMQ_SYNC_NFT_EXCHANGE,
  getContractSyncSuccessSourceKey,
} from '../config/constant';
import { erc1155ContractAbi, erc721ContractAbi } from '../config/abi';
import { CONTRACT_TYPE } from '../entity/contract.entity';
import { Nft } from '../entity/nft.entity';
import _ from 'lodash';
import { filterData, isValidUrl, md5 } from '../utils/helper';
import { getContract, getJsonRpcProvider } from '../utils/ethers';
import { Logger } from '../utils/log4js';
import { SocksProxyAgent } from 'socks-proxy-agent';
import { mqPublish } from '../utils/rabbitMQ';
import { DataSource } from 'typeorm';
import { OSS_OM_BASE64_CLIENT } from './aliyun.oss.service';
import { Readable } from 'stream';
import { NftResultDto } from '../dto/nft.dto';
import auth from '../config/auth.api';
import { HttpException, HttpStatus } from '@nestjs/common';

export const base64_reg = /^data:[\s\S]+;base64,/;

/**
 * 补全NFT信息
 * @param nft
 */
export async function syncMetadata(
  amqpConnection: any,
  datasource: DataSource,
  redisService: any,
  nft: Nft,
) {
  const redisClient = redisService.getClient();
  // 加锁防止重复处理
  const key = NFT_METADATA_LOCK + ':' + nft.id;
  const value = await redisService.lock(redisClient, key);

  if (!value) {
    return;
  }

  // 一次只能处理一个系列
  const contractKey = NFT_METADATA_LOCK + ':' + nft.token_address;
  const contractValue = await redisService.lock(redisClient, contractKey);

  if (!contractValue) {
    // 重新抛回队列
    await mqPublish(
      amqpConnection,
      datasource,
      redisService,
      RABBITMQ_DELAY_EXCHANGE,
      RABBITMQ_NFT_METADATA_ROUTING_KEY,
      nft,
      {
        headers: {
          'x-delay': Math.ceil(10000 * Math.random()),
        },
      },
    );
    await redisService.unlock(redisClient, key, value);
    return;
  }

  // 从redis获取contract的属性，是否需要同步metadata，是否有设置tokenuri前缀
  const attributeStr = await redisClient.hget(
    CONTRACT_ATTRIBUTE,
    nft.chain + ':' + nft.token_address,
  );
  let contractArrtibute = {};
  if (attributeStr) {
    contractArrtibute = JSON.parse(attributeStr);
  }

  try {
    if (contractArrtibute['no_metadata'] == BOOLEAN_STATUS.YES) {
      return;
    }

    const update = {
      id: nft.id,
      chain: nft.chain,
      token_uri: '',
      name: '',
      metadata: {},
      is_destroyed: nft.is_destroyed,
    };

    if (update.is_destroyed == BOOLEAN_STATUS.NO) {
      // 未销毁才需要查询metadata
      await getMetaDataUpdate(
        update,
        contractArrtibute['token_uri_prefix'] ?? '',
        nft,
      );
    }

    if (update.is_destroyed == BOOLEAN_STATUS.YES) {
      // 已销毁，删除不必要的更新
      delete update.token_uri, update.name, update.metadata;
    } else if (_.isEmpty(update.metadata)) {
      // 未销毁并且metadata为空，不处理
      return;
    }

    // 先存redis，利用定时任务批量更新
    await redisClient.rpush(NFT_UPDATE_LIST, JSON.stringify(update));

    return update;
  } catch (error) {
    Logger.error({
      title: 'NftService-syncMetadata',
      data: nft,
      error: error + '',
    });

    const status = error?.response?.status ?? error?.status;
    if (status == HttpStatus.TOO_MANY_REQUESTS) {
      // 推送到延时队列
      await mqPublish(
        amqpConnection,
        datasource,
        redisService,
        RABBITMQ_DELAY_EXCHANGE,
        RABBITMQ_NFT_METADATA_ROUTING_KEY,
        nft,
        {
          headers: {
            'x-delay': Math.ceil(10000 * Math.random()),
          },
        },
      );
    }

    if (status && (status == 403 || status.toString().slice(0, 1) == '5')) {
      // 不同步
      await redisClient.hset(
        CONTRACT_ATTRIBUTE,
        nft.chain + ':' + nft.token_address,
        JSON.stringify({
          ...contractArrtibute,
          no_metadata: BOOLEAN_STATUS.YES,
        }),
      );
    }
  } finally {
    await redisService.unlock(redisClient, key, value);
    await redisService.unlock(redisClient, contractKey, contractValue);
  }
}

export async function nftUpdateNotice(
  amqpConnection: any,
  datasource: DataSource,
  redisService: any,
  nft: Nft,
) {
  // 推送到三方
  const redisClient = redisService.getClient();
  const key = getContractSyncSuccessSourceKey(nft.chain, nft.token_address);
  const sources = await redisClient.smembers(key);
  if (!sources.length) {
    return;
  }

  const nftInfo = filterData(NftResultDto, nft);

  nftInfo['chain_id'] = CHAINS[nft.chain];

  for (const source of sources) {
    const routingKey = md5(
      source + auth[source] + 'update' + CHAINS[nft.chain],
    );
    // rmq推送
    await mqPublish(
      amqpConnection,
      datasource,
      redisService,
      RABBITMQ_SYNC_NFT_EXCHANGE,
      routingKey,
      nftInfo,
    );
  }
}

async function getMetaDataUpdate(
  update: any,
  tokenUriPrefix: string,
  nft: Nft,
) {
  let tokenUri = '';
  try {
    tokenUri = await getTokenUri(tokenUriPrefix, nft);

    if (tokenUri) {
      const metadata = await getMetadata(nft, tokenUri);
      // metadata不为空
      if (!_.isEmpty(metadata)) {
        update.metadata = metadata;
        if (metadata.hasOwnProperty('name')) {
          // 有些名字是数字，会报错
          update.name = JSON.stringify(metadata?.name || '').replace(
            /\u0000/g,
            '',
          );
        }
        if (base64_reg.test(tokenUri)) {
          // base64太长了，不存储
          update.token_uri = 'base64 data';
        } else {
          update.token_uri = tokenUri;
        }
      }
    }
  } catch (e) {
    // token已销毁
    if (e?.reason && e.reason.indexOf('nonexistent') != -1) {
      update.is_destroyed = BOOLEAN_STATUS.YES;
    } else {
      // 抛异常，重新推回队列
      throw e;
    }
  }
}

async function getTokenUri(tokenUriPrefix: string, nft: Nft) {
  let tokenUri = '';
  if (tokenUriPrefix) {
    // 直接拼接uri
    tokenUri = tokenUriPrefix + nft.token_id;
  } else {
    const provider = getJsonRpcProvider(CHAINS[nft.chain]);
    if (nft.contract_type === CONTRACT_TYPE.ERC721) {
      const contract = getContract(
        nft.token_address,
        erc721ContractAbi,
        provider,
      );
      tokenUri = await contract.tokenURI(nft.token_id);
    }
    if (nft.contract_type === CONTRACT_TYPE.ERC1155) {
      const contract = getContract(
        nft.token_address,
        erc1155ContractAbi,
        provider,
      );
      tokenUri = await contract.uri(nft.token_id);
    }
  }
  // 个别uri有异常
  tokenUri = tokenUri.replace(/\u0000/g, '');
  // 判断协议
  if (tokenUri.startsWith('ipfs://')) {
    tokenUri = tokenUri.replace('ipfs://', 'https://ipfs.io/ipfs/');
  }
  return tokenUri;
}

async function getMetadata(nft: Nft, tokenUri: string) {
  let metadata: any;
  // 有些tokenUri是base64编码，这种情况无需使请求接口
  if (base64_reg.test(tokenUri)) {
    const base64 = tokenUri.replace(base64_reg, '');
    let string = Buffer.from(base64, 'base64').toString();
    // 个别json有问题
    string = string.replace(/""/g, '"');
    metadata = JSON.parse(string);
  } else if (!isValidUrl(tokenUri)) {
    // 非有效url
    throw new HttpException('url is invalid', HttpStatus.FORBIDDEN);
  } else {
    // 本地需要设置proxy
    const response = await axios({
      url: tokenUri,
      method: 'get',
      ...(process.env.PROXY === 'true'
        ? { httpsAgent: new SocksProxyAgent(process.env.PROXY_HOST) }
        : {}),
    });

    // 响应为一个图片
    if (response?.headers['content-type'].startsWith('image')) {
      throw new HttpException('metadata is an image', HttpStatus.FORBIDDEN);
    }

    metadata = response?.data;
  }

  if (typeof metadata == 'string') {
    try {
      metadata = JSON.parse(metadata);
    } catch (error) {
      Logger.error({
        title: 'getMetadata-parse',
        data: {
          nft,
          tokenUri,
          metadata,
        },
        error: error + '',
      });
    }
  }

  if (!(metadata && typeof metadata === 'object')) {
    metadata = {};
  }

  await checkMetadataImg(metadata, nft);

  return metadata;
}

export async function checkMetadataImg(metadata: any, nft: Nft) {
  if (metadata.hasOwnProperty('image') && base64_reg.test(metadata.image)) {
    // 上传图片信息到oss
    const stream = Readable.from(metadata.image);
    const result = (await OSS_OM_BASE64_CLIENT.putStream(
      `${nft.chain}/${nft.token_address}/${nft.token_id}`.toLowerCase(),
      stream,
    )) as any;
    metadata.image = result.url;
  }
}
