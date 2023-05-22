import {
  RABBITMQ_DELAY_EXCHANGE,
  RABBITMQ_METADATA_SYNC_EXCHANGE,
  RABBITMQ_NFT_EXCHANGE,
  RABBITMQ_SYNC_NFT_EXCHANGE,
  RABBITMQ_SYNC_TRANSFER_EXCHANGE,
  RABBITMQ_TRANSFER_EXCHANGE,
  REDIS_NAMESPACE_MORALIS,
} from './constant';

export default () => ({
  app_name: process.env.APP_NAME || 'data_micro_service',
  port: eval(process.env.PORT ?? '3001'),
  moralis_api_key: process.env.MORALIS_API_KEY,
  support_chain_ids: process.env.SUPPORT_CHAINS,
  database: {
    postgres: {
      type: 'postgres',
      host: process.env.POSTGRES_HOST || 'localhost',
      port: eval(process.env.POSTGRES_PORT ?? '5432'),
      username: process.env.POSTGRES_USERNAME || 'root',
      password: process.env.POSTGRES_PASSWORD || 'root',
      database: process.env.POSTGRES_DATABASE || 'test',
      schema: process.env.POSTGRES_SCHEMA || 'test',
      autoLoadEntities: true,
    },
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: eval(process.env.REDIS_PORT ?? '6379'),
    db: eval(process.env.REDIS_DB ?? '9'),
    username: process.env.REDIS_USER_NAME || '',
    password: process.env.REDIS_PASSWORD || '',
    keyPrefix: `nft_sync_om:${process.env.APP_ENV}:` || 'redis',
  },
  redis_moralis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: eval(process.env.REDIS_PORT ?? '6379'),
    db: 0,
    username: process.env.REDIS_USER_NAME || '',
    password: process.env.REDIS_PASSWORD || '',
    keyPrefix: REDIS_NAMESPACE_MORALIS + ':',
  },
  queue: {
    prefix:
      `nft_sync_om:${process.env.APP_ENV}:${process.env.QUEUE_PREFIX}` ||
      'queue',
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: eval(process.env.REDIS_PORT ?? '6379'),
      db: eval(process.env.REDIS_QUEUE_DB ?? '8'),
      username: process.env.REDIS_USER_NAME || '',
      password: process.env.REDIS_PASSWORD || '',
    },
    settings: {
      maxStalledCount: 0,
    },
    options: {
      attempts: eval(process.env.QUEUE_ATTEMPTS ?? '3'),
      removeOnComplete: eval(process.env.QUEUE_REMOVE_ON_COMPLETE || 'true'),
      removeOnFail: eval(process.env.QUEUE_REMOVE_ON_FAIL || 'true'),
      backoff: {
        type: process.env.QUEUE_BACKOFF_TYPE || 'fixed',
        delay: eval(process.env.QUEUE_BACKOFF_DELAY ?? '3000'),
      },
    },
  },
  elasticsearch: {
    node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
  },
  dingding: {
    default: {
      webhook: process.env.DINGDING_ROBOT_WEBHOOK,
      secret: process.env.DINGDING_ROBOT_SECRET,
    },
  },
  rabbitMQ: {
    exchanges: [
      {
        name: RABBITMQ_SYNC_NFT_EXCHANGE,
        type: 'direct',
      },
      {
        name: RABBITMQ_SYNC_TRANSFER_EXCHANGE,
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
      // 声明一个延时队列交换机
      {
        name: RABBITMQ_DELAY_EXCHANGE,
        type: 'x-delayed-message',
        options: {
          arguments: {
            'x-delayed-type': 'direct',
          },
        },
      },
    ],
    uri: process.env.RABBITMQ_URI,
    connectionInitOptions: { wait: false },
    enableDirectReplyTo: false,
    // 默认每个队列消费者为1
    prefetchCount: 1,
  },
});
