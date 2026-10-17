# One-time setup

## Local tools
| Tool | Check | Install |
|---|---|---|
| Node 24 | `node -v` | https://nodejs.org |
| Docker Desktop | `docker compose version` | https://docker.com |
| GitHub CLI (recommended for stacked PRs) | `gh --version` | `winget install GitHub.cli` then `gh auth login` |
| k6 (from Phase 1) | `k6 version` | `winget install k6` |

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
