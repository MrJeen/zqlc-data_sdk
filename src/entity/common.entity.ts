import {
  CreateDateColumn,
  Generated,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Index(['created_at'])
export class CommonEntity {
  @PrimaryColumn()
  @Generated('uuid')
  id: string;

  @CreateDateColumn({ comment: '创建时间' })
  created_at: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updated_at: Date;
}
