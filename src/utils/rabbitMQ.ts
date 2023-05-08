import { MQPushErrorLogs } from '../entity/mq.push.error.entity';
import { DataSource } from 'typeorm';
import { Logger } from './log4js';
import { MQ_PUSH_LOCK, MQ_REPUSH_LOCK } from '../config/constant';

export async function mqPublish(
  amqpConnection: any,
  datasource: DataSource,
  redisService: any,
  exchange: string,
  routingKey: string,
  data: any,
  options?: object,
) {
  const redisClient = redisService.getClient();

  while (!(await lock(redisClient))) {}

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
      error: err,
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

    await redisClient.del(MQ_REPUSH_LOCK);
    return false;
  }
  return true;
}

async function lock(redisClient: any) {
  // 限流
  const lua = `
    if redis.call('exists', KEYS[1]) < 1 then
      redis.call('setex', KEYS[1], ARGV[1], 1)
    else
      local times = redis.call('get', KEYS[1])
      if tonumber(times) > tonumber(ARGV[2]) then
        return 0
      else
        redis.call('incr', KEYS[1])
      end
    end
    return 1
  `;

  // 本服务限制300次/秒【MQ服务TPS为1000次/秒】
  return await redisClient.eval(lua, 1, MQ_PUSH_LOCK, 1, 500);
}
