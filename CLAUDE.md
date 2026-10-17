# ProcessFlow Backend: notes for Claude

Read `docs/PLAN.md` (full plan) and `docs/PROGRESS.md` (where we are) before doing anything.

## Ground rules (from the user)
- **Don't write feature code until the user says "start Phase N"** (or explicitly asks for it). Docs and setup are fine when asked.
- This is a **learning project**: the user wants to *feel* each problem first. Build the naive version on purpose, measure, then fix. Never add Redis/BullMQ/pool/cache/rate limiter before the phase that introduces it.
- Only record real measured numbers. Never invent benchmark results.
- Explain the "why" of each step. The user is learning system design, stacked PRs and tags.

## Stack decisions
- Express + TypeScript (not NestJS), PostgreSQL + **TypeORM** (not Prisma), PDFKit, Nodemailer + MailHog, BullMQ + Redis (from Phase 4; Redis cache from Phase 3), k6/autocannon.
- TypeORM: `synchronize: false`; every schema change is a new migration (`typeorm migration:generate`), never edit merged migrations. Schema grows per phase (see "Schema timeline" in PLAN.md).
- Pool via DataSource `poolSize` / `extra: { max, connectionTimeoutMillis, idleTimeoutMillis }`.
- API and worker = separate processes/containers, same codebase (from Phase 4).
- Seed size controlled by `SEED_CLAIMS` (default 100000), via SQL `generate_series`.
- Postgres is on host port **5433** (5432 is taken by a local Postgres on the user's machine). MailHog: 1025 SMTP, 8025 UI.
- Versions: TypeScript **7** (`module: nodenext`, CommonJS output, `.js` import suffixes), Express 5 (async errors handled natively), TypeORM **1.1**.
- tsx/esbuild doesn't emit decorator metadata: always give TypeORM columns an explicit `type`. Use string entity targets in relations (`@ManyToOne('User', ...)`) with `import type` to avoid circular imports.
- TypeORM CLI runs through tsx: `npm run typeorm -- <command>` (data source `src/db/data-source.ts`).
- Benchmarks: run the build (`npm start`), not `npm run dev`. `/metrics` resets its window on each call.
- On Windows Git Bash, `gh` and `k6` aren't on PATH in tool shells: prefix `export PATH="$PATH:/c/Program Files/GitHub CLI:/c/Program Files/k6"`.
- PDF slowness must come from real CPU work (rows rendered), never `sleep()`.

## Git / GitHub workflow
- Remote: `https://github.com/Moon-Khan/ProcessFlow-Distributed-Background-Job-Processing-Engine---Backend.git`
- `main` gets finished phases only, through the **phase PR** (`pNN` -> `main`, **merge commit**).
- Each phase = stack of PRs: `pNN-1-naive` (base `pNN`) -> `pNN-2-measure` (base `pNN-1-naive`) -> `pNN-3-fix` -> `pNN-4-results`. Merge bottom-up with **squash**, restack with `git rebase --onto` / `git rebase --update-refs`, push with `--force-with-lease`.
- Branch names use `-` not `/` (`p01` and `p01/x` can't coexist).
- Tags (annotated): `pNN-before` (after PR 2/4 merged), `pNN-after` (after PR 4/4), `v0.N.0` on main + GitHub Release.
- First commit on a new phase branch = `experiments/NN-name/README.md` (hypothesis), so the draft phase PR has a diff.
- `gh` CLI 2.102 is installed (2026-10-17). The user must run `gh auth login` themselves (interactive browser login). If `gh auth status` fails, use the web UI.
- Commit/push only when the user asks or the task clearly includes it.

## Environment
- Windows 11, Node 24.15, npm 11, git 2.39 (supports `--update-refs`), Docker 29.8 + Compose v5.5, k6 2.2, gh 2.102.
- Images pulled: `postgres:17-alpine`, `redis:7-alpine`, `mailhog/mailhog:latest`.
- Express/TypeScript etc. are npm deps installed inside the repo in Phase 0 PR 1 (`p00-1-scaffold`), not globally.
- Workspace: `D:\study\project\Doc- Processer\` contains `backend/` (this repo) and `frontend/` (separate repo).
