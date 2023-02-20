import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { CommonEntity } from './common.entity';
import { Contract } from './contract.entity';

@Entity('contract_sync')
@Index(['contract_id', 'source'], { unique: true })
export class ContractSync extends CommonEntity {
  @Column('int', {
    default: 0,
    comment: '系列ID',
  })
  contract_id;

  @Column('varchar', { default: '', comment: '合约地址' })
  token_address;

  @Column('smallint', { default: 0, comment: '来源（0-默认，1-open_meta）' })
  source;

  @Column('smallint', {
    default: 0,
    comment: '同步状态（0-未开始 10-同步中 20-同步成功）',
  })
  sync_status;

  @ManyToOne(() => Contract)
  @JoinColumn({ name: 'contract_id', referencedColumnName: 'id' })
  contract: Contract;
}
