import { Column, Entity, Index } from 'typeorm';
import { CommonEntity } from './common.entity';

@Entity('transfer_sync')
@Index(['chain_id'], { unique: true })
export class TransferSync extends CommonEntity {
  @Column('int', { default: 0, comment: '区块链id' })
  chain_id: number;

  @Column('int', { default: 0, comment: '区块高度' })
  sync_block_number: number;
}
