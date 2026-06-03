#!/usr/bin/env bash
# ─── FalFul load-test runner (Linux / macOS / WSL) ───────────────────────────
# Usage:
#   ./run-tests.sh [scenario] [BASE_URL] [TEST_EMAIL] [TEST_PASSWORD]
#
# scenario: smoke | load | stress | spike | endurance | orders | all (default)
# Examples:
#   ./run-tests.sh smoke
#   ./run-tests.sh load http://api.falfulfresh.com
#   ./run-tests.sh all

set -euo pipefail

SCENARIO="${1:-all}"
BASE_URL="${2:-http://localhost:5287}"
TEST_EMAIL="${3:-loadtest01@falfulfresh.com}"
TEST_PASSWORD="${4:-LoadTest@123!}"
OUTPUT_DIR="./reports"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# ── Verify k6 ─────────────────────────────────────────────────────────────────
if ! command -v k6 &> /dev/null; then
  echo "❌ k6 is not installed.  See https://k6.io/docs/get-started/installation/"
  exit 1
fi

mkdir -p "$OUTPUT_DIR"

ENV_ARGS="--env BASE_URL=${BASE_URL} --env TEST_EMAIL=${TEST_EMAIL} --env TEST_PASSWORD=${TEST_PASSWORD}"

run_scenario() {
  local name="$1"
  local file="$2"

  echo ""
  echo "══════════════════════════════════════════"
  echo "  Running: $name"
  echo "══════════════════════════════════════════"

  k6 run $ENV_ARGS \
    --out "json=${OUTPUT_DIR}/${TIMESTAMP}_${name}.json" \
    --summary-export "${OUTPUT_DIR}/${TIMESTAMP}_${name}_summary.json" \
    "./scenarios/${file}.js"

  echo "  ✓ $name complete"
}

case "$SCENARIO" in
  smoke)     run_scenario "smoke"     "01-smoke" ;;
  load)      run_scenario "load"      "02-load" ;;
  stress)    run_scenario "stress"    "03-stress" ;;
  spike)     run_scenario "spike"     "04-spike" ;;
  endurance) run_scenario "endurance" "05-endurance" ;;
  orders)    run_scenario "orders"    "06-order-flow" ;;
  all)
    run_scenario "smoke"  "01-smoke"
    run_scenario "load"   "02-load"
    run_scenario "spike"  "04-spike"
    run_scenario "orders" "06-order-flow"
    echo ""
    echo "⏭  Skipped: stress, endurance (run individually — long duration)"
    ;;
  *)
    echo "Unknown scenario: $SCENARIO"
    echo "Valid: smoke | load | stress | spike | endurance | orders | all"
    exit 1
    ;;
esac

echo ""
echo "Reports saved to: $OUTPUT_DIR/"
