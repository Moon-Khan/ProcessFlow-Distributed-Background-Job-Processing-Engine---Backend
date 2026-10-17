import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import type { User } from './User.js';

export const CLAIM_STATUSES = ['approved', 'rejected', 'pending'] as const;
export type ClaimStatus = (typeof CLAIM_STATUSES)[number];

export const DEPARTMENTS = ['health', 'auto', 'home', 'life', 'travel'] as const;
export type Department = (typeof DEPARTMENTS)[number];

// Postgres returns NUMERIC as a string to avoid precision loss; convert for convenience.
const numericToNumber = {
  to: (value: number) => value,
  from: (value: string | null) => (value === null ? null : Number(value)),
};

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
