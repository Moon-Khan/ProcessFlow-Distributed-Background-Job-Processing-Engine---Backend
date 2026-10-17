import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import type { Claim } from './Claim.js';

// Column types are always explicit: tsx/esbuild doesn't emit decorator metadata,
// so TypeORM can't infer them from TypeScript types.
@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn({ type: 'int' })
  id!: number;

  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @OneToMany('Claim', (claim: Claim) => claim.user)
  claims!: Claim[];
}
