import { Column, Entity } from 'typeorm';
import { CommonEntity } from './common.entity';

@Entity('mq_push_error_logs')
export class MQPushErrorLogs extends CommonEntity {
  @Column('varchar', { default: '', comment: '交换机' })
  exchange: string;

  @Column('varchar', { default: '', comment: '路由key' })
  routing_key: string;

  @Column('json', { default: {}, comment: '推送数据' })
  data: object;

  @Column('varchar', { default: '', comment: '错误原因' })
  error_msg: string;

  @Column('smallint', {
    default: 0,
    comment: '处理状态（0-未处理 20-处理成功）',
  })
  status: number;
}

export enum MQ_HANDLE_STATUS {
  DEFAULT = 0,
  SUCCESS = 20,
}
