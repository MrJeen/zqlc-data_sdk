import { Column, Entity, Index } from 'typeorm';
import { CommonEntity } from './common.entity';

@Entity('all_contracts')
@Index(['chain', 'token_address'], { unique: true })
export class AllContract extends CommonEntity {
  @Column('varchar', { default: '', comment: '区块链类型' })
  chain: string;

  @Column('int', { default: 0, comment: '区块链id' })
  chain_id: number;

  @Column('varchar', { default: '', comment: '合约地址' })
  token_address: string;

  @Column('smallint', {
    default: 0,
    comment: '同步状态（0-未导入 20-已导入 99-导入失败）',
  })
  sync_status: number;

  @Column('varchar', { default: '', comment: '失败原因' })
  error_msg: string;

  @Column('varchar', { default: '', comment: '类型（mint-rank, trade-rank）' })
  type: string;

  @Column('smallint', { default: 0, comment: '是否推荐（0：否，1：是）' })
  is_recommend: number;
}
