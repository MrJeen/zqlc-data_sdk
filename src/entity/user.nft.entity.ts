import { Column, Entity, Index } from 'typeorm';
import { CommonEntity } from './common.entity';

@Entity('user_nfts')
@Index(['chain', 'user_address', 'token_hash'], { unique: true })
@Index('updated_at')
@Index(['chain', 'token_address', 'token_hash'])
export class UserNft extends CommonEntity {
  @Column('varchar', { default: '', comment: '区块链类型' })
  chain;

  @Column('varchar', { default: '', comment: '合约地址' })
  token_address;

  @Column('varchar', { default: '', comment: 'nft id' })
  token_id;

  @Column({
    type: 'numeric',
    precision: 100,
    scale: 0,
    default: 0,
    comment: 'nft 数量',
  })
  amount;

  @Column('varchar', { default: '', comment: '拥有者地址' })
  user_address;

  @Column('varchar', { default: '', comment: '合约类型' })
  contract_type;

  @Column('int', { default: 0, comment: '当前区块高度' })
  block_number;

  @Column('varchar', { default: '', comment: 'nft哈希 - md5(address+id)' })
  token_hash;

  @Column('int', { default: 0, comment: '转移log index' })
  transfer_log_index;
}
