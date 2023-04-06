import axios from 'axios';
import {
  BOOLEAN_STATUS,
  CONTRACT_ATTRIBUTE,
  NFT_METADATA_LOCK,
  RABBITMQ_NFT_EXCHANGE,
  RABBITMQ_NFT_UPDATE_ES_ROUTING_KEY,
} from '../config/constant';
import { erc1155ContractAbi, erc721ContractAbi } from '../config/abi';
import { CHAIN, CONTRACT_TYPE } from '../entity/contract.entity';
import { DESTROY_STATUS, Nft } from '../entity/nft.entity';
import _ from 'lodash';
import { toNumber } from '../utils/helper';
import { getContract, getJsonRpcProvider } from '../utils/ethers';
import { handleNftToEs } from '../utils/elasticsearch';
import { Logger } from '../utils/log4js';
import { SocksProxyAgent } from 'socks-proxy-agent';
import { mqPublish } from '../utils/rabbitMQ';
import { DataSource } from 'typeorm';
import { getOssOmBase64Client } from './aliyun.oss.service';
import { Readable } from 'stream';

export const base64_reg = /^data:[\s\S]+;base64,/;

/**
 * 插入NFT到ES
 * @param elasticsearchService
 * @param data
 * @returns
 */
export async function insertNftToEs(
  elasticsearchService: any,
  redisService: any,
  datasource: DataSource,
  amqpConnection: any,
  nft: Nft,
) {
  // 同步到ES
  await handleNftToEs(elasticsearchService, [nft]);

  // 同步metadata
  syncMetadata(
    elasticsearchService,
    redisService,
    datasource,
    amqpConnection,
    nft,
  );
}

/**
 * 补全NFT信息
 * @param nft
 */
export async function syncMetadata(
  elasticsearchService: any,
  redisService: any,
  datasource: DataSource,
  amqpConnection: any,
  nft: Nft,
) {
  const redisClient = redisService.getClient();
  // 加锁防止重复处理
  const key = NFT_METADATA_LOCK + ':' + nft.id;
  const value = await redisService.lock(redisClient, key);

  if (!value) {
    return;
  }

  try {
    // 从redis获取contract的属性，是否需要同步metadata，是否有设置tokenuri前缀
    const attributeStr = await redisClient.hget(
      CONTRACT_ATTRIBUTE,
      nft.chain + ':' + nft.token_address,
    );
    let contractArrtibute = {};
    if (attributeStr) {
      contractArrtibute = JSON.parse(attributeStr);
    }

    if (contractArrtibute['no_metadata'] == BOOLEAN_STATUS.YES) {
      return;
    }

    let update = {};
    if (nft.is_destroyed == DESTROY_STATUS.YES) {
      update['is_destroyed'] = DESTROY_STATUS.YES;
    } else {
      update = await getMetaDataUpdate(
        contractArrtibute['token_uri_prefix'] ?? '',
        nft,
      );
    }

    if (_.isEmpty(update)) {
      return;
    }

    // 更新NFT
    await datasource.getRepository(Nft).update(
      { id: nft.id },
      {
        ...update,
        sync_metadata_times: () => 'sync_metadata_times + 1',
      },
    );

    mqPublish(
      amqpConnection,
      datasource,
      redisService,
      RABBITMQ_NFT_EXCHANGE,
      RABBITMQ_NFT_UPDATE_ES_ROUTING_KEY,
      { ...nft, ...update },
    );
  } catch (error) {
    Logger.error({
      title: 'NftService-syncMetadata',
      data: nft,
      error: error + '',
    });
  } finally {
    await redisService.unlock(redisClient, key, value);
  }
}

async function getMetaDataUpdate(tokenUriPrefix: string, nft: Nft) {
  const update = {};
  let tokenUri = '';
  try {
    tokenUri = await getTokenUri(tokenUriPrefix, nft);

    if (tokenUri) {
      update['token_uri'] = tokenUri;
      update['sync_metadata_error'] = '';
      try {
        const metadata = await getMetadata(nft, tokenUri);
        // metadata不为空
        if (!_.isEmpty(metadata)) {
          update['metadata'] = metadata;
          if (!nft.name && metadata.hasOwnProperty('name')) {
            update['name'] = (metadata?.name || '').replace(/\u0000/g, '');
          }
        }
      } catch (e) {
        update['sync_metadata_error'] = e + '';
      }
      if (base64_reg.test(tokenUri)) {
        // base64太长了，不存储
        update['token_uri'] = 'base64 data';
      }
    }
  } catch (e) {
    // token已销毁
    if (e?.reason && e.reason.indexOf('nonexistent') != -1) {
      update['is_destroyed'] = DESTROY_STATUS.YES;
    }
  }

  // 记录更新次数和时间
  update['last_sync_metadata_time'] = new Date();
  return update;
}

async function getTokenUri(tokenUriPrefix: string, nft: Nft) {
  let tokenUri = '';
  if (tokenUriPrefix) {
    // 直接拼接uri
    tokenUri = tokenUriPrefix + nft.token_id;
  } else {
    const provider = getJsonRpcProvider(toNumber(CHAIN[nft.chain]));
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
    metadata = JSON.parse(Buffer.from(base64, 'base64').toString());
  } else {
    // 本地需要设置proxy
    const response = await axios({
      url: tokenUri,
      method: 'get',
      ...(process.env.PROXY === 'true'
        ? { httpsAgent: new SocksProxyAgent(process.env.PROXY_HOST) }
        : {}),
    });
    metadata = response?.data;
  }

  if (typeof metadata == 'string') {
    try {
      metadata = JSON.parse(metadata);
    } catch (error) {}
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
    const client = getOssOmBase64Client();
    const stream = Readable.from(metadata.image);
    const result = await client.putStream(
      `${nft.chain}/${nft.token_address}/${nft.token_id}`.toLowerCase(),
      stream,
    );
    metadata.image = result.url;
  }
}
