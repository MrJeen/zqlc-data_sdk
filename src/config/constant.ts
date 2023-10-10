import dotenv from 'dotenv';
import { toNumber } from '../utils/helper';

// 加载 .env 文件中的环境变量
dotenv.config();

/********** pm2 0实例 ***********/
export const ZERO_INSTANCE = '0';

/********** transfer同步topic类型 ***********/
export enum FILTER_TOPICS {
  TRANSFER = 'Transfer',
  TRANSFER_SINGLE = 'TransferSingle',
  TRANSFER_BATCH = 'TransferBatch',
}

/********** transfer同步user ***********/
export enum TRANSFER_USER {
  FROM,
  TO,
}

/********** moralis限流锁 ***********/
export const MORALIS_API_SECOND_LIMIT_TTL = 1;
export const MORALIS_API_SECOND_LIMIT_KEY = 'moralis_api_second_limit';
export const MORALIS_API_SECOND_LIMIT_TIMES = 20;

export const MORALIS_API_SECOND_IP_LIMIT_TTL = 5;
export const MORALIS_API_SECOND_IP_LIMIT_KEY = 'moralis_api_second_ip_limit';
export const MORALIS_API_SECOND_IP_LIMIT_TIMES = 50;

export const MORALIS_API_MINUTE_LIMIT_TTL = 60;
export const MORALIS_API_MINUTE_LIMIT_KEY = 'moralis_api_minute_limit';
export const MORALIS_API_MINUTE_LIMIT_TIMES = 1200;

// pm2开启的话，会变成多队列进行
/********** nft同步队列 ***********/
export const SYNC_NFT_QUEUE = 'sync_nft_queue';

/********** nft同步锁，同一个nft不可并行同步数据，以免重复 ***********/
export const SYNC_NFT_LOCK = 'sync_nft_lock';

/********** transfer同步队列 ***********/
export const SYNC_TRANSFER_QUEUE = 'sync_transfer_queue';
export const SYNC_TRANSFER_TO_NFT_QUEUE = 'sync_transfer_to_nft_queue';

/********** transfer同步锁，每条链按顺序同步一个区块，以免重复 ***********/
export const SYNC_TRANSFER_LOCK = 'sync_transfer_lock';

/********** 记录transfer同步的区块 ***********/
export const SYNC_TRANSFER_BLOCK = 'sync_transfer_block';
export const SYNC_TRANSFER_INCR_BLOCK = 'sync_transfer_incr_block';

/********** 加锁同步transfer到nft，避免重复处理 ***********/
export const SYNC_TRANSFER_NFT_LOCK = 'sync_transfer_nft_lock';
export const HANDLE_TRANSFER_NFT_LOCK = 'handle_transfer_nft_lock';

/********** 检查三方-contract是否同步完成 ***********/
export const CHECK_THIRD_CONTRACT_LOCK = 'check_third_contract_lock';
export const SYNC_CONTRACT_INFO_LOCK = 'sync_contract_info_lock';

/********** nft更新完成触发事件 ***********/
export const EVENT_NFT_SYNC = 'nft.sync';
export const EVENT_NFT_SYNC_METADATA = 'nft.sync.metadata';

/********** nft更新完成触发事件 ***********/
export const EVENT_NFT_SYNC_TO_ES = 'nft.sync.es';
export const EVENT_USER_NFT_SYNC_TO_ES = 'user.nft.sync.es';

/********** 无需同步metadata的系列 ***********/
export const SYNC_METADATA_EXCLUDE = 'sync_metadata_exclude';

export const LOCK_FAILED = -1;
export const RECURSION_LIMIT = -2;
export const NOT_SUPPORT_CHAIN = -3;

// 新队列，同步metadata
export const SYNC_CONTRACT_METADATA_LOCK = 'sync_contract_metadata_lock';
export const SYNC_CONTRACT_METADATA_RUNNING_LOCK =
  'sync_contract_metadata_running_lock';
export const RABBITMQ_METADATA_SYNC_EXCHANGE = 'metadata_sync_exchange';
export const RABBITMQ_METADATA_SYNC_QUEUE = 'metadata_sync_queue';
export const RABBITMQ_METADATA_SYNC_ROUTING_KEY = 'metadata_sync';

// 同步某个NFT的metadata
export const RABBITMQ_NFT_METADATA_QUEUE = 'nft_metadata_queue';
export const RABBITMQ_NFT_METADATA_DELAY_QUEUE = 'nft_metadata_delay_queue';
export const RABBITMQ_NFT_METADATA_ROUTING_KEY = 'nft_metadata_routing';

export const RABBITMQ_SYNC_NFT_EXCHANGE = 'sync_nft_exchange';
export const RABBITMQ_SYNC_TRANSFER_EXCHANGE = 'sync_transfer_exchange';

export const RABBITMQ_NFT_EXCHANGE = 'nft_exchange';
// 初始化
export const RABBITMQ_NFT_SYNC_ROUTING_KEY = 'nft_sync';
export const RABBITMQ_NFT_SYNC_QUEUE = 'nft_sync_queue';

export const RABBITMQ_TRANSFER_EXCHANGE = 'transfer_exchange';
// 同步transfer
export const RABBITMQ_TRANSFER_SYNC_ROUTING_KEY = 'transfer_sync';
export const RABBITMQ_TRANSFER_SYNC_QUEUE = 'transfer_sync_queue';

// 处理transfer
export const RABBITMQ_TRANSFER_HANLDE_ROUTING_KEY = 'transfer_handle';
export const RABBITMQ_TRANSFER_HANLDE_QUEUE = 'transfer_handle_queue';

// 延时队列交换机
export const RABBITMQ_DELAY_EXCHANGE = 'delay_exchange';

export const NFT_METADATA_LOCK = 'nft_metadata_lock';

export const INTERNAL_CRON_LOCK = 'internal_cron_lock';

export const SYNC_TRANSFER_FIELD = 'sync-transfer';

export const SYNC_NFT_FIELD = 'sync-nft';

export const SYNC_CONTRACT_INFO = 'sync-contract-info';

export const SYNC_METADATA = 'sync-metadata';

export const CONTRACT_SYNC_NOTICE = 'contract_sync_notice';

export const NFT_METADATA_ERROR_LIMIT = 'nft_metadata_error_limit';

export const SYNC_ALL_CONTRACT_LOCK = 'sync_all_contract_lock';

export const CONTRACT_ATTRIBUTE = 'contract_attribute';

export const CONTRACT_INIT_LOCK = 'contract_init_lock';

export const TRANSFER_HANDLE_LOCK = 'transfer_handle_lock';

export const TRANSFER_HANDLE_STOP_LOCK = 'transfer_handle_stop_lock';

export const MQ_REPUSH_LOCK = 'mq_repush_lock';

export const ALL_CONTRACT_TO_CONTRACT_LOCK = 'all_contract_to_contract_lock';

export const CONTRACT_SYNC_SUCCESS_SOURCE = 'contract_source';

export const NFT_UPDATE_LIST = 'nft_update_list';

export const USER_UPDATE_LIST = 'user_update_list';

export const NFT_SYNC_RECURSION_LIMIT = 'nft_sync_recursion_limit';

export const SYNC_CONTRACT_LIMIT = 'sync_contract_limit';

export const SYNC_NFT_ES_AFTER = 'sync_nft_es_after';

export const SYNC_NFT_LAST_TIME = 'sync_nft_last_time';

export const CONTRACTS = 'contracts';

export const INIT_CONTRACTS = 'init_contracts';

export const MQ_PUSH_LOCK = 'mq_push_lock';

export function getMetadataLockKey(contractId: number) {
  return SYNC_CONTRACT_METADATA_LOCK + ':' + contractId;
}

export function getSyncMetadataKey(contractId: number) {
  return SYNC_CONTRACT_METADATA_RUNNING_LOCK + ':' + contractId;
}

export function getTransferSyncKey(chainId: number) {
  return SYNC_TRANSFER_LOCK + ':' + chainId;
}

export function getContractInitKey(chainId: number, address: string) {
  return SYNC_NFT_LOCK + ':' + chainId + ':' + address;
}

export function getTransferHandleLockKey(chainId: number) {
  return TRANSFER_HANDLE_LOCK + ':' + chainId;
}

export function getTransferHandleStopKey(chainId: number) {
  return TRANSFER_HANDLE_STOP_LOCK + ':' + chainId;
}

export function getNftTokenUriKey(
  chainId: number,
  address: string,
  tokenHash: string,
) {
  return 'token_uri' + ':' + chainId + ':' + address + ':' + tokenHash;
}

export function getContractSyncSuccessSourceKey(
  chainId: number,
  address: string,
) {
  return CONTRACT_SYNC_SUCCESS_SOURCE + ':' + chainId + ':' + address;
}

export function getContractsKey(chainId: number) {
  return CONTRACTS + ':' + chainId;
}

export const MICRO_SERVICE = 'MICRO_SERVICE';

export const REDIS_MORALIS_NAME = 'moralis';

export const REDIS_OPENSEA_NAME = 'opensea';

export type BALANCE_TYPE = {
  target: string;
  weight?: number;
  currentWeight?: number;
};

export type RPC_NODE_TYPE = Record<string, BALANCE_TYPE[]>;

export type NETWORK_TYPE = {
  name: string;
  chainId: number;
  transferIncr: number;
};

export const ETH_NETWORK: NETWORK_TYPE = {
  name: 'ETH',
  chainId: 1,
  transferIncr: 5,
};

export const GOERLI_NETWORK: NETWORK_TYPE = {
  name: 'GOERLI',
  chainId: 5,
  transferIncr: 10,
};

export const BSC_NETWORK: NETWORK_TYPE = {
  name: 'BSC',
  chainId: 56,
  transferIncr: 8,
};

export const POLYGON_NETWORK: NETWORK_TYPE = {
  name: 'POLYGON',
  chainId: 137,
  transferIncr: 10,
};

export const ZKSYNC_NETWORK: NETWORK_TYPE = {
  name: 'ZKSYNC',
  chainId: 280,
  transferIncr: 10,
};

export const ZKSYNC_MAINNET_NETWORK: NETWORK_TYPE = {
  name: 'ZKSYNC_MAINNET',
  chainId: 324,
  transferIncr: 10,
};

export const ARBITRUM_NETWORK: NETWORK_TYPE = {
  name: 'ARBITRUM',
  chainId: 42161,
  transferIncr: 1000,
};

export const ARBITRUM_TEST_NETWORK: NETWORK_TYPE = {
  name: 'ARBITRUM_TEST',
  chainId: 421613,
  transferIncr: 1000,
};

export const SEPOLIA_NETWORK: NETWORK_TYPE = {
  name: 'SEPOLIA',
  chainId: 11155111,
  transferIncr: 5,
};

export const OPTIMISM_NETWORK: NETWORK_TYPE = {
  name: 'OPTIMISM',
  chainId: 10,
  transferIncr: 10,
};

export const LINEA_NETWORK: NETWORK_TYPE = {
  name: 'LINEA',
  chainId: 59144,
  transferIncr: 5,
};

export const BASE_NETWORK: NETWORK_TYPE = {
  name: 'BASE',
  chainId: 8453,
  transferIncr: 10,
};

export const NETWORKS: NETWORK_TYPE[] = [];

export const CHAINS = {};

const networkMap = {
  [ETH_NETWORK.chainId]: ETH_NETWORK,
  [GOERLI_NETWORK.chainId]: GOERLI_NETWORK,
  [BSC_NETWORK.chainId]: BSC_NETWORK,
  [POLYGON_NETWORK.chainId]: POLYGON_NETWORK,
  [ZKSYNC_NETWORK.chainId]: ZKSYNC_NETWORK,
  [ZKSYNC_MAINNET_NETWORK.chainId]: ZKSYNC_MAINNET_NETWORK,
  [ARBITRUM_NETWORK.chainId]: ARBITRUM_NETWORK,
  [ARBITRUM_TEST_NETWORK.chainId]: ARBITRUM_TEST_NETWORK,
  [SEPOLIA_NETWORK.chainId]: SEPOLIA_NETWORK,
  [OPTIMISM_NETWORK.chainId]: OPTIMISM_NETWORK,
  [LINEA_NETWORK.chainId]: LINEA_NETWORK,
  [BASE_NETWORK.chainId]: BASE_NETWORK,
};

function initNetworks(chainIds: number[]) {
  if (chainIds.length) {
    for (const chainId of chainIds) {
      const network = networkMap[chainId];
      if (!network) {
        continue;
      }
      NETWORKS.push(network);
      CHAINS[chainId] = network.name;
      CHAINS[network.name] = chainId;
    }
  }
}

// 初始化chain配置
const supportChains = process.env.SUPPORT_CHAINS.split(',')
  .filter((item, index, self) => item != '' && self.indexOf(item) === index)
  .map((item) => toNumber(item));
initNetworks(supportChains);

/**
 * 获取网络
 * @param chainId
 * @returns
 */
export function selectNetwork(chainId: number): NETWORK_TYPE {
  const network = NETWORKS.find((network) => network.chainId == chainId);
  if (!network) {
    throw Error(`network #${chainId} not found`);
  }
  return network;
}

export enum COMMON_STATUS {
  DEFAULT = 0,
  DOING = 10,
  FINISHED = 20,
  FAILED = 99,
}

export enum BOOLEAN_STATUS {
  NO,
  YES,
}

/**
 * moralis支持的链
 */
export const MORALIS_SUPPORT_CHAIN = {
  ETH: 1,
  GOERLI: 5,
  SEPOLIA: 11155111,
  POLYGON: 137,
  MUMBAI: 80001,
  BSC: 56,
  BSC_TESTNET: 97,
  AVALANCHE: 43114,
  FANTOM: 250,
  CRONOS: 25,
  PALM: 11297108109,
  ARBITRUM: 42161,
};

export function getDatabaseName(chainId: number) {
  return `${chainId}_database`;
}
