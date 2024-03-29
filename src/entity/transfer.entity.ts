import { Column, Entity, Index } from 'typeorm';
import { CommonEntity } from './common.entity';

@Entity('transfers')
@Index(['transfer_hash'], { unique: true })
@Index(['token_address'])
export class Transfer extends CommonEntity {
  @Column('int', { default: 0, comment: '区块链id' })
  chain_id: number;

  @Column('int', { default: 0, comment: '区块高度' })
  block_number: number;

  @Column('varchar', { default: '', comment: '区块时间' })
  block_time: string;

  @Column('varchar', { default: '', comment: '区块哈希' })
  block_hash: string;

  @Column('varchar', { default: '', comment: '交易哈希' })
  transaction_hash: string;

  @Column('int', { default: 0, comment: 'transaction_index' })
  transaction_index: number;

  @Column('int', { default: 0, comment: 'log_index' })
  log_index: number;

  @Column('int', { default: 0, comment: 'array_index' })
  array_index: number;

  @Column('varchar', { default: '', comment: 'value' })
  value: string;

  @Column('varchar', { default: '', comment: '合约类型' })
  contract_type: string;

  @Column('varchar', { default: '', comment: '交易类型' })
  transaction_type: string;

  @Column('varchar', { default: '', comment: '合约地址' })
  token_address: string;

  @Column('varchar', { default: '', comment: 'nft id' })
  token_id: string;

  @Column('varchar', { default: '', comment: '出售方用户地址' })
  from_address: string;

  @Column('varchar', { default: '', comment: '购买方用户地址' })
  to_address: string;

  @Column({
    type: 'numeric',
    precision: 100,
    scale: 0,
    default: 0,
    comment: '交易数量',
  })
  amount: number;

  @Column('int', { default: 1, comment: 'verified' })
  verified: number;

  @Column('varchar', { default: '', comment: '操作人' })
  operator: string;

  @Column('smallint', {
    default: 0,
    comment: '同步状态（0-未处理，10-处理中，20-已处理）',
  })
  analyse_status: number;

  @Column('varchar', { default: '', comment: 'nft哈希 - md5(address+id)' })
  token_hash: string;

  // 保证每个token的transfer唯一
  @Column('varchar', {
    default: '',
    comment:
      'transfer哈希 - md5(transaction_hash+transaction_index+log_index+array_index+token_address+token_id)',
  })
  transfer_hash: string;
}

export function getSimpleTransfer(transfer) {
  // 需要创建新对象，避免原对象修改后影响后续操作
  const simpleTransfer = { ...transfer };
  delete simpleTransfer.id;
  delete simpleTransfer.created_at;
  delete simpleTransfer.updated_at;
  delete simpleTransfer.version;
  return simpleTransfer;
}
