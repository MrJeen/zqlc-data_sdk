import { Column, Entity } from 'typeorm';
import { CommonEntity } from './common.entity';

@Entity('node_count')
export class NodeCount extends CommonEntity {
  @Column('int', { default: 0, comment: '区块链id' })
  chain_id: number;

  @Column('varchar', { default: '', comment: '节点' })
  node: string;

  @Column('int', { default: 0, comment: '年' })
  year: number;

  @Column('int', { default: 0, comment: '月' })
  month: number;

  @Column('int', { default: 0, comment: '日' })
  day: number;

  @Column('int', { default: 0, comment: '报错次数' })
  count: number;
}
