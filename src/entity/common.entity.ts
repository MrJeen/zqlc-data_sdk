import {
  CreateDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export class CommonEntity {
  @PrimaryGeneratedColumn({ comment: 'ID', type: 'bigint' })
  id: number;

  @CreateDateColumn({ comment: '创建时间' })
  created_at;

  @UpdateDateColumn({ comment: '更新时间' })
  updated_at;
}
