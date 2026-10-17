# One-time setup

## Local tools
| Tool | Check | Install | Status (2026-10-17) |
|---|---|---|---|
| Node 24 + npm | `node -v` | https://nodejs.org | ✅ 24.15 / npm 11.1 |
| Docker Desktop + Compose | `docker compose version` | https://docker.com | ✅ 29.8 / Compose v5.5 |
| GitHub CLI (for stacked PRs) | `gh --version` | `winget install --id GitHub.cli -e` | ✅ 2.102. **Run `gh auth login` once** |
| k6 (load tests) | `k6 version` | `winget install --id GrafanaLabs.k6 -e` | ✅ 2.2 |
| git | `git --version` | | ✅ 2.39 (`--update-refs` needs ≥ 2.38) |

Docker images pulled ahead of time: `postgres:17-alpine`, `redis:7-alpine`, `mailhog/mailhog:latest`.

**Not installed globally on purpose:** Express, TypeScript, TypeORM, `pg`, PDFKit, Nodemailer, autocannon, etc. are **project dependencies** in `package.json`, added in Phase 0 PR 1 (`p00-1-scaffold`). Redis and BullMQ client libraries are only added when their phase starts (3 and 4).

> Docker Desktop must be running before any `docker compose` command. If you see `failed to connect to the docker API ... dockerDesktopLinuxEngine`, open Docker Desktop and wait until it says "Engine running".

## GitHub settings (do once, in the web UI)
Repo -> **Settings**:
1. **General -> Pull Requests**
   - ✅ Allow merge commits (used for phase PR -> `main`)
   - ✅ Allow squash merging (used for stacked PRs -> phase branch)
   - ✅ **Automatically delete head branches**, so GitHub retargets the next stacked PR when the one below it merges.
2. **Rules -> Rulesets -> New branch ruleset** (or **Branches -> Add branch protection rule**) for `main`:
   - Require a pull request before merging
   - Block force pushes
   - (Rulesets on private repos need GitHub Pro. On the free plan, keep the repo public or just follow the rule by discipline.)

## Line endings (Windows)
`.gitattributes` forces LF in the repo, so Docker containers and shell scripts work. If you ever see `^M` errors in a container, run `git add --renormalize .`.
