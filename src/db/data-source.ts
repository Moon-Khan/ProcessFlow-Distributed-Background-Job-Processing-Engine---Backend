import 'reflect-metadata';
import path from 'node:path';
import { DataSource } from 'typeorm';
import { config } from '../config.js';
import { Claim } from './entities/Claim.js';
import { User } from './entities/User.js';

// Used by the app and by the TypeORM CLI (`npm run migration:*`).
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: config.db.host,
  port: config.db.port,
  username: config.db.user,
  password: config.db.password,
  database: config.db.name,
  entities: [User, Claim],
  // .ts when run through tsx, .js after `npm run build`
  migrations: [path.join(__dirname, 'migrations', '*.{ts,js}')],
  // Never let TypeORM change the schema by itself: every change is a reviewed migration.
  synchronize: false,
  logging: config.db.logging,
  // Passed straight to the `pg` connection pool.
  extra: {
    max: config.db.poolMax,
  },
});
