import axios from 'axios';
import {
  BOOLEAN_STATUS,
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
  checkRpcError,
  filterData,
  getTableSuffix,
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
    nft.chain_id + ':' + nft.token_address,
  );
  let contractArrtibute = {};
  if (attributeStr) {
    contractArrtibute = JSON.parse(attributeStr);
  }

  const tokenUriKey = getNftTokenUriKey(
    nft.chain_id,
    nft.token_address,
    nft.token_hash,
  );

  try {
    if (contractArrtibute['no_metadata'] == BOOLEAN_STATUS.YES) {
      return;
    }

    // 获取表后缀
    const tableSuffix = getTableSuffix(nft.token_address);

    const update = {
      table_suffix: tableSuffix,
      id: nft.id,
      token_uri: '',
      name: '',
      metadata: {},
      metadata_oss_url: '',
    };

    // 未销毁才需要查询metadata
    await getMetaDataUpdate(
      update,
      contractArrtibute['token_uri_prefix'] ?? '',
      nft,
      redisClient,
    );

    if (_.isEmpty(update.metadata)) {
      // 未销毁并且metadata为空，不处理
      // 删除tokenuri缓存
      await redisClient.del(tokenUriKey);
      return;
    }

    const path =
      `metadata/${nft.chain_id}/${nft.token_address}/${nft.token_id}`.toLowerCase();

    update.metadata_oss_url = `http://${process.env.OSS_BUCKET}.${process.env.OSS_REGION}.aliyuncs.com/${path}`;

    // 将metadata存OSS
    const stream = Readable.from(JSON.stringify(update.metadata));
    const client = getOssOmBase64Client();
    await client.putStream(path, stream);

    // 推送
    await nftUpdateNotice(amqpConnection, datasource, redisService, nft);

    // 先存redis，利用定时任务批量更新
    await redisClient.rpush(
      `${nft.chain_id}:${NFT_UPDATE_LIST}`,
      JSON.stringify(update),
    );

    // 删除tokenuri缓存
    await redisClient.del(tokenUriKey);
  } catch (error) {
    Logger.warn({
      title: 'NftService-syncMetadata',
      data: { nft, node: error['node'] },
      error: error,
    });

    if (nft['times'] && nft['times'] >= 3) {
      // 删除tokenuri缓存
      await redisClient.del(tokenUriKey);
      return;
    }

    nft['times'] = (nft['times'] ?? 0) + 1;

    // 推送到延时队列
    await mqPublish(
      nft.chain_id,
      amqpConnection,
      datasource,
      redisService,
      RABBITMQ_DELAY_EXCHANGE,
      RABBITMQ_NFT_METADATA_ROUTING_KEY + '_' + nft.chain_id,
      { ...nft, token_uri: '', metadata: {}, amount_list: '', owner_list: '' },
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
  const key = getContractSyncSuccessSourceKey(nft.chain_id, nft.token_address);
  const sources = await redisClient.smembers(key);
  if (!sources.length) {
    return;
  }

  const nftInfo = filterData(NftResultDto, nft);

  for (const source of sources) {
    const routingKey = md5(source + auth[source] + 'update' + nft.chain_id);
    // rmq推送
    await mqPublish(
      nft.chain_id,
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
      getNftTokenUriKey(nft.chain_id, nft.token_address, nft.token_hash),
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
    getNftTokenUriKey(nft.chain_id, nft.token_address, nft.token_hash),
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
      provider = await getJsonRpcProvider(nft.chain_id, 5);
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
      checkRpcError(error, nft.chain_id, provider['node']);
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
    .replace('ar://', 'https://arweave.net/')
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
    return await formatMetadata(metadata);
  }

  // 个别tokenUri是jsonstring
  const utf8_json_reg = /^data:[\s\S]+;utf8,/;
  if (utf8_json_reg.test(tokenUri)) {
    const string = tokenUri.replace(utf8_json_reg, '');
    try {
      metadata = JSON.parse(string);
    } catch (error) {
      // 解析不了的就不处理了
    }
    return await formatMetadata(metadata);
  }

  // 非data格式，亦非有效url
  if (!isValidUrl(tokenUri)) {
    // 非有效url
    return;
  }

  nft.token_uri = tokenUri;

  // 设置5秒超时
  try {
    const response = await axios({
      method: 'GET',
      url: tokenUri,
      timeout: 5000,
      headers: {
        'User-Agent':
          // 带版本号个别url是403，省略版本才可以访问
          'Mozilla/5.0 (...) AppleWebKit/537.36 (...) Chrome/114.0.0.0 Safari/537.36',
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
    return await formatMetadata(metadata);
  } catch (error) {
    Logger.warn({
      title: 'NftService-getMetadata',
      data: {
        id: nft.id,
        token_id: nft.token_id,
        token_address: nft.token_address,
        chain_id: nft.chain_id,
      },
      error: error,
    });
  }
}

// 默认为metadata更新上传
export async function formatMetadata(metadata: any) {
  // 个别metadata是数组，取第一个元素
  metadata = filterArrayMetadata(metadata);

  if (typeof metadata == 'string') {
    try {
      metadata = JSON.parse(metadata);
    } catch (error) {
      metadata = {};
    }
  }

  if (!(metadata && typeof metadata === 'object')) {
    metadata = {};
  }
  return metadata;
}

function filterArrayMetadata(metadata: any) {
  if (_.isArray(metadata)) {
    metadata = metadata[0];
  } else {
    return metadata;
  }
  return filterArrayMetadata(metadata);
}
