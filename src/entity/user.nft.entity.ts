import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { CommonEntity } from './common.entity';
import { Nft } from './nft.entity';

@Entity('user_nfts')
@Index(['chain', 'owner_hash'], { unique: true })
@Index(['updated_at'])
@Index(['chain', 'token_hash'])
@Index(['chain', 'token_address'])
export class UserNft extends CommonEntity {
  // 需要按chain分区，所以要设置primary
  @Column('varchar', { default: '', comment: '区块链类型', primary: true })
  chain: string;

  @Column('varchar', { default: '', comment: '合约地址' })
  token_address: string;

  @Column('varchar', { default: '', comment: 'nft id' })
  token_id: string;

  @Column({
    type: 'numeric',
    precision: 100,
    scale: 0,
    default: 0,
    comment: 'nft 数量',
  })
  amount: number;

  @Column('varchar', { default: '', comment: '拥有者地址' })
  user_address: string;

  @Column('varchar', { default: '', comment: '合约类型' })
  contract_type: string;

  @Column('int', { default: 0, comment: '当前区块高度' })
  block_number: number;

  @Column('varchar', { default: '', comment: 'nft哈希 - md5(address+id)' })
  token_hash: string;

  @Column('int', { default: 0, comment: '转移log index' })
  transfer_log_index: number;

  @Column('varchar', {
    default: '',
    comment: 'owner哈希 - md5(address+id+user_address)',
  })
  owner_hash: string;

  // createForeignKeyConstraints:false 不生成外键
  @ManyToOne(() => Nft, { createForeignKeyConstraints: false })
  @JoinColumn([
    { name: 'chain', referencedColumnName: 'chain' },
    { name: 'token_hash', referencedColumnName: 'token_hash' },
  ])
  nft: Nft;
}
