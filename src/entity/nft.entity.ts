import { Column, Entity, Index } from 'typeorm';
import { CommonEntity } from './common.entity';

@Entity('nfts')
@Index(['chain', 'token_hash'], { unique: true })
@Index(['updated_at'])
@Index(['chain', 'token_address', 'id'])
export class Nft extends CommonEntity {
  @Column('varchar', { default: '', comment: '区块链类型' })
  chain;

  @Column('varchar', { default: '', comment: 'nft哈希 - md5(address+id)' })
  token_hash;

  @Column('varchar', { default: '', comment: '合约地址' })
  token_address;

  @Column('varchar', { default: '', comment: 'nft uri' })
  token_uri;

  @Column('varchar', { default: '', comment: 'nft id' })
  token_id;

  @Column('int', { default: 0, comment: '铸造区块高度' })
  block_number_minted;

  @Column('int', { default: 0, comment: '当前区块高度' })
  block_number;

  @Column({
    type: 'numeric',
    precision: 100,
    scale: 0,
    default: 0,
    comment: 'nft 数量',
  })
  amount;

  @Column('varchar', { default: '', comment: '合约类型' })
  contract_type;

  @Column('varchar', { default: '', comment: 'nft名称' })
  name;

  @Column('varchar', { default: '', comment: '币种标识' })
  symbol;

  @Column('json', { default: {}, comment: 'nft元数据' })
  metadata;

  @Column('smallint', { default: 0, comment: '是否被销毁（0-否，1-是）' })
  is_destroyed;

  @Column('varchar', { default: '', comment: '同步元数据失败的原因' })
  sync_metadata_error;

  @Column('int', { default: 0, comment: '同步元数据的次数' })
  sync_metadata_times;

  @Column('timestamp', { comment: '最后一次同步元数据的时间' })
  last_sync_metadata_time;

  @Column('int', { default: 0, comment: '转移log index' })
  transfer_log_index;
}

export enum DESTROY_STATUS {
  NO,
  YES,
}

export function getSimpleNft(nft) {
  // 需要创建新对象，避免原对象修改后影响后续操作
  const simpleNft = { ...nft };
  delete simpleNft.id;
  delete simpleNft.created_at;
  delete simpleNft.updated_at;
  delete simpleNft.version;
  delete simpleNft.sync_metadata_error;
  return simpleNft;
}
