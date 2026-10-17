# Baseline results (Phase 0)

Measured 2026-10-17 with `npm run loadtest:baseline` (autocannon, **50 connections, 20 s** per endpoint).
API run from the build (`npm run build && npm start`), `DB_POOL_MAX=10`, 100,000 seeded claims, `LOG_REQUESTS=false`.

## Machine
- Intel Core i7-8650U (4 cores / 8 threads), 15.9 GB RAM, Windows 11 Pro
- Postgres 17 in Docker Desktop (WSL2 VM: 8 CPUs, 7.7 GB)
- **autocannon runs on the same laptop as the API and DB**, so all three compete for the same CPU. Absolute numbers are modest; what matters is the comparison with later phases on the same setup.

## Results

| Endpoint | Req/s (avg) | p50 | p97.5 | p99 | Max | Errors | API CPU | Peak pool waiting |
|---|---|---|---|---|---|---|---|---|
| `GET /health` | 4,656 | 9 ms | 18 ms | 23 ms | 79 ms | 0 | 80% | (no DB) |
| `GET /claims?page=1` | 557 | 80 ms | 143 ms | 182 ms | 308 ms | 0 | 88% | **40** |
| `GET /claims?page=1500` | 187 | 258 ms | 382 ms | 442 ms | 489 ms | 0 | 36% | **40** |

Event-loop delay p99 stayed between 26 and 33 ms in all three runs (p50 ≈ 14–15 ms, mostly timer resolution and CPU contention with autocannon).

**Run-to-run variance:** an earlier identical run gave `/health` 6,036 req/s and `/claims?page=1` 461 req/s. Expect ±20–30% on this laptop. Always run before/after back to back, and run more than once.

## Observations

1. **The DB query is not the slow part of `/claims?page=1`.** `EXPLAIN ANALYZE` shows **0.19 ms** inside Postgres, but the API p50 is **80 ms**. The difference is:
   - **Waiting for a connection:** 50 concurrent requests share a pool of 10. The peak of **40 waiting queries** is exactly 50 − 10. *(Phase 2 topic: pool sizing, Little's Law.)*
   - **Node-side work:** the API process is at 88% CPU, spent on TypeORM turning rows into entities, the `numeric` transformer, and JSON serialization of 50 rows per request.
2. **Deep OFFSET pagination is ~3× slower** (258 ms vs 80 ms p50). For page 1500, Postgres walks **75,000 index entries** to return 50 rows (13 ms vs 0.19 ms in the DB). With only 10 connections, each one is held 70× longer. CPU drops to 36% because the API is now mostly *waiting* for the DB.
3. `/health` with no I/O handles ~4.7k req/s. This is the ceiling for this setup: no endpoint can be faster than this.
4. No errors in any run: the system is slow under load, but not failing (yet).

## Questions for later phases
- Does raising `DB_POOL_MAX` from 10 to 50 make `/claims` faster, or does it just move the queue into Postgres? (Phase 2)
- How much of the 80 ms is TypeORM entity hydration? Compare with a raw `SELECT` returning plain objects. (Phase 2)
- Keyset pagination (`WHERE id > $last ORDER BY id LIMIT 50`) vs OFFSET for deep pages. (Optional extra experiment)
