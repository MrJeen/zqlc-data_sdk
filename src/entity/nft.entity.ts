import { Column, Entity, Index, OneToMany } from 'typeorm';
import { CommonEntity } from './common.entity';
import { Transfer } from './transfer.entity';

@Entity('nfts')
@Index(['chain', 'token_hash'], { unique: true })
@Index(['updated_at'])
export class Nft extends CommonEntity {
  // 需要按chain分区，所以要设置primary
  @Column('varchar', { default: '', comment: '区块链类型', primary: true })
  chain: string;

  @Column('varchar', { default: '', comment: 'nft哈希 - md5(address+id)' })
  token_hash: string;

  @Column('varchar', { default: '', comment: '合约地址' })
  token_address: string;

  @Column('varchar', { default: '', comment: 'nft uri' })
  token_uri: string;

  @Column('varchar', { default: '', comment: 'nft id' })
  token_id: string;

  @Column('int', { default: 0, comment: '铸造区块高度' })
  block_number_minted: number;

  @Column('int', { default: 0, comment: '当前区块高度' })
  block_number: number;

  @Column({
    type: 'numeric',
    precision: 100,
    scale: 0,
    default: 0,
    comment: 'nft 数量',
  })
  amount: number;

  @Column('varchar', { default: '', comment: '合约类型' })
  contract_type: string;

  @Column('varchar', { default: '', comment: 'nft名称' })
  name: string;

  @Column('varchar', { default: '', comment: '币种标识' })
  symbol: string;

  @Column('json', { default: {}, comment: 'nft元数据' })
  metadata: object;

  @Column('smallint', { default: 0, comment: '是否被销毁（0-否，1-是）' })
  is_destroyed: number;

  @Column('varchar', { default: '', comment: '同步元数据失败的原因' })
  sync_metadata_error: string;

  @Column('int', { default: 0, comment: '同步元数据的次数' })
  sync_metadata_times: number;

  @Column('timestamp', {
    default: () => 'NOW()',
    comment: '最后一次同步元数据的时间',
  })
  last_sync_metadata_time: Date;

  @Column('int', { default: 0, comment: '转移log index' })
  transfer_log_index: number;

  @OneToMany(() => Transfer, (transfer: Transfer) => transfer.nft)
  transfers: Transfer[];
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
