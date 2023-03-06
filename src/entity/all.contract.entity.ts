import { Column, Entity, Index } from 'typeorm';
import { CommonEntity } from './common.entity';

@Entity('contracts')
@Index(['chain', 'token_address'], { unique: true })
export class AllContract extends CommonEntity {
  @Column('varchar', { default: '', comment: '区块链类型' })
  chain;

  @Column('int', { default: 0, comment: '区块链id' })
  chain_id;

  @Column('varchar', { default: '', comment: '合约地址' })
  token_address;

  @Column('smallint', {
    default: 0,
    comment: '同步状态（0-未导入 20-已导入）',
  })
  status;
}
