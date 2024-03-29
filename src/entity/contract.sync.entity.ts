import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { CommonEntity } from './common.entity';
import { Contract } from './contract.entity';

@Entity('contract_sync')
@Index(['token_address', 'source'], { unique: true })
export class ContractSync extends CommonEntity {
  @Column('int', { default: 0, comment: '区块链id' })
  chain_id: number;

  @Column('varchar', { default: '', comment: '合约地址' })
  token_address: string;

  @Column('smallint', { default: 0, comment: '来源（0-默认，1-open_meta）' })
  source: number;

  @Column('smallint', {
    default: 0,
    comment: '同步状态（0-未开始 10-同步中 20-同步成功）',
  })
  sync_status: number;

  // createForeignKeyConstraints:false 不生成外键
  @ManyToOne(() => Contract, { createForeignKeyConstraints: false })
  @JoinColumn([
    { name: 'token_address', referencedColumnName: 'token_address' },
  ])
  contract: Contract;
}
