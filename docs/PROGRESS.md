# Progress log

Update this file at the end of every working session: what's done, what's next, and anything surprising.

## Current status
- **Current phase:** Phase 0: code done, **all 5 PRs open, none merged yet**
  - Phase PR #1 `p00` -> `main` (draft)
  - #2 `p00-1-scaffold` -> `p00` · #3 `p00-2-infra` -> `p00-1-scaffold` · #4 `p00-3-seed` -> `p00-2-infra` · #5 `p00-4-metrics` -> `p00-3-seed`
- **Next step:** user reviews, then merges bottom-up (#2 squash -> restack #3 -> ... -> #5), tags `p00-after`, merges #1 with a merge commit, tags `v0.0.0` + Release. Turn on "Automatically delete head branches" first (it's still off).
- **After that:** "start Phase 1".

## Phase checklist

| Phase | Branch | PRs merged | `-before` tag | `-after` tag | Release | Notes |
|---|---|---|---|---|---|---|
| 0 Setup | `p00` | 0/4 (4 open) | - | - | `v0.0.0` | baseline in `experiments/00-baseline/before.md` |
| 1 Sync reports | `p01` | 0/4 | | | `v0.1.0` | |
| 2 DB bottleneck | `p02` | 0/4 | | | `v0.2.0` | |
| 3 Cache | `p03` | 0/4 | | | `v0.3.0` | |
| 4 Queues | `p04` | 0/4 | | | `v0.4.0` | |
| 5 CSV import | `p05` | 0/4 | | | `v0.5.0` | |
| 6 Spike + scaling | `p06` | 0/4 | | | `v0.6.0` | |
| 7 Retries + DLQ | `p07` | 0/4 | | | `v0.7.0` | |
| 8 Crashes | `p08` | 0/4 | | | `v0.8.0` | |
| 9 Idempotency | `p09` | 0/4 | | | `v0.9.0` | |
| 10 Rate limiting | `p10` | 0/4 | | | `v0.10.0` | |
| 11 Live status | `p11` | 0/4 | | | `v0.11.0` | frontend repo active |
| 12 Write-up | `p12` | - | | | `v1.0.0` | |

## Log

### 2026-10-17
- Wrote the plan (`docs/PLAN.md` + PDF). Decisions: TypeORM, Express + TS, stacked PRs per phase, tags + releases, separate frontend repo.
- Initial repo setup: README, CLAUDE.md, PR template, git config files. Pushed to `main`.
- Frontend repo set up and pushed: https://github.com/Moon-Khan/ProcessFlow-Distributed-Background-Job-Processing-Engine---Frontend (README, CLAUDE.md, PR template, config files; no app code yet).
- Installed local tools: gh 2.102, k6 2.2 (Docker 29.8 + Node 24 already present). Pulled postgres/redis/mailhog images. Still to do by the user: `gh auth login`.
- Pending manual GitHub settings for **both** repos (no `gh` CLI): see "GitHub settings" in `docs/SETUP.md`.
- `gh auth login` done. **Phase 0 implemented** as a 4-PR stack (#2–#5) + draft phase PR #1.
  - Versions installed: Express 5.3, TypeScript 7.0, tsx 4.23, TypeORM 1.1, pg 8.23, autocannon.
  - Baseline: `/health` 4.7k req/s; `/claims?page=1` 557 req/s, p50 80 ms, but only 0.19 ms in Postgres -> pool queueing (peak 40 waiting with pool=10, c=50) + Node CPU. Deep page (OFFSET 75k) 3× slower.
  - Surprise worth remembering: the first metrics version read pool `waiting` after the test (always 0). Fixed by sampling peaks every 50 ms.
