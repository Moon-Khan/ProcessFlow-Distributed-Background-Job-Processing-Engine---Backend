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

## Docs

- [Full learning plan](docs/PLAN.md) (also as [PDF](docs/ProcessFlow-Plan.pdf))
- [Progress log](docs/PROGRESS.md)

Frontend (React dashboard) lives in a separate repository: [ProcessFlow Frontend](https://github.com/Moon-Khan/ProcessFlow-Distributed-Background-Job-Processing-Engine---Frontend).
