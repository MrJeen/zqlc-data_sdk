import {
  RABBITMQ_METADATA_SYNC_EXCHANGE,
  RABBITMQ_NFT_EXCHANGE,
  RABBITMQ_TRANSFER_EXCHANGE,
  REDIS_NAMESPACE_MORALIS,
} from './constant';

export default () => ({
  app_name: process.env.APP_NAME || 'data_micro_service',
  port: ~~process.env.PORT || 3001,
  database: {
    postgres: {
      type: 'postgres',
      useUTC: false,
      host: process.env.POSTGRES_HOST || 'localhost',
      port: ~~process.env.POSTGRES_PORT || 5432,
      username: process.env.POSTGRES_USERNAME || 'root',
      password: process.env.POSTGRES_PASSWORD || 'root',
      database: process.env.POSTGRES_DATABASE || 'test',
      schema: process.env.POSTGRES_SCHEMA || 'test',
      autoLoadEntities: true,
    },
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: ~~process.env.REDIS_PORT || 6379,
    db: ~~process.env.REDIS_DB || 9,
    password: process.env.REDIS_PASSWORD || '',
    keyPrefix: `${process.env.APP_NAME}:${process.env.APP_ENV}:` || 'redis',
  },
  redis_moralis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: ~~process.env.REDIS_PORT || 6379,
    db: 0,
    password: process.env.REDIS_PASSWORD || '',
    keyPrefix: REDIS_NAMESPACE_MORALIS + ':',
  },
  queue: {
    prefix:
      `${process.env.APP_NAME}:${process.env.APP_ENV}:${process.env.QUEUE_PREFIX}` ||
      'queue',
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: ~~process.env.REDIS_PORT || 6379,
      db: ~~process.env.REDIS_QUEUE_DB || 8,
      password: process.env.REDIS_PASSWORD || '',
    },
    settings: {
      maxStalledCount: 0,
    },
    options: {
      attempts: ~~process.env.QUEUE_ATTEMPTS || 3,
      removeOnComplete:
        (process.env.QUEUE_REMOVE_ON_COMPLETE || 'true') === 'true',
      removeOnFail: (process.env.QUEUE_REMOVE_ON_FAIL || 'true') === 'true',
      backoff: {
        type: process.env.QUEUE_BACKOFF_TYPE || 'fixed',
        delay: ~~process.env.QUEUE_BACKOFF_DELAY || 3000,
      },
    },
  },
  moralis: {
    apiKey: process.env.MORALIS_API_KEY || '',
  },
  elasticsearch: {
    node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
  },
  dingding: {
    default: {
      webhook:
        process.env.DINGDING_ROBOT_WEBHOOK ||
        'https://oapi.dingtalk.com/robot/send?access_token=6bafd58f09ff00820f658956319779787de30eda10c93db91c623b7dcb630516',
      secret:
        process.env.DINGDING_ROBOT_SECRET ||
        'SEC09aabe0749dea3cc14bebb0281c89b3e42d7e7b198b016d567dacfd4ff1c69a9',
    },
  },
  rabbitMQ: {
    exchanges: [
      {
        name: process.env.RABBITMQ_NFT_EXCHANGE,
        type: 'direct',
      },
      {
        name: process.env.RABBITMQ_TRANSFER_EXCHANGE,
        type: 'direct',
      },
      {
        name: RABBITMQ_METADATA_SYNC_EXCHANGE,
        type: 'direct',
      },
      {
        name: RABBITMQ_NFT_EXCHANGE,
        type: 'direct',
      },
      {
        name: RABBITMQ_TRANSFER_EXCHANGE,
        type: 'direct',
      },
    ],
    uri: process.env.RABBITMQ_URI,
    connectionInitOptions: { wait: false },
    enableDirectReplyTo: false,
    // 限流（每个进程&每个队列&每次只消费1条消息；大于1时，每个进程，每个队列会同时消费多条消息）
    prefetchCount: 1,
  },
});
