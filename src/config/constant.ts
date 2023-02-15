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

/********** moralis redis ***********/
export const REDIS_NAMESPACE_MORALIS = 'moralis';

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

/********** contract同步完成触发事件 ***********/
export const EVENT_CONTRACT_SYNC = 'contract.sync';

/********** transfer同步完成触发事件 ***********/
export const EVENT_TRANSFER_SYNC = 'transfer.sync';

/********** nft更新完成触发事件 ***********/
export const EVENT_NFT_SYNC = 'nft.sync';
export const EVENT_NFT_SYNC_METADATA = 'nft.sync.metadata';

/********** nft更新完成触发事件 ***********/
export const EVENT_NFT_SYNC_TO_ES = 'nft.sync.es';
export const EVENT_USER_NFT_SYNC_TO_ES = 'user.nft.sync.es';

/********** 系列hash field ***********/
export const getContractField = (chain: string, address: string) => {
  return chain + '|' + address;
};

/********** 无需同步metadata的系列 ***********/
export const SYNC_METADATA_EXCLUDE = 'sync_metadata_exclude';

export const LOCK_FAILED = -1;
export const RECURSION_LIMIT = -2;

// 新队列，同步metadata
export const SYNC_CONTRACT_METADATA_LOCK = 'sync_contract_metadata_lock';
export const SYNC_CONTRACT_METADATA_RUNNING_LOCK =
  'sync_contract_metadata_running_lock';
export const RABBITMQ_METADATA_SYNC_EXCHANGE = 'metadata_sync_exchange';
export const RABBITMQ_METADATA_SYNC_QUEUE = 'metadata_sync_queue';
export const RABBITMQ_METADATA_SYNC_ROUTING_KEY = 'metadata_sync';

export const RABBITMQ_NFT_EXCHANGE = 'nft_exchange';
export const RABBITMQ_NFT_CREATE_QUEUE = 'nft_create_queue';
export const RABBITMQ_NFT_CREATE_ROUTING_KEY = 'nft_create';
export const RABBITMQ_NFT_SYNC_ROUTING_KEY = 'nft_sync';
export const RABBITMQ_NFT_SYNC_QUEUE = 'nft_sync_queue';

export const RABBITMQ_TRANSFER_EXCHANGE = 'transfer_exchange';
export const RABBITMQ_TRANSFER_SYNC_ROUTING_KEY = 'transfer_sync';
export const RABBITMQ_TRANSFER_HANLDE_ROUTING_KEY = 'transfer_handle';
export const RABBITMQ_TRANSFER_HANLDE_QUEUE = 'transfer_handle_queue';
export const RABBITMQ_TRANSFER_SYNC_QUEUE = 'transfer_sync_queue';

export const NFT_METADATA_LOCK = 'nft_metadata_lock';

export const INTERNAL_CRON_LOCK = 'internal_cron_lock';

export const SYNC_TRANSFER_FIELD = 'sync-transfer';

export const SYNC_NFT_FIELD = 'sync-nft';

export const SYNC_CONTRACT_INFO = 'sync-contract-info';

export const SYNC_METADATA = 'sync-metadata';

export const CONTRACT_SYNC_NOTICE = 'contract_sync_notice';

export const NFT_METADATA_ERROR_LIMIT = 'nft_metadata_error_limit';

export function getMetadataLockKey(contractId: number) {
  return SYNC_CONTRACT_METADATA_LOCK + ':' + contractId;
}

export function getSyncMetadataKey(contractId: number) {
  return SYNC_CONTRACT_METADATA_RUNNING_LOCK + ':' + contractId;
}

export function getTransferSyncKey(chain: string) {
  return SYNC_TRANSFER_LOCK + ':' + chain;
}

export function getContractInitKey(chain: string, address: string) {
  return SYNC_NFT_LOCK + ':' + chain + ':' + address;
}

export const MICRO_SERVICE = 'MICRO_SERVICE';

export interface BalanceData {
  target: string;
  weight: number;
  currentWeight?: number;
}

export type RPC_NODE_TYPE = Record<string, BalanceData[]>;

export const RPC_NODE: RPC_NODE_TYPE = {
  1: [
    {
      target:
        'https://nd-673-616-845.p2pify.com/a636188bb9861ca132c7079dd1cd839c',
      weight: 1,
    },
    {
      target:
        'https://eth-mainnet.g.alchemy.com/v2/kAe2dWmMGiBl-dYbfjrFLzxjtF62kog0',
      weight: 1,
    },
  ],
  56: [
    {
      target:
        'https://nd-895-567-261.p2pify.com/440738727b074fde55a96ca30074afc4',
      weight: 1,
    },
    {
      target:
        'https://bsc-mainnet.nodereal.io/v1/84a707ab278a4dafaab661acae9501cd',
      weight: 1,
    },
    {
      target:
        'https://rpc.ankr.com/bsc/4cffe63aaba4fd15a91bcd9a65a8504fea15d67a0f268a1adb08f7b3a96ca910',
      weight: 1,
    },
  ],
  280: [
    {
      target: 'https://zksync2-testnet.zksync.dev/',
      weight: 1,
    },
  ],
  137: [
    { target: 'https://polygon-rpc.com', weight: 1 },
    {
      target:
        'https://nd-123-547-521.p2pify.com/78a72a408ab74bceb0e5557dc5e29739',
      weight: 1,
    },
  ],
  5: [
    {
      target:
        'https://eth-goerli.g.alchemy.com/v2/Kf2SGWAtzqwWNR9sbO3JJwmAJ55ij_BW',
      weight: 1,
    },
  ],
  42161: [
    {
      target: 'https://arb1.arbitrum.io/rpc',
      weight: 1,
    },
    {
      target:
        'https://arb-mainnet.g.alchemy.com/v2/xtehQ5ogQyEndaah3EcpFnITIzjEjfHj',
      weight: 1,
    },
    {
      target:
        'https://rpc.ankr.com/arbitrum/4cffe63aaba4fd15a91bcd9a65a8504fea15d67a0f268a1adb08f7b3a96ca910',
      weight: 1,
    },
  ],
  421613: [
    {
      target: 'https://goerli-rollup.arbitrum.io/rpc',
      weight: 1,
    },
  ],
};
