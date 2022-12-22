import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { CommonEntity } from './common.entity';
import { Contract } from './contract.entity';

@Entity('transfers')
export class Transfer extends CommonEntity {
  @Column('varchar', { default: '', comment: '区块链类型' })
  chain;

  @Column('int', { default: 0, comment: '区块高度' })
  block_number;

  @Column('varchar', { default: '', comment: '区块时间' })
  block_time;

  @Column('varchar', { default: '', comment: '区块哈希' })
  block_hash;

  @Column('varchar', { default: '', comment: '交易哈希' })
  transaction_hash;

  @Column('int', { default: 0, comment: 'transaction_index' })
  transaction_index;

  @Column('int', { default: 0, comment: 'log_index' })
  log_index;

  @Column('int', { default: 0, comment: 'array_index' })
  array_index;

  @Column('varchar', { default: '', comment: 'value' })
  value;

  @Column('varchar', { default: '', comment: '合约类型' })
  contract_type;

  @Column('varchar', { default: '', comment: '交易类型' })
  transaction_type;

  @Column('varchar', { default: '', comment: '合约地址' })
  token_address;

  @Column('varchar', { default: '', comment: 'nft id' })
  token_id;

  @Column('varchar', { default: '', comment: '出售方用户地址' })
  from_address;

  @Column('varchar', { default: '', comment: '购买方用户地址' })
  to_address;

  @Column({
    type: 'numeric',
    precision: 100,
    scale: 0,
    default: 0,
    comment: '交易数量',
  })
  amount;

  @Column('int', { default: 1, comment: 'verified' })
  verified;

  @Column('varchar', { default: '', comment: '操作人' })
  operator;

  @Column('smallint', {
    default: 0,
    comment: '同步状态（0-未处理，10-处理中，20-已处理）',
  })
  analyse_status;

  @Column('varchar', { default: '', comment: 'nft哈希 - md5(address+id)' })
  token_hash;

  @ManyToOne(() => Contract)
  @JoinColumn({ name: 'token_address', referencedColumnName: 'token_address' })
  contract: Contract;
}

export enum ANALYSE_STATUS {
  DEFAULT = 0,
  ING = 10,
  SUCCESS = 20,
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
