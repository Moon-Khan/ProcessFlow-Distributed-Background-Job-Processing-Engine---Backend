import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import type { Department } from '../../types/index.js';
import type { User } from './User.js';

// One row per generated PDF. The file itself lives on disk; only its path is stored here.
@Entity({ name: 'reports' })
export class Report {
  @PrimaryGeneratedColumn({ type: 'int' })
  id!: number;

  @Column({ name: 'user_id', type: 'int' })
  userId!: number;

  @ManyToOne('User', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ type: 'varchar', length: 32 })
  department!: Department;

  @Column({ name: 'file_path', type: 'varchar', length: 500 })
  filePath!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
