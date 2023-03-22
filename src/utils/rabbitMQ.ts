import { MQPushErrorLogs } from '../entity/mq.push.error.entity';
import { DataSource } from 'typeorm';
import { Logger } from './log4js';

export async function mqPublish(
  amqpConnection: any,
  datasource: DataSource,
  exchange: string,
  routingKey: string,
  data: any,
  log = false,
) {
  try {
    await amqpConnection.publish(exchange, routingKey, data);
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
      await datasource.getRepository(MQPushErrorLogs).save({
        exchange,
        routing_key: routingKey,
        data,
        error_msg: err + '',
      });
    }
    return false;
  }
  return true;
}
