import { Column, Entity, Index, OneToMany } from 'typeorm';
import { CommonEntity } from './common.entity';
import { ContractSync } from './contract.sync.entity';
import { COMMON_STATUS } from '../config/constant';

@Entity('contracts')
@Index(['token_address'], { unique: true })
export class Contract extends CommonEntity {
  @Column('int', { default: 0, comment: '区块链id' })
  chain_id: number;

  @Column('varchar', { default: '', comment: '合约地址' })
  token_address: string;

  @Column('varchar', { default: '', comment: '合约类型' })
  contract_type: string;

  @Column('varchar', { default: '', comment: '合约名称' })
  name: string;

  @Column('varchar', { default: '', comment: '代币标识' })
  symbol: string;

  @Column('varchar', { default: '', comment: '创建者' })
  creator: string;

  @Column('int', { default: 0, comment: '最后一次同步nft数据的区块高度' })
  last_sync_block_number: number;

  @Column('smallint', {
    default: 0,
    comment: '同步状态（0-未开始 10-同步中 20-同步成功）',
  })
  sync_status: number;

  @Column('smallint', { default: 0, comment: '来源（0-默认，1-open_meta）' })
  source: number;

  @Column('varchar', { default: '', comment: '同步nft的偏移量' })
  cursor: string;

  @Column('varchar', { default: '', comment: 'tokenUri前缀' })
  token_uri_prefix: string;

  @Column('smallint', { default: 0, comment: '需要全量同步metadata' })
  full_sync: number;

  @Column('smallint', { default: 0, comment: '不需要同步metadata' })
  no_metadata: number;

  @Column('smallint', { default: 0, comment: '是否推荐（0：否，1：是）' })
  is_recommend: number;

  @Column('varchar', { default: '', comment: 'logo url' })
  logo_url: string;

  @OneToMany(
    () => ContractSync,
    (contractSync: ContractSync) => contractSync.contract,
  )
  contractSyncs: ContractSync[];
}

export enum CONTRACT_TYPE {
  ERC721 = 'ERC721',
  ERC1155 = 'ERC1155',
}

export enum CONTRACT_SOURCE {
  DEFAULT,
  OPEN_META = 1000,
  SUDO = 2000,
}

// 可同步nft
export const canSyncStatus = [COMMON_STATUS.DEFAULT, COMMON_STATUS.DOING];
export const canSyncNft = (status) => {
  return canSyncStatus.indexOf(status) !== -1;
};
