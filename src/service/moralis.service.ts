import { MORALIS_SUPPORT_CHAIN } from '../config/constant';
import Moralis from 'moralis';
import { sleep, toNumber } from '../utils/helper';
import {
  LOCK_FAILED,
  MORALIS_API_MINUTE_LIMIT_KEY,
  MORALIS_API_MINUTE_LIMIT_TIMES,
  MORALIS_API_MINUTE_LIMIT_TTL,
  MORALIS_API_SECOND_IP_LIMIT_KEY,
  MORALIS_API_SECOND_IP_LIMIT_TIMES,
  MORALIS_API_SECOND_IP_LIMIT_TTL,
  MORALIS_API_SECOND_LIMIT_KEY,
  MORALIS_API_SECOND_LIMIT_TIMES,
  MORALIS_API_SECOND_LIMIT_TTL,
  NOT_SUPPORT_CHAIN,
  REDIS_MORALIS_NAME,
} from '../config/constant';
import { Logger } from '../utils/log4js';
import {
  EvmChainish,
  GetContractNFTsRequest,
  GetNFTMetadataRequest,
  GetNFTOwnersRequest,
} from '@moralisweb3/common-evm-utils';
import dotenv from 'dotenv';

// 加载 .env 文件中的环境变量
dotenv.config();

Moralis.start({
  apiKey: process.env.MORALIS_API_KEY,
});

/**
 * 获取nft拥有者
 * @param options
 */
export async function getNFTOwners(
  redisService: any,
  options: GetNFTOwnersRequest,
) {
  return await callTokenApi('getNFTOwners', options, redisService);
}

/**
 * 获取nft
 * @param options
 */
export async function getContractNFTs(
  redisService: any,
  options: GetContractNFTsRequest,
) {
  return await callTokenApi('getContractNFTs', options, redisService);
}

/**
 * 获取nft信息
 * @param options
 */
export async function getNFTMetadata(
  redisService: any,
  options: GetNFTMetadataRequest,
) {
  return await callTokenApi('getNFTMetadata', options, redisService);
}

/**
 * 过滤不支持的链
 * @param chainId
 * @returns
 */
function isSupportChain(chainId: EvmChainish) {
  return Object.values(MORALIS_SUPPORT_CHAIN).indexOf(toNumber(chainId)) !== -1;
}

/**
 * 发起token-api请求
 * @param method
 * @param options
 */
async function callTokenApi(method: string, options: any, redisService: any) {
  if (!isSupportChain(options.chain)) {
    // moralis不支持的链
    return NOT_SUPPORT_CHAIN;
  }

  const key = MORALIS_API_SECOND_IP_LIMIT_KEY + ':' + process.env.APP_NAME;
  const redisClient = redisService.getClient(REDIS_MORALIS_NAME);
  try {
    const lock = await getLock(redisClient, key, method);
    // 没获得锁
    if (lock === LOCK_FAILED) {
      return LOCK_FAILED;
    }

    const response = await Moralis.EvmApi.nft[method](options);
    // 转换为rest-api数据格式
    return response?.raw;
  } catch (e) {
    await logApiError(redisClient, method, options, key, e);
    throw e;
  }
}

/**
 * 获得锁
 * @param key
 * @param method
 * @param wait
 */
async function getLock(
  redisClient: any,
  key: string,
  method: string,
  wait = 0,
) {
  if (wait > 3 * 1000) {
    // 3秒内没获得锁，断开请求
    return LOCK_FAILED;
  }
  // 每秒/分钟都有频率限制
  const incr = getRateLimit(method);
  const lockRes = await lock(
    redisClient,
    MORALIS_API_SECOND_LIMIT_KEY,
    key,
    MORALIS_API_MINUTE_LIMIT_KEY,
    incr,
    MORALIS_API_SECOND_LIMIT_TTL,
    MORALIS_API_SECOND_LIMIT_TIMES,
    MORALIS_API_SECOND_IP_LIMIT_TTL,
    MORALIS_API_SECOND_IP_LIMIT_TIMES,
    MORALIS_API_MINUTE_LIMIT_TTL,
    MORALIS_API_MINUTE_LIMIT_TIMES,
  );
  // 未获得锁
  if (!lockRes) {
    const waitTime = 100;
    wait += 100;
    await sleep(waitTime);
    return await getLock(redisClient, key, method, wait);
  }
  return true;
}

/**
 * 记录错误日志
 * @param method
 * @param options
 * @param ipLimitKey
 * @param e
 */
async function logApiError(
  redisClient: any,
  method: string,
  options: any,
  ipLimitKey: string,
  e: any,
) {
  const message = { method, options };
  message[ipLimitKey] = await redisClient.get(ipLimitKey);
  message[MORALIS_API_SECOND_LIMIT_KEY] = await redisClient.get(
    MORALIS_API_SECOND_LIMIT_KEY,
  );
  message[MORALIS_API_MINUTE_LIMIT_KEY] = await redisClient.get(
    MORALIS_API_MINUTE_LIMIT_KEY,
  );
  message['error'] = e + '';
  Logger.error({
    title: 'moralis-error',
    data: {},
    error: message,
  });
}

/**
 * 获取每个方法的对应的请求次数
 * https://docs.moralis.io/misc/rate-limit
 * @param method
 */
function getRateLimit(method: string): number {
  const rateLimit = {
    getNFTOwners: 5,
    getNFTMetadata: 5,
    getContractNFTs: 5,
  };
  return rateLimit[method] ?? 5;
}

/**
 * 分布式锁
 * @param secondKey
 * @param secondIpKey
 * @param minuteKey
 * @param incr
 * @param secondTtl
 * @param secondLimit
 * @param secondIpTtl
 * @param secondIpLimit
 * @param minuteTtl
 * @param minuteLimit
 */
async function lock(
  redisClient: any,
  secondKey: string,
  secondIpKey: string,
  minuteKey: string,
  incr: number,
  secondTtl: number,
  secondLimit: number,
  secondIpTtl: number,
  secondIpLimit: number,
  minuteTtl: number,
  minuteLimit: number,
) {
  const lua = `
    if redis.call('exists', KEYS[1]) < 1 then
      redis.call('setex', KEYS[1], ARGV[2], ARGV[1])
    else
      local times = redis.call('get', KEYS[1])
      if tonumber(times) > tonumber(ARGV[3] - ARGV[1]) then
        return 0
      end
      redis.call('incrby', KEYS[1], ARGV[1])
    end
    if redis.call('exists', KEYS[2]) < 1 then
      redis.call('setex', KEYS[2], ARGV[4], ARGV[1])
    else
      local ipTimes = redis.call('get', KEYS[2])
      if tonumber(ipTimes) > tonumber(ARGV[5] - ARGV[1]) then
        return 0
      end
      redis.call('incrby', KEYS[2], ARGV[1])
    end
    if redis.call('exists', KEYS[3]) < 1 then
      redis.call('setex', KEYS[3], ARGV[6], ARGV[1])
    else
      local minuteTimes = redis.call('get', KEYS[3])
      if tonumber(minuteTimes) > tonumber(ARGV[7] - ARGV[1]) then
        return 0
      end
      redis.call('incrby', KEYS[3], ARGV[1])
    end
    return 1
    `;
  return await redisClient.eval(
    lua,
    3,
    secondKey,
    secondIpKey,
    minuteKey,
    incr,
    secondTtl,
    secondLimit,
    secondIpTtl,
    secondIpLimit,
    minuteTtl,
    minuteLimit,
  );
}
