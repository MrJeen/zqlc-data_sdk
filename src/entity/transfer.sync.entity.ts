import { Column, Entity, Index } from 'typeorm';
import { CommonEntity } from './common.entity';

@Entity('transfer_sync')
@Index(['chain'], { unique: true })
export class TransferSync extends CommonEntity {
  @Column('varchar', { default: '', comment: '区块链类型' })
  chain;

  @Column('int', { default: 0, comment: '区块高度' })
  sync_block_number;
}
