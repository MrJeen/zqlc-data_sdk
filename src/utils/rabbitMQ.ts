import { Logger } from './log4js';

export async function mqPublish(
  amqpConnection: any,
  exchange: string,
  routingKey: string,
  data: any,
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
    return false;
  }
  return true;
}
