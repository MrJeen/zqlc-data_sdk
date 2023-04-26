import { MQPushErrorLogs } from '../entity/mq.push.error.entity';
import { DataSource } from 'typeorm';
import { Logger } from './log4js';
import { MQ_REPUSH_LOCK } from '../config/constant';

export async function mqPublish(
  amqpConnection: any,
  datasource: DataSource,
  redisService: any,
  exchange: string,
  routingKey: string,
  data: any,
  options?: object,
) {
  try {
    await amqpConnection.publish(exchange, routingKey, data, options);
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
    await datasource.getRepository(MQPushErrorLogs).save({
      exchange,
      routing_key: routingKey,
      data,
      error_msg: err + '',
    });
    // 删除锁
    const redisClient = redisService.getClient();
    await redisClient.del(MQ_REPUSH_LOCK);
    return false;
  }
  return true;
}
