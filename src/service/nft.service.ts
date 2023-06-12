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
  getNftTokenUriKey,
} from '../config/constant';
import { erc1155ContractAbi, erc721ContractAbi } from '../config/abi';
import { CONTRACT_TYPE } from '../entity/contract.entity';
import { Nft } from '../entity/nft.entity';
import _ from 'lodash';
import {
  base64_reg_exp,
  filterData,
  isBase64,
  isValidUrl,
  md5,
} from '../utils/helper';
import { getContract, getJsonRpcProvider } from '../utils/ethers';
import { Logger } from '../utils/log4js';
import { mqPublish } from '../utils/rabbitMQ';
import { DataSource } from 'typeorm';
import { getOssOmBase64Client } from './aliyun.oss.service';
import { Readable } from 'stream';
import { NftResultDto } from '../dto/nft.dto';
import auth from '../config/auth.api';

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
        redisClient,
      );
    }

    if (
      update.is_destroyed == BOOLEAN_STATUS.NO &&
      _.isEmpty(update.metadata)
    ) {
      // 未销毁并且metadata为空，不处理
      return;
    }

    // 先存redis，利用定时任务批量更新
    await redisClient.rpush(NFT_UPDATE_LIST, JSON.stringify(update));

    return update;
  } catch (error) {
    Logger.warn({
      title: 'NftService-syncMetadata',
      data: { nft, node: error['node'] },
      error: error,
    });

    if (nft['times'] && nft['times'] >= 3) {
      return;
    }

    nft['times'] = (nft['times'] ?? 0) + 1;

    // 推送到延时队列
    await mqPublish(
      amqpConnection,
      datasource,
      redisService,
      RABBITMQ_DELAY_EXCHANGE,
      RABBITMQ_NFT_METADATA_ROUTING_KEY,
      { ...nft, token_uri: '', metadata: {} },
      {
        headers: {
          // 5-10分钟
          'x-delay': Math.ceil(5 * 60 * 1000 * (1 + Math.random())),
        },
      },
    );
  } finally {
    await redisService.unlock(redisClient, key, value);
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
  redisClient: any,
) {
  let tokenUri = '';
  tokenUri = await getTokenUri(tokenUriPrefix, nft, redisClient);
  if (tokenUri) {
    // 保存tokenuri
    await redisClient.setex(
      getNftTokenUriKey(nft.chain, nft.token_address, nft.token_hash),
      3600,
      tokenUri,
    );

    const metadata = await getMetadata(nft, tokenUri);
    // metadata不为空
    if (!_.isEmpty(metadata)) {
      update.metadata = metadata;
      if (metadata.hasOwnProperty('name')) {
        if (typeof metadata.name == 'string') {
          update.name = metadata.name.replace(/\u0000/g, '');
        } else {
          // 有些名字是数字
          update.name = metadata.name + '';
        }
      }
      if (isBase64(tokenUri)) {
        // base64太长了，不存储
        update.token_uri = 'base64 data';
      } else {
        update.token_uri = tokenUri;
      }
    }
  }
}

async function getTokenUri(tokenUriPrefix: string, nft: Nft, redisClient: any) {
  const cache = await redisClient.get(
    getNftTokenUriKey(nft.chain, nft.token_address, nft.token_hash),
  );
  if (cache) {
    return cache;
  }

  let tokenUri = '';
  if (tokenUriPrefix) {
    // 直接拼接uri
    tokenUri = tokenUriPrefix + nft.token_id;
  } else {
    let provider = null;
    try {
      // 设置5秒超时
      provider = getJsonRpcProvider(CHAINS[nft.chain], 5);
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
    } catch (error) {
      error['node'] = provider ? provider['node'] : '';
      throw error;
    }
  }

  if (tokenUri) {
    tokenUri = formatUri(tokenUri, nft.token_id);
  }

  return tokenUri;
}

/**
 * 替换特殊字符
 * 替换{id}
 * 替换协议
 * @param uri
 * @param tokenId
 * @returns
 */
function formatUri(uri: string, tokenId: string) {
  uri = uri
    .replace(/\u0000/g, '')
    .replace('{id}', tokenId)
    .replace('ipfs://', 'https://cloudflare-ipfs.com/ipfs/');
  return uri;
}

async function getMetadata(nft: Nft, tokenUri: string) {
  let metadata: any;
  // 有些tokenUri是base64编码，这种情况无需使请求接口
  if (isBase64(tokenUri)) {
    const base64 = tokenUri.replace(base64_reg_exp, '');
    const string = Buffer.from(base64, 'base64').toString();
    try {
      metadata = JSON.parse(string);
    } catch (error) {
      // 解析不了的就不处理了
    }
  } else if (!isValidUrl(tokenUri)) {
    // 非有效url
    return;
  } else {
    nft.token_uri = tokenUri;
    // 设置5秒超时
    const response = await axios({
      method: 'GET',
      url: tokenUri,
      timeout: 5000,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36',
      },
      proxy: {
        protocol: 'http',
        host: process.env.PROXY_HOST,
        port: eval(process.env.PROXY_PORT),
        auth: {
          username: process.env.PROXY_AUTH_USERNAME,
          password: process.env.PROXY_AUTH_PASSWORD,
        },
      },
    });

    // 响应为一个图片
    if (
      response?.headers['content-type'] &&
      response.headers['content-type'].startsWith('image')
    ) {
      return;
    }

    metadata = response?.data;
  }

  if (typeof metadata == 'string') {
    try {
      metadata = JSON.parse(metadata);
    } catch (error) {
      // 解析不了的就不处理了
    }
  }

  if (!(metadata && typeof metadata === 'object')) {
    metadata = {};
  }

  await checkMetadataImg(metadata, nft);

  return metadata;
}

export async function checkMetadataImg(metadata: any, nft: Nft) {
  // 递归metadata里的所有字段，把base64全部存到oss
  if (typeof metadata == 'object') {
    if (metadata.hasOwnProperty('image') && isBase64(metadata['image'])) {
      const stream = Readable.from(metadata['image']);
      const client = getOssOmBase64Client({});
      const result = (await client.putStream(
        `${nft.chain}/${nft.token_address}/${nft.token_id}`.toLowerCase(),
        stream,
      )) as any;
      metadata['image'] = result.url;
    }
    await traverse(metadata, nft);
  }
}

// base64设置为空
async function traverse(obj: object, nft: Nft) {
  for (const key in obj) {
    if (obj[key] !== null && typeof obj[key] === 'object') {
      // 对象类型，递归遍历
      await traverse(obj[key], nft);
    } else {
      // 非对象类型，判断是否为base64编码
      if (typeof obj[key] === 'string' && isBase64(obj[key])) {
        obj[key] = '';
      }
    }
  }
}
