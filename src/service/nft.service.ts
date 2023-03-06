import axios from 'axios';
import {
  erc1155ContractAbi,
  erc721ContractAbi,
  NFT_METADATA_LOCK,
  SYNC_METADATA_EXCLUDE,
} from '../config';
import {
  CHAIN,
  Contract,
  CONTRACT_TYPE,
  DESTROY_STATUS,
  getSimpleNft,
  Nft,
  SYNC_STATUS,
} from '../entity';
import _ from 'lodash';
import {
  getContract,
  getJsonRpcProvider,
  handleNftToEs,
  handleUserNftToES,
  md5,
  toNumber,
  ZERO_ADDRESS,
} from '../utils';
import { Logger } from '../utils/log4js';
import { SocksProxyAgent } from 'socks-proxy-agent';
import auth from '../config/auth.api';

/**
 * 插入NFT到ES
 * @param elasticsearchService
 * @param data
 * @returns
 */
export async function insertNftToEs(
  elasticsearchService: any,
  redisService: any,
  redisClient: any,
  nftRepository: any,
  userNftRepository: any,
  contractRepository: any,
  contractSyncRepository: any,
  mqPushErrorLogsRepository: any,
  amqpConnection: any,
  nft: Nft,
) {
  // 同步到ES
  await handleNftToEs(elasticsearchService, [nft], []);

  // 同步metadata
  syncMetadata(
    elasticsearchService,
    redisService,
    redisClient,
    nftRepository,
    userNftRepository,
    contractRepository,
    contractSyncRepository,
    mqPushErrorLogsRepository,
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
  redisClient: any,
  nftRepository: any,
  userNftRepository: any,
  contractRepository: any,
  contractSyncRepository: any,
  mqPushErrorLogsRepository: any,
  amqpConnection: any,
  nft: Nft,
) {
  // 加锁防止重复处理
  const key = NFT_METADATA_LOCK + ':' + nft.id;
  const value = await redisService.lock(redisClient, key);

  if (!value) {
    return;
  }

  try {
    nft = await nftRepository.findOneBy({ id: nft.id });
    if (!(await checkSync(redisClient, nft))) {
      return;
    }

    const contract = await contractRepository.findOneBy({
      chain: nft.chain,
      token_address: nft.token_address,
    });

    const update = await getMetaDataUpdate(contract, nft);

    if (_.isEmpty(update)) {
      return;
    }

    await updateNft(
      elasticsearchService,
      nftRepository,
      userNftRepository,
      contractSyncRepository,
      mqPushErrorLogsRepository,
      amqpConnection,
      nft,
      {
        ...update,
        sync_metadata_times: () => 'sync_metadata_times + 1',
      },
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

// 检查是否可同步
async function checkSync(redisClient: any, nft: Nft) {
  if (!nft) {
    return false;
  }

  if (nft.is_destroyed == DESTROY_STATUS.YES) {
    return false;
  }

  // todo 暂时移除
  //   if (!_.isEmpty(nft.metadata)) {
  //     return false;
  //   }

  // 不在同步范围的系列
  const excludeAddress = await redisClient.smembers(SYNC_METADATA_EXCLUDE);

  if (
    excludeAddress.length &&
    excludeAddress.indexOf(nft.token_address) != -1
  ) {
    return false;
  }

  return true;
}

async function getMetaDataUpdate(contract: Contract, nft: Nft) {
  const update = {};
  let tokenUri = '';
  try {
    tokenUri = await getTokenUri(contract, nft);

    if (tokenUri) {
      update['token_uri'] = tokenUri;
      update['sync_metadata_error'] = '';
      try {
        const metadata = await getMetadata(tokenUri);
        // metadata不为空
        if (!_.isEmpty(metadata)) {
          update['metadata'] = metadata;
          if (!nft.name && metadata.hasOwnProperty('name')) {
            update['name'] = metadata?.name || '';
          }
        }
      } catch (e) {
        update['sync_metadata_error'] = e + '';
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

export async function updateNft(
  elasticsearchService: any,
  nftRepository: any,
  userNftRepository: any,
  contractSyncRepository: any,
  mqPushErrorLogsRepository: any,
  amqpConnection: any,
  nft: Nft,
  update: any,
) {
  await nftRepository.update({ id: nft.id }, update);
  // 已销毁，重置owner
  if (update['is_destroyed'] == DESTROY_STATUS.YES) {
    const res = await userNftRepository
      .createQueryBuilder()
      .update(userNftRepository.create({ amount: 0 }))
      .where({
        chain: nft.chain,
        token_hash: nft.token_hash,
      })
      .andWhere('user_address != :userAddress', {
        userAddress: ZERO_ADDRESS,
      })
      .execute();

    if (res.affected) {
      const owners = await userNftRepository
        .createQueryBuilder()
        .where({
          chain: nft.chain,
          token_hash: nft.token_hash,
        })
        .andWhere('user_address != :userAddress', {
          userAddress: ZERO_ADDRESS,
        })
        .getMany();
      let ownerUpdate = [];
      if (owners.length) {
        ownerUpdate = owners.map((owner) => {
          return {
            id: owner.id,
            amount: 0,
          };
        });
      }
      if (ownerUpdate.length) {
        // 更新ES
        await handleUserNftToES(elasticsearchService, [], ownerUpdate);
      }
    }
  }
  // 同步到三方和ES
  await syncToESAndThird(
    elasticsearchService,
    contractSyncRepository,
    mqPushErrorLogsRepository,
    amqpConnection,
    nft,
    update,
  );
}

async function getTokenUri(contract: Contract, nft: Nft) {
  let tokenUri = '';
  if (contract?.token_uri_prefix) {
    // 直接拼接uri
    tokenUri = contract.token_uri_prefix + nft.token_id;
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

async function getMetadata(tokenUri: string) {
  let metadata: any;
  // 有些tokenUri是base64编码，这种情况无需使请求接口
  if (tokenUri.indexOf('data:application/json;base64,') != -1) {
    const base64 = tokenUri.replace('data:application/json;base64,', '');
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
  return metadata;
}

async function syncToESAndThird(
  elasticsearchService: any,
  contractSyncRepository: any,
  mqPushErrorLogsRepository: any,
  amqpConnection: any,
  nft: Nft,
  update: any,
) {
  if (!_.isEmpty(update['metadata'] || update['is_destroyed'])) {
    // 通知三方
    await notice(
      contractSyncRepository,
      mqPushErrorLogsRepository,
      amqpConnection,
      nft,
    );
  }

  // 同步ES
  await handleUserNftToES(
    elasticsearchService,
    [],
    [
      {
        id: nft.id,
        ...update,
      },
    ],
  );
}

async function notice(
  contractSyncRepository: any,
  mqPushErrorLogsRepository: any,
  amqpConnection: any,
  nft: Nft,
  afterId = 0,
  limit = 1000,
) {
  // 查询该contract对应的三方
  const contractData = await contractSyncRepository
    .createQueryBuilder('c')
    .innerJoin('c.contract', 'contract')
    .where('c.id > :afterId', { afterId })
    .andWhere({
      token_address: nft.token_address,
      sync_status: SYNC_STATUS.SUCCESS,
    })
    .andWhere(`contract.chain = '${nft.chain}'`)
    .orderBy('c.id', 'ASC')
    .limit(limit)
    .getMany();

  if (!contractData.length) {
    return;
  }

  const ids = [];

  // 分块处理
  for (const data of _.chunk(contractData, 10)) {
    await Promise.all(
      _.map(data, async (item) => {
        ids.push(item['id']);
        const simpleNft = getSimpleNft(nft);
        simpleNft['chain_id'] = CHAIN[nft.chain];
        const routingKey = md5(
          item['source'] + auth[item['source']] + 'update' + CHAIN[nft.chain],
        );
        // rmq推送
        await mqPublish(
          amqpConnection,
          mqPushErrorLogsRepository,
          process.env.RABBITMQ_NFT_EXCHANGE,
          routingKey,
          simpleNft,
          true,
        );
      }),
    );
  }

  if (contractData.length < limit) {
    // 已是最后一页
    return;
  }

  return await notice(
    contractSyncRepository,
    mqPushErrorLogsRepository,
    amqpConnection,
    nft,
    Math.max(...ids),
  );
}

export async function mqPublish(
  amqpConnection: any,
  mqPushErrorLogsRepository: any,
  exchange: string,
  routingKey: string,
  data: any,
  log = false,
) {
  try {
    amqpConnection.publish(exchange, routingKey, data);
    Logger.info({
      title: 'rabbitmq-publish-success',
      data: {
        exchange,
        routingKey,
        data,
      },
    });
  } catch (err) {
    Logger.error({
      title: 'rabbitmq-publish-error',
      error: err + '',
      data: {
        exchange,
        routingKey,
        data,
      },
    });
    if (log) {
      await mqPushErrorLogsRepository.save({
        exchange,
        routing_key: routingKey,
        data,
        error_msg: err + '',
      });
    }
  }
}