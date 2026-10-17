# Experiment 00: Baseline

## Goal
Get a working API + database with realistic data, and a repeatable way to measure it.
Every later phase compares against numbers taken with the same tools.

## Hypothesis
A trivial endpoint (`GET /health`) on this machine should handle thousands of req/s with low single-digit ms p95.
Paginated reads (`GET /claims`) will be slower but stable, because they are small indexed lookups.

## What gets built (Phase 0 stack)
1. `p00-1-scaffold`: TypeScript + Express, `GET /health`
2. `p00-2-infra`: Docker Compose (Postgres, MailHog), TypeORM DataSource, `User` + `Claim` entities, first migration, `GET /claims?page=`
3. `p00-3-seed`: seed script, size controlled by `SEED_CLAIMS` (default 100,000)
4. `p00-4-metrics`: request timing middleware, `/metrics` (event-loop lag, memory, counts), baseline load test

## How to run
```bash
npm run db:up && npm run migration:run && npm run seed
npm run build && npm start          # terminal 1 (use the build, not `npm run dev`, for benchmarks)
npm run loadtest:baseline           # terminal 2  (override with C=100 D=30 ...)
```
Results: [`before.md`](before.md). `GET /metrics` returns event-loop delay, CPU %, memory, DB pool peaks and per-route timings since the last call.
