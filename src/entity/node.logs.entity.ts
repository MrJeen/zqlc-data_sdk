import { Column, Entity } from 'typeorm';
import { CommonEntity } from './common.entity';

@Entity('node_logs')
export class NodeLogs extends CommonEntity {
  @Column('int', { default: 0, comment: '区块链id' })
  chain_id: number;

  @Column('varchar', { default: '', comment: '节点' })
  node: string;

  @Column('varchar', { default: '', comment: '报错信息' })
  message: string;
}
