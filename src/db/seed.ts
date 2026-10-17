import { performance } from 'node:perf_hooks';
import { config } from '../config.js';
import { AppDataSource } from './data-source.js';

// Generates synthetic insurance data inside Postgres with generate_series.
// One INSERT ... SELECT is far faster than sending rows from Node one by one.
async function seed() {
  const users = Number(process.env.SEED_USERS ?? 500);
  const claims = Number(process.env.SEED_CLAIMS ?? 100_000);

  await AppDataSource.initialize();
  console.log(`Seeding ${users} users and ${claims} claims into ${config.db.name}...`);
  const started = performance.now();

  await AppDataSource.transaction(async (tx) => {
    await tx.query('TRUNCATE claims, users RESTART IDENTITY CASCADE');

    await tx.query(
      `INSERT INTO users (email, name)
       SELECT 'user' || i || '@securelife.test', 'User ' || i
       FROM generate_series(1, $1) AS i`,
      [users],
    );

    await tx.query(
      `INSERT INTO claims (user_id, amount, status, department, created_at)
       SELECT
         1 + floor(random() * $2)::int,
         round((50 + random() * 4950)::numeric, 2),
         (ARRAY['approved', 'rejected', 'pending'])[1 + floor(random() * 3)::int],
         (ARRAY['health', 'auto', 'home', 'life', 'travel'])[1 + floor(random() * 5)::int],
         now() - random() * interval '365 days'
       FROM generate_series(1, $1)`,
      [claims, users],
    );
  });

  // Refresh planner statistics so later EXPLAIN ANALYZE results are realistic.
  await AppDataSource.query('ANALYZE users, claims');

  const seconds = ((performance.now() - started) / 1000).toFixed(1);
  const [{ size }] = await AppDataSource.query(
    `SELECT pg_size_pretty(pg_total_relation_size('claims')) AS size`,
  );
  console.log(`Done in ${seconds}s. claims table size: ${size}`);

  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
