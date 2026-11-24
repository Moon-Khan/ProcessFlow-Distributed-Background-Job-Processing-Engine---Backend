#!/usr/bin/env bash
# Phase 1 load tests. Re-run these exact steps after the fix to get comparable numbers.
# Prereqs: docker compose up -d; API running from the build (npm run build && npm start).
# Run from backend/:  bash experiments/01-sync/run.sh <step>
set -euo pipefail

URL=${URL:-http://localhost:3000}
BODY=${BODY:-'{"userId":1,"department":"health"}'}
DB="docker exec processflow-postgres-1 psql -U processflow -d processflow -tAc"

curl -sf "$URL/health" > /dev/null || { echo "API not reachable at $URL"; exit 1; }

# load <connections> <total requests> <client timeout s>
load() {
  curl -s "$URL/metrics" > /dev/null # reset the metrics window
  npx autocannon -c "$1" -a "$2" -t "$3" -m POST -H 'Content-Type: application/json' -b "$BODY" "$URL/reports"
  echo "--- /metrics for this run ---"
  curl -s "$URL/metrics"; echo
}

case "${1:-}" in
  single) # 3 requests, one at a time, with the per-step timings
    for i in 1 2 3; do
      curl -s -X POST "$URL/reports" -H 'Content-Type: application/json' -d "$BODY" \
        -o /tmp/p01-report.json -w "HTTP %{http_code}  total %{time_total}s  "
      grep -o '"timingsMs":{[^}]*}' /tmp/p01-report.json
    done ;;
  c1)        load 1 5 60 ;;
  c10)       load 10 10 120 ;; # long timeout: real latencies
  c10-short) load 10 20 30 ;;  # 30 s client timeout, as a real client would have
  c50)       load 50 50 30 ;;
  health)
    # 1) idle baseline, 2) the same while `run.sh c10` runs in another terminal.
    echo "=== /health idle ==="
    npx autocannon -c 10 -d 15 "$URL/health"
    read -rp "Start 'bash experiments/01-sync/run.sh c10' in another terminal, then press Enter within 2-3 s... "
    echo "=== /health during reports ==="
    npx autocannon -c 10 -d 15 -t 60 "$URL/health" ;;
  mailhog-down)
    echo "PDF files before: $(ls reports | wc -l)   DB rows before: $($DB 'SELECT count(*) FROM reports;')"
    docker compose stop mailhog
    curl -s -X POST "$URL/reports" -H 'Content-Type: application/json' -d "$BODY" \
      -w "\nHTTP %{http_code}  total %{time_total}s\n" || true
    echo "PDF files after:  $(ls reports | wc -l)   DB rows after:  $($DB 'SELECT count(*) FROM reports;')"
    docker compose start mailhog ;;
  cleanup) # generated PDFs, report rows, MailHog inbox
    rm -f reports/*.pdf
    $DB "TRUNCATE reports RESTART IDENTITY;"
    curl -s -X DELETE localhost:8025/api/v1/messages
    echo "cleaned" ;;
  *)
    echo "usage: run.sh single | c1 | c10 | c10-short | c50 | health | mailhog-down | cleanup"; exit 1 ;;
esac
