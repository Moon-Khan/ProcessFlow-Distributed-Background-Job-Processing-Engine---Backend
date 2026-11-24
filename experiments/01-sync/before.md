# Phase 1 results: before (naive synchronous reports)

Measured 2026-11-24 by hand (commands now in [`run.sh`](run.sh)). API run from the build (`npm start`), Node 24.15,
`DB_POOL_MAX=10`, 100,000 seeded claims, `LOG_REQUESTS=false`. Every request: `{"userId":1,"department":"health"}`
= **20,257 claims, 442-page / 1.2 MB PDF**.

## Machine
- Intel Core i7-8650U (4 cores / 8 threads), 15.9 GB RAM, Windows 11 Pro
- Postgres 17 + MailHog in Docker Desktop (WSL2 VM)
- autocannon runs on the same laptop as the API, DB and MailHog, so all of them compete for the same CPU.
  autocannon 8.0.0 (repo) for the c=1 / c=10 (120 s) / `/health` runs, 9.0.0 (`npx` outside the repo) for the 30 s-timeout runs.

## 1. One request at a time

Per-step timings from the response (`timingsMs`), MailHog inbox emptied first:

| Run | Total | query | totals | **pdf** | **email** | save |
|---|---|---|---|---|---|---|
| 1 | 8.31 s | 198 ms | 32 ms | 2,369 ms | 5,670 ms | 13 ms |
| 2 | 7.28 s | 178 ms | 35 ms | 2,512 ms | 4,540 ms | 12 ms |
| 3 | 7.38 s | 139 ms | 40 ms | 2,401 ms | 4,773 ms | 14 ms |

`-c 1 -a 5` (5 requests back to back): p50 **7.6 s**, avg 9.0 s, max 12.6 s, **5 in 45.5 s = 0.11 reports/s**, all `201`.
`/metrics`: event-loop delay **max 5.5 s**, CPU 38%, RSS 567 MB.

## 2. Concurrency

| Run | Client timeout | Result | Latency (min / p50 / max) | Throughput | Event-loop max | CPU | RSS |
|---|---|---|---|---|---|---|---|
| c=1, 5 requests | 60 s | 5 × `201` | 7.0 / 7.6 / 12.6 s | 0.11/s | 5.5 s | 38% | 567 MB |
| **c=10, 10 requests** | 120 s | 10 × `201` | **85.0 / 86.5 / 88.5 s** | 10 in 89 s = **0.11/s** | **29.2 s** | 44% | 564 MB |
| c=10, 20 requests | 30 s | **20 / 20 timeouts** | - | 0 | **36.8 s** | 82% | 1,104 MB |
| c=50, 50 requests | 30 s | **50 / 50 timeouts** | - | 0 | **49.0 s** | 117% | **2,435 MB** |

DB pool at c=50: peak 10 open connections, **peak 40 queries waiting** for one.

## 3. `/health` while reports run

| Condition | Req/s (avg) | p50 | p97.5 | Max | Result |
|---|---|---|---|---|---|
| Idle | **6,058** | 1 ms | 4 ms | 60 ms | 91k requests in 15 s |
| During `c=10` reports (second terminal) | **0** | - | - | > 15 s | **0 responses in 15 s** |
| While the server was still working through the timed-out c=50 batch | 0.67 | 3,721 ms | 3,725 ms | 3,725 ms | 10 of 30 timed out |

The reports running alongside also got slower: 99.0 / 102.7 / 105.5 s (vs 85–88.5 s alone).

## 4. MailHog down

| | Before | After |
|---|---|---|
| PDF files in `reports/` | 29 | **30** |
| Rows in `reports` | 29 | **29** |
| Response | | **`500` after 3.2 s** |

Server log: `Error: connect ECONNREFUSED 127.0.0.1:1025` (`code: 'ESOCKET'`).

## Observations

1. **The client waits for everything.** One report takes 7–8 s: ~2.4 s of PDF CPU work, ~5 s waiting on email, and the client
   needs neither to know its report was accepted.
2. **Concurrency adds only waiting.** 1-at-a-time and 10-at-once both give **0.11 reports/s**. The PDF work is synchronous JS on
   one thread, so it can't overlap. At c=10 every request finished at **85–88 s**: the thread drew all 10 PDFs first, and the
   email/save steps of every request could only continue after that. Everyone waited as long as the slowest request.
3. **A 30 s client timeout fails 100% of requests at c=10 and c=50.** The server **kept working** on requests whose clients had
   already gone: the final `/metrics` call itself waited ~100 s for the thread to be free (`windowSeconds` 161 for a 61 s test).
4. **Unrelated endpoints go down.** `/health` touches no DB and does no work, yet went from **6,058 req/s at 1 ms to zero
   responses in 15 s**. The event loop was blocked for up to **29 s** (c=10) and **49 s** (c=50) in one stretch.
   The event-loop **p99 (30–51 ms) hides this**: the sampling timer rarely fires during a block. Always read `max`.
5. **Memory grows with concurrency**: 564 MB (c=10, sequential completion) → 1.1 GB → **2.4 GB** at c=50. Each in-flight request
   holds 20k entities, the table rows and a PDF being built.
6. **One failing dependency wastes all the work.** With MailHog down the request fails after the full PDF was rendered: an orphan
   PDF on disk, no DB row, no email, and ~3 s of blocked thread. A provider that is slow instead of down would be worse (the
   request would hang until a timeout instead of failing fast on `ECONNREFUSED`).
7. **Email time depends on attachment size, not inbox size**: 0.5 MB PDF ≈ 1 s, 1.2 MB PDF ≈ 4.5–5.7 s, even with an empty inbox.
8. Preview of Phase 2: at c=50, 40 queries waited for one of the 10 pool connections.

## Measurement notes
- `/metrics` `routes` was **empty** for the 30 s-timeout runs: the timing middleware records on `finish`, which never fires when
  the client disconnects first. Timed-out requests are invisible there; use the autocannon numbers.
- An earlier set of single runs (before emptying MailHog) gave 8.5 / 11.5 / 9.8 s with email at 5.4–7.7 s.
- autocannon 9's `TimeoutNegativeWarning` is a harmless warning from the tool itself.
