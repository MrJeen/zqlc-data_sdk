import axios from 'axios';
import {
  BOOLEAN_STATUS,
  CONTRACT_ATTRIBUTE,
  NFT_METADATA_LOCK,
  RABBITMQ_SYNC_NFT_EXCHANGE,
} from '../config/constant';
import { erc1155ContractAbi, erc721ContractAbi } from '../config/abi';
import { UserNft } from '../entity/user.nft.entity';
import { CHAIN, CONTRACT_TYPE, SYNC_STATUS } from '../entity/contract.entity';
import { ContractSync } from '../entity/contract.sync.entity';
import { DESTROY_STATUS, Nft } from '../entity/nft.entity';
import _ from 'lodash';
import { filterData, md5, toNumber } from '../utils/helper';
import { getContract, getJsonRpcProvider, ZERO_ADDRESS } from '../utils/ethers';
import { handleNftToEs, handleUserNftToES } from '../utils/elasticsearch';
import { Logger } from '../utils/log4js';
import { SocksProxyAgent } from 'socks-proxy-agent';
import auth from '../config/auth.api';
import { mqPublish } from '../utils/rabbitMQ';
import { DataSource, Not } from 'typeorm';
import { getOssOmBase64Client } from './aliyun.oss.service';
import { Readable } from 'stream';
import { NftResultDto } from '../dto/nft.dto';

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

    await afterUpdateNft(
      elasticsearchService,
      datasource,
      amqpConnection,
      redisService,
      nft.id,
      update['is_destroyed'] ?? false,
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

export async function afterUpdateNft(
  elasticsearchService: any,
  datasource: DataSource,
  amqpConnection: any,
  redisService: any,
  nftId: string,
  isDestroyed: boolean,
) {
  // 取最新数据
  const nft = await datasource.getRepository(Nft).findOneBy({ id: nftId });
  // 更新NFT-ES
  await handleNftToEs(elasticsearchService, [nft]);

  // 已销毁，nft721重置owner
  if (isDestroyed && nft.contract_type == CONTRACT_TYPE.ERC721) {
    const res = await datasource.getRepository(UserNft).update(
      {
        chain: nft.chain,
        token_hash: nft.token_hash,
        user_address: Not(ZERO_ADDRESS),
      },
      { amount: 0 },
    );

    if (res.affected) {
      const owners = await datasource.getRepository(UserNft).findBy({
        chain: nft.chain,
        token_hash: nft.token_hash,
        user_address: Not(ZERO_ADDRESS),
      });
      if (owners.length) {
        // 更新ES
        await handleUserNftToES(elasticsearchService, owners);
      }
    }
  }

  // 同步到三方
  await syncToThird(datasource, amqpConnection, redisService, nft);
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

async function syncToThird(
  datasource: DataSource,
  amqpConnection: any,
  redisService: any,
  nft: Nft,
) {
  // 通知三方
  await nftUpdateNotice(datasource, amqpConnection, redisService, nft);
}

async function nftUpdateNotice(
  datasource: DataSource,
  amqpConnection: any,
  redisService: any,
  nft: Nft,
) {
  // 查询该contract对应的三方
  const contractData = await datasource
    .getRepository(ContractSync)
    .createQueryBuilder('c')
    .innerJoin('c.contract', 'contract')
    .andWhere({
      token_address: nft.token_address,
      sync_status: SYNC_STATUS.SUCCESS,
    })
    .andWhere(`contract.chain = '${nft.chain}'`)
    .getMany();

  if (!contractData.length) {
    return;
  }

  // 分块处理
  for (const data of _.chunk(contractData, 10)) {
    await Promise.all(
      _.map(data, async (item) => {
        const nftInfo = filterData(NftResultDto, nft);
        nftInfo['chain_id'] = CHAIN[nft.chain];
        const routingKey = md5(
          item['source'] + auth[item['source']] + 'update' + CHAIN[nft.chain],
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
      }),
    );
  }
}
