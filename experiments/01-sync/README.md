# Experiment 01: Synchronous reports

## Goal
See what happens when long, CPU-heavy work runs **inside the HTTP request**: the client waits for all of it,
Node's single thread is blocked while it runs, and one failing dependency fails the whole request.

## What gets built (naive on purpose)
`POST /reports` with body `{ "userId": 1, "department": "health", "status"?: "approved" }` does everything before responding:

1. Look up the requesting user (404 if missing)
2. Load every matching claim (no index on `department`: full table scan)
3. Compute totals **in JS**: per status, per month, top 10 users
4. Render a PDF with PDFKit: summary page + **one line per claim** (~45 rows/page)
5. Email the PDF as an attachment through MailHog
6. Insert a row into `reports` (`user_id`, `department`, `file_path`, `created_at`)
7. Respond `201` with the totals, PDF info and per-step `timingsMs`

## Calibration
- Seed: `SEED_CLAIMS=100000`, 500 users. All tests use `department: "health"`: **20,257 claims → 442 pages, 1.2 MB PDF**.
- Plan target was ~2–5 s per report. The **PDF step alone is ~2.4 s** (on target), but the email step adds
  another 4.5–5.7 s (MailHog is slow to accept a 1.2 MB attachment), so one full request takes **~7–8 s**.
  Kept as is: the size is realistic and the PDF work is enough to block the event loop.

## Predictions
> Not written down before the first runs. Fill in what you would have guessed, marked as written after the fact.

1. How long will 1 report take?
2. With 10 reports at once, how long will the last one take? With 50?
3. While reports are running, what happens to `GET /health`?
4. If MailHog is down, what does the client get, after how long, and what is left on disk / in the DB?

## How to run
```bash
docker compose up -d                       # Postgres + MailHog
npm run build && npm start                 # terminal 1: the build, not `npm run dev`
bash experiments/01-sync/run.sh <step>     # terminal 2, from backend/  (steps: single, c1, c10, c10-short, c50, health, mailhog-down, cleanup)
```
`health` needs a reports test running at the same time in a third terminal (see `run.sh`).

Results: [`before.md`](before.md).
