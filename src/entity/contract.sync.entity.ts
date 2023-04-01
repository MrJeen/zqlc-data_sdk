import {
  Column,
  Entity,
  Generated,
  Index,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { CommonEntity } from './common.entity';
import { Contract } from './contract.entity';

@Entity('contract_sync')
@Index(['contract_id', 'source'], { unique: true })
export class ContractSync extends CommonEntity {
  @Column()
  @Generated('uuid')
  contract_id: string;

  @Column('varchar', { default: '', comment: '合约地址' })
  token_address: string;

  @Column('smallint', { default: 0, comment: '来源（0-默认，1-open_meta）' })
  source: number;

  @Column('smallint', {
    default: 0,
    comment: '同步状态（0-未开始 10-同步中 20-同步成功）',
  })
  sync_status: number;

  @Column('smallint', { default: 0, comment: '是否推荐（0：否，1：是）' })
  is_recommend: number;

  // createForeignKeyConstraints:false 不生成外键
  @ManyToOne(() => Contract, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'contract_id', referencedColumnName: 'id' })
  contract: Contract;
}
