import { md5 } from '../utils/helper';
import {
  COMMON_STATUS,
  RABBITMQ_SYNC_NFT_EXCHANGE,
  getContractSyncSuccessSourceKey,
} from '../config/constant';
import { CONTRACT_SOURCE, Contract } from '../entity/contract.entity';
import { mqPublish } from '../utils/rabbitMQ';
import auth from '../config/auth.api';
import { DataSource } from 'typeorm';
import { ContractSync } from '../entity/contract.sync.entity';

export async function contractSyncNotice(
  amqpConnection: any,
  redisService: any,
  datasource: DataSource,
  contract: Contract,
) {
  // 查询当前系列ID，未通知的三方
  const sourceData = await datasource.getRepository(ContractSync).findBy({
    sync_status: COMMON_STATUS.DEFAULT,
    chain: contract.chain,
    token_address: contract.token_address,
  });

  if (!sourceData.length) {
    return;
  }

  for (const sourceItem of sourceData) {
    // 同步成功，通知三方
    if (sourceItem.source !== CONTRACT_SOURCE.DEFAULT) {
      const publishData = {
        chain_id: contract.chain_id,
        chain: contract.chain,
        token_address: contract.token_address,
        contract_type: contract.contract_type,
        name: contract.name,
        creator: contract.creator,
        is_recommend: contract.is_recommend,
        logo_url: contract.logo_url,
      };

      // rmq推送
      push(
        amqpConnection,
        datasource,
        redisService,
        sourceItem.source,
        publishData,
      );

      // openmeta导入，同步推送到sudo
      if (sourceItem.source === CONTRACT_SOURCE.OPEN_META) {
        push(
          amqpConnection,
          datasource,
          redisService,
          CONTRACT_SOURCE.SUDO,
          publishData,
        );
      }

      // 记录到缓存
      const key = getContractSyncSuccessSourceKey(
        contract.chain,
        contract.token_address,
      );
      const redisClient = redisService.getClient();
      await redisClient.sadd(key, sourceItem.source);
    }

    // 修改同步状态
    await datasource.getRepository(ContractSync).update(sourceItem.id, {
      sync_status: COMMON_STATUS.FINISHED,
    });
  }
}

// rmq推送
async function push(
  amqpConnection: any,
  datasource: DataSource,
  redisService: any,
  source: CONTRACT_SOURCE,
  data: any,
) {
  const routingKey = md5(source + auth[source]);
  await mqPublish(
    amqpConnection,
    datasource,
    redisService,
    RABBITMQ_SYNC_NFT_EXCHANGE,
    routingKey,
    data,
  );
}
