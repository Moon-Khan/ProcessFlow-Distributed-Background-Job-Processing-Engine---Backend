# Progress log

Update this file at the end of every working session: what's done, what's next, and anything surprising.

## Current status
- **Current phase:** Phase 0 (not started)
- **Next step:** user says "start Phase 0" -> open the `p00` branch + the 4-PR stack (scaffold, infra, seed, metrics)

## Phase checklist

| Phase | Branch | PRs merged | `-before` tag | `-after` tag | Release | Notes |
|---|---|---|---|---|---|---|
| 0 Setup | `p00` | 0/4 | - | - | `v0.0.0` | |
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
