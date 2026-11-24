import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import type { ClaimStatus, Department } from '../../types/index.js';
import { numericToNumber } from '../transformers/numeric.transformer.js';
import type { User } from './User.js';

// No index on department/status on purpose: Phase 2 measures the full scan first.
@Entity({ name: 'claims' })
export class Claim {
  @PrimaryGeneratedColumn({ type: 'int' })
  id!: number;

  @Column({ name: 'user_id', type: 'int' })
  userId!: number;

  @ManyToOne('User', (user: User) => user.claims, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ type: 'numeric', precision: 12, scale: 2, transformer: numericToNumber })
  amount!: number;

  @Column({ type: 'varchar', length: 16 })
  status!: ClaimStatus;

  @Column({ type: 'varchar', length: 32 })
  department!: Department;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
