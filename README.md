# ProcessFlow: Reliable Background Job Processing (Backend)

ProcessFlow is a self-hosted document and data processing service, built to explore how backend systems handle expensive workloads, temporary failures, duplicate requests and sudden traffic spikes.

**Business scenario:** *SecureLife Insurance* processes thousands of claims. Managers generate large PDF reports, staff import big CSV files, and emails must arrive even when the mail server has a bad minute. Nobody should have to sit and wait for an HTTP request to finish.

## How this project is built

Every architectural piece is added **only after a measured problem proves it's needed**:

> build the naive version -> break it under load or failure -> measure -> find the bottleneck -> apply one fix -> re-run the same test

| Phase | Problem reproduced | Fix introduced | Status |
|---|---|---|---|
| 0 | Baseline setup | Docker Compose, TypeORM, seed data, metrics | ⏳ |
| 1 | PDF generation blocks the API | (measured; worker-thread spike) | ⏳ |
| 2 | DB connection exhaustion, full scans, N+1 | Connection pool, index, joins | ⏳ |
| 3 | Repeated expensive reads | Redis cache-aside | ⏳ |
| 4 | Long work tied to the request | BullMQ queues + separate workers | ⏳ |
| 5 | Big CSV -> out of memory | Streaming + batched inserts | ⏳ |
| 6 | Traffic spike, growing backlog | Concurrency tuning, horizontal workers | ⏳ |
| 7 | Mail server outage | Retries, exponential backoff, DLQ, replay | ⏳ |
| 8 | Worker crash mid-job | Stalled-job recovery, idempotent workers | ⏳ |
| 9 | Double submissions | Idempotency keys + unique constraints | ⏳ |
| 10 | One user floods the system | Rate limiting, per-user caps | ⏳ |
| 11 | Polling overload | WebSockets + pub/sub | ⏳ |
| 12 | Observability + write-up | Metrics dashboards, final results | ⏳ |

Every number published here is measured. See `experiments/` and the GitHub Releases for each phase.

## Stack

Node.js + TypeScript, Express, PostgreSQL + TypeORM, BullMQ + Redis, PDFKit, Nodemailer + MailHog, k6 / autocannon, Docker Compose.

## Getting started

Requires Node 24+ and Docker Desktop (running).

```bash
npm ci
cp .env.example .env
npm run db:up            # Postgres on localhost:5433, MailHog on :1025 (UI: http://localhost:8025)
npm run migration:run
npm run seed             # 500 users + 100,000 claims (SEED_USERS / SEED_CLAIMS)
npm run dev              # API on http://localhost:3000
```

| Script | What it does |
|---|---|
| `npm run dev` | API with hot reload (tsx) |
| `npm run build` / `npm start` | Compile to `dist/` and run it |
| `npm run db:up` / `db:down` / `db:reset` | Start / stop / wipe and re-migrate the local DB |
| `npm run migration:generate -- src/db/migrations/<Name>` | Generate a migration from entity changes |
| `npm run migration:run` / `migration:revert` / `migration:show` | Apply / undo last / list migrations |
| `npm run seed` | Wipe and regenerate synthetic users + claims (size from `SEED_USERS`, `SEED_CLAIMS`) |
| `npm run loadtest:baseline` | Phase 0 baseline load test (API must be running) |

`GET /metrics` returns event-loop delay, CPU %, memory, DB pool peaks and per-route timings since the previous call.

## Docs

- [Full learning plan](docs/PLAN.md) (also as [PDF](docs/ProcessFlow-Plan.pdf))
- [Progress log](docs/PROGRESS.md)

Frontend (React dashboard) lives in a separate repository: [ProcessFlow Frontend](https://github.com/Moon-Khan/ProcessFlow-Distributed-Background-Job-Processing-Engine---Frontend).
