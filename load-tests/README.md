# FalFul — Load & Performance Testing

This directory contains a [k6](https://k6.io) test suite for measuring and
stress-testing the FalFul API (`FalFul.API`).

---

## Directory layout

```
load-tests/
├── config.js                  Shared configuration (base URL, users, thresholds)
├── helpers/
│   ├── auth.js                Login / register helpers
│   ├── data.js                Test-data generators (users, orders, slugs)
│   └── metrics.js             Custom k6 metrics (order rate, login rate, etc.)
├── scenarios/
│   ├── 01-smoke.js            Smoke test        — 1 VU, 2 min
│   ├── 02-load.js             Load test         — ramp to 50 VUs, 15 min total
│   ├── 03-stress.js           Stress test       — ramp to 400 VUs, find breaking point
│   ├── 04-spike.js            Spike test        — 3× burst to 150 VUs
│   ├── 05-endurance.js        Endurance / soak  — 30 VUs for 35 min
│   └── 06-order-flow.js       Order-flow stress — 60 VUs, full order journey
├── reports/                   JSON + summary output (git-ignored)
├── run-tests.ps1              Windows runner
└── run-tests.sh               Unix / WSL runner
```

---

## Prerequisites

### 1 — Install k6

| Platform | Command |
|----------|---------|
| Windows (winget) | `winget install k6 --source winget` |
| Windows (choco)  | `choco install k6` |
| macOS            | `brew install k6` |
| Ubuntu / Debian  | See [k6 Linux install](https://k6.io/docs/get-started/installation/#linux) |
| Docker           | `docker pull grafana/k6` |

Verify: `k6 version`

### 2 — Start the FalFul API

```bash
# From the repo root
dotnet run --project src/Backend/FalFul.API/FalFul.API.csproj
# Default: http://localhost:5287
```

### 3 — Create 25 load-test user accounts

The test pool expects accounts `loadtest01@falfulfresh.com` …
`loadtest25@falfulfresh.com`, all with password `LoadTest@123!`.

**Option A — Seed script (run once, requires the API to be running)**

```powershell
# PowerShell
cd load-tests
for ($i = 1; $i -le 25; $i++) {
    $n = $i.ToString().PadLeft(2, '0')
    $body = @{
        fullName = "Load Test $n"
        email    = "loadtest${n}@falfulfresh.com"
        password = "LoadTest@123!"
        phone    = "98$(1000000 + $i)"
    } | ConvertTo-Json
    Invoke-RestMethod -Uri http://localhost:5287/api/auth/register `
        -Method POST -ContentType "application/json" -Body $body -ErrorAction SilentlyContinue
    Write-Host "Created loadtest$n"
}
```

**Option B — Override credentials** to use a single existing user:

```powershell
$env:TEST_EMAIL    = "your@email.com"
$env:TEST_PASSWORD = "yourpassword"
k6 run --env BASE_URL=http://localhost:5287 `
       --env TEST_EMAIL=$env:TEST_EMAIL `
       --env TEST_PASSWORD=$env:TEST_PASSWORD `
       scenarios/01-smoke.js
```

### 4 — Ensure test products exist

The order-placement tests pick from the product catalogue. Make sure at least
a few products with `isAvailable = true` and no `minOrderGrams` constraint
exist in the database (regular whole-fruit products, not cut-fruit).

---

## Running tests

### Windows (PowerShell)

```powershell
cd load-tests

# Run a single scenario
.\run-tests.ps1 -Scenario smoke
.\run-tests.ps1 -Scenario load
.\run-tests.ps1 -Scenario orders

# Run all core scenarios (skips stress & endurance by default)
.\run-tests.ps1 -Scenario all

# Target a different server
.\run-tests.ps1 -Scenario load -BaseUrl http://staging.falfulfresh.com
```

### Unix / WSL / macOS

```bash
chmod +x run-tests.sh
./run-tests.sh smoke
./run-tests.sh load
./run-tests.sh all
```

### Run a single scenario directly

```bash
k6 run --env BASE_URL=http://localhost:5287 scenarios/02-load.js
```

### HTML dashboard (live metrics in browser)

```bash
k6 run --out web-dashboard scenarios/02-load.js
# Open http://localhost:5665 in your browser
```

---

## Scenario descriptions

| # | Scenario | VUs | Duration | Purpose |
|---|----------|-----|----------|---------|
| 01 | **Smoke** | 1 | 2 min | Verify all endpoints respond correctly with zero load |
| 02 | **Load** | 0 → 50 | 15 min | Normal expected traffic; validates SLAs |
| 03 | **Stress** | 0 → 400 | ~30 min | Find the breaking point; observe failure mode |
| 04 | **Spike** | 5 → 150 × 3 | ~20 min | Flash-sale burst; test recovery between spikes |
| 05 | **Endurance** | 30 | 35 min | Long-running soak; detect memory leaks, pool exhaustion |
| 06 | **Order Flow** | 0 → 60 | 12 min | Full order journey; measure orders/sec throughput |

### Traffic mix (scenarios 02 / 04 / 05)

| Behaviour | Share |
|-----------|-------|
| Anonymous browsing (products, categories) | 50–70 % |
| Authenticated browsing (+ order history) | 20–30 % |
| Full order placement | 10–20 % |

---

## Metrics captured

### Built-in k6 metrics

| Metric | Description |
|--------|-------------|
| `http_req_duration` | End-to-end request latency (p50, p95, p99, max) |
| `http_req_failed` | Rate of non-2xx responses |
| `http_reqs` | Total requests / requests per second (RPS) |
| `vus` | Current virtual user count |
| `iterations` | Completed test iterations |
| `data_sent` / `data_received` | Bandwidth |

### Custom application metrics

| Metric | Description |
|--------|-------------|
| `order_success_rate` | % of order placement attempts that succeeded |
| `order_flow_duration_ms` | End-to-end order journey (login → place → confirm) |
| `order_flow_submit_ms` | POST /api/orders latency specifically |
| `order_flow_login_ms` | Login step latency |
| `orders_placed_total` | Cumulative orders successfully placed |
| `login_success_rate` | % of login attempts that returned a valid token |
| `login_failures_total` | Count of failed logins |
| `product_list_duration_ms` | GET /api/products latency |
| `product_detail_duration_ms` | GET /api/products/:slug latency |
| `checkout_config_success_rate` | GET /api/settings/checkout-config success rate |

---

## Thresholds (pass/fail criteria)

Default thresholds defined in `config.js`:

| Metric | Threshold |
|--------|-----------|
| `http_req_duration` p(95) | < 500 ms |
| `http_req_duration` p(99) | < 1 000 ms |
| `http_req_failed` | < 1 % |
| `checks` | > 95 % |

Stress test uses relaxed thresholds (p95 < 2 s, errors < 20 %) because the
goal is observation, not pass/fail.

---

## Reading the reports

After each run, two files are written to `reports/`:

- `TIMESTAMP_SCENARIO.json` — raw k6 data points (one JSON object per line).
  Import into Grafana, InfluxDB, or parse with `jq`.
- `TIMESTAMP_SCENARIO_summary.json` — aggregated end-of-test summary with
  all metric statistics.

### Quick analysis with jq (Linux / macOS)

```bash
# P95 response time for the load test
jq '.metrics.http_req_duration.values["p(95)"]' reports/*_load_summary.json

# Total orders placed
jq '.metrics.orders_placed_total.values.count' reports/*_orders_summary.json

# Error rate
jq '.metrics.http_req_failed.values.rate' reports/*_load_summary.json

# Order success rate
jq '.metrics.order_success_rate.values.rate' reports/*_orders_summary.json
```

### PowerShell

```powershell
$summary = Get-Content "reports\*_load_summary.json" | ConvertFrom-Json
$summary.metrics.http_req_duration.values.'p(95)'
$summary.metrics.http_req_failed.values.rate
$summary.metrics.orders_placed_total.values.count
```

---

## Interpreting results

### What to look for in the Stress test

| Observation | Likely bottleneck |
|-------------|-------------------|
| Latency spikes at ~100 VUs | .NET thread pool saturation |
| DB errors (`500 Internal Server Error`) at high load | EF Core connection pool exhausted |
| Memory climbs without release (visible in task manager) | Memory leak in middleware or DI scope |
| `429 Too Many Requests` | Rate-limiter kicking in (check `RateLimiting` in `Program.cs`) |
| `503 Service Unavailable` | Kestrel / IIS worker exhausted |

### What to look for in the Endurance test

| Observation | Likely cause |
|-------------|--------------|
| P(95) creeps up steadily over 30 min | Memory leak causing GC pressure |
| DB query latency grows | Missing indexes, bloated tables, or lock contention |
| Login success rate drops after 60 min | JWT expiry not handled in VU session |

---

## Recommended optimization checklist

Based on common findings when running these tests against .NET APIs with EF Core:

- [ ] **Connection pool size** — Check `MaxPoolSize` in the connection string (default 100).
      Increase to 200–500 for high-concurrency scenarios.
- [ ] **Async everywhere** — Ensure all controller actions and service methods use
      `async/await` end-to-end. Synchronous `.Result` / `.Wait()` causes thread starvation.
- [ ] **Response caching** — Add `[ResponseCache]` or `IMemoryCache` for
      `GET /api/products`, `GET /api/categories`, `GET /api/settings/checkout-config`.
- [ ] **Database indexes** — Verify indexes on `Orders.UserId`, `Products.Slug`,
      `Products.IsAvailable`, `Products.IsFeatured`.
- [ ] **Rate limiting** — Add `AddRateLimiter` in `Program.cs` to prevent one client
      from consuming all connections during a real-world spike.
- [ ] **Output caching / CDN** — Public product images and catalogue can be cached
      at the CDN layer; keep API calls for auth-required operations only.
- [ ] **Pagination** — `GET /api/products` should return paginated results under
      load to limit payload size and DB query cost.
- [ ] **Health check endpoint** — Add `GET /health` for load-balancer readiness probes.

---

## Notes

- All orders placed by load tests include the note
  `[LOAD TEST] Auto-generated order — safe to delete`.
  Run `DELETE FROM Orders WHERE Notes LIKE '%LOAD TEST%'` to clean up.
- Never run `03-stress.js` or `05-endurance.js` against the production
  database without explicit approval and a maintenance window.
- The `reports/` directory is git-ignored (`reports/*.json`).
