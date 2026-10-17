#!/usr/bin/env bash
# Baseline load test. Re-run this exact script whenever you need comparable numbers.
# Prereqs: DB up + migrated + seeded, API running from a build:  npm run build && npm start
# Override: URL=... C=<connections> D=<seconds> bash experiments/00-baseline/run.sh
set -euo pipefail

URL=${URL:-http://localhost:3000}
C=${C:-50}
D=${D:-20}

curl -sf "$URL/health" > /dev/null || { echo "API not reachable at $URL"; exit 1; }

for path in "/health" "/claims?page=1&pageSize=50" "/claims?page=1500&pageSize=50"; do
  echo
  echo "================ $path  (c=$C, ${D}s) ================"
  curl -s "$URL/metrics" > /dev/null          # reset the metrics window
  npx autocannon -c "$C" -d "$D" "$URL$path"
  echo "--- /metrics for this run ---"
  curl -s "$URL/metrics"
  echo
done
