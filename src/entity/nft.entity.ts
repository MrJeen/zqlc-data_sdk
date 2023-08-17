import { Column, Entity, Index, OneToMany } from 'typeorm';
import { CommonEntity } from './common.entity';
import { UserNft } from './user.nft.entity';

@Entity('nfts')
@Index(['token_hash'], { unique: true })
@Index(['token_address'])
export class Nft extends CommonEntity {
  @Column('int', { default: 0, comment: '区块链id' })
  chain_id: number;

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

  @Column('varchar', { default: '', comment: 'nft元数据(ali oss)' })
  metadata_oss_url: string;

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

  @OneToMany(() => UserNft, (owner: UserNft) => owner.nft)
  owners: UserNft[];
}
