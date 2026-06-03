# FalFul — Load & Performance Testing + Optimization Report

**Test Date:** 2026-06-03  
**Optimization Date:** 2026-06-03  
**Environment:** Local development (Windows 11, .NET 10, SQL Server)  
**Tool:** k6 v2.0.0  
**Branch:** Efficiency_Test  

---

## Executive Summary

**Before optimization:** FalFul handled ~50 concurrent mixed users safely (337 ms p95, 0.04 % error) but
degraded severely at 60 concurrent order-placing users (2.36 s p95, 11.7 % errors, 37 % order success).
The stress test confirmed p95 climbed to 6.36 s at 400 VUs with 5.18 % errors.

**After optimization:** Six improvements were implemented targeting the three confirmed bottlenecks
(BCrypt saturation, zero caching, unbounded DB connection pool). Expected gains: 3–5× throughput
improvement for product catalogue endpoints and a 60–80 % reduction in authentication latency
under concurrent load.

---

## Test Results — BEFORE Optimization

### 1. Smoke Test — 1 VU / 2 min ✅

| Metric | Value |
|--------|-------|
| Throughput | 2.09 req/s |
| p(95) latency | 335 ms |
| Error rate | 0.00 % |
| Login success | 100 % |
| Order success | 100 % |
| Product list p(95) | 4 ms |

**Initial run caught a real API bug:** minimum order amount (Rs. 200) was not being
respected by test data. Fixed in `helpers/data.js`; clean re-run showed 100 % success.

---

### 2. Load Test — 50 VUs / 15 min, mixed traffic ✅ PASSED ALL

Traffic mix: 70 % anonymous browse · 20 % auth browse · 10 % order placement

| Metric | Value | Threshold |
|--------|-------|-----------|
| p(95) latency | **337 ms** | < 500 ms ✅ |
| p(99) latency | **646 ms** | < 1 000 ms ✅ |
| Error rate | **0.04 %** | < 1 % ✅ |
| Login success | **100 %** | > 95 % ✅ |
| Order success | **98.65 %** | > 90 % ✅ |
| Throughput | **30 req/s** | — |
| Product list p(95) | **9 ms** | — |
| Product detail p(95) | **9 ms** | — |
| Total requests | 26,983 | — |

**Finding:** 50 concurrent mixed users = **safe operating zone**.

---

### 3. Order Flow Test — 60 VUs all placing orders / 12 min ❌ FAILED

Every VU: login → products → checkout-config + price-rules (parallel) → place order → check status.

| Metric | Value | Threshold |
|--------|-------|-----------|
| p(95) latency | **2.36 s** | < 800 ms ❌ (2.95×) |
| p(99) latency | **4.5 s** | < 1 500 ms ❌ (3×) |
| Error rate | **11.71 %** | < 2 % ❌ (5.9×) |
| Login p(95) | **4.57 s** | < 300 ms ❌ (**15×**) |
| Product fetch p(95) | **378 ms** | < 400 ms ✅ |
| Order submit p(95) | **2.05 s** | < 600 ms ❌ (3.4×) |
| Order success rate | **37.09 %** | > 90 % ❌ |
| Orders placed / attempted | 2,144 / 5,779 | — |
| Throughput | 43 req/s | — |
| Full flow p(95) | **7.13 s** | — |

**Breaking point: 50–60 concurrent order-heavy users.**

---

### 4. Stress Test — 0 → 400 VUs step-ramp / 25 min ❌ FAILED

Step ramp: 50 → 100 → 150 → 200 → 300 → 400 VUs, sustained overload at 400 VUs.

| Metric | Value | Threshold |
|--------|-------|-----------|
| p(95) latency | **6.36 s** | < 2 000 ms ❌ (3.2×) |
| p(99) latency | **10.24 s** | < 5 000 ms ❌ (2×) |
| Error rate | **5.18 %** | < 20 % ✅ |
| Checks passed | **95.13 %** | — |
| Login success | **100 %** | — |
| Order success | **21.47 %** | — |
| Max VUs reached | **400 / 400** | — |
| Throughput | **122 req/s** | — |
| Total requests | 182,479 | — |
| Total iterations | 80,993 (54/s) | — |

**Key insight:** System **did not crash** at 400 VUs — it degraded gracefully.
Login remained 100 % successful at all loads, proving authentication itself is not broken,
only slow under BCrypt CPU saturation. Order failures are the primary degradation signal.

---

## Performance Profile Summary (Before)

| Concurrent Users | Traffic Type | p(95) | Error Rate | Order Success | Assessment |
|------------------|-------------|-------|-----------|---------------|------------|
| 1 | Mixed | 335 ms | 0.00 % | 100 % | ✅ Healthy |
| 50 | Mixed 70/20/10 | 337 ms | 0.04 % | 98.65 % | ✅ Safe zone |
| 60 | All order flow | 2 360 ms | 11.71 % | 37 % | ❌ Degraded |
| 400 | Mixed (stress) | 6 360 ms | 5.18 % | 21 % | ⚠️ Overloaded |

---

## Bottleneck Analysis

| # | Bottleneck | Evidence | Severity |
|---|-----------|----------|----------|
| 1 | **BCrypt work-factor 12** | Login p95 jumped 15× (300 ms → 4.57 s) at 60 VUs; login always succeeds (100 %) but takes 4+ s because 60 CPU-bound verifications saturate the thread pool | 🔴 Critical |
| 2 | **Zero response caching** | `GET /api/products` hits the SQL stored procedure on every single request; under 30 RPS = 1,800 identical DB reads per minute | 🔴 Critical |
| 3 | **Default SQL Server connection pool (max 100)** | At 60 VUs × 2 DB operations per order = 120 concurrent connections required; pool exhaustion causes queuing | 🔴 Critical |
| 4 | **No rate limiting** | Allows unlimited concurrent logins from same IP; 60 VUs × login = 60 concurrent BCrypt calls | 🟡 High |
| 5 | **No response compression** | JSON responses sent uncompressed; product lists ~20 KB per response | 🟡 Medium |
| 6 | **Double DB query on phone logins** | `LoginAsync` always tries email then phone; phone-based logins waste 1 DB round trip | 🟢 Low |

---

## Optimizations Implemented

All changes committed to `Efficiency_Test` branch.

### 1. SQL Server Connection Pool — `appsettings.json`

```json
"FalFulDb": "...;Min Pool Size=5;Max Pool Size=300;ConnectTimeout=10;"
```

**Impact:** Raises pool ceiling from 100 to 300, eliminating pool exhaustion at 60–120 concurrent
DB users. `Min Pool Size=5` keeps 5 warm connections so cold-start is faster.

---

### 2. In-Process Product/Category Cache — `ProductService.cs`

Added `IMemoryCache` with a shared `CancellationChangeToken` eviction pattern:

- **`GetPublicProductsAsync`** — 45 s TTL, keyed on `categoryId:search:featuredOnly`
- **`GetFeaturedProductsAsync`** — 45 s TTL
- **`GetActiveCategoriesAsync`** — 5 min TTL
- **`GetProductBySlugAsync`** — 45 s TTL per slug
- **Admin write operations** (create/update/delete/setAvailability) — immediately evict all
  product entries via `CancellationTokenSource.Cancel()`

**Expected impact:** Product catalogue DB calls drop from 1,800/min → ~2/min under 30 RPS
(once the cache is warm). Product list p(95) expected to drop from 9 ms → < 1 ms.

---

### 3. BCrypt Concurrency Semaphore — `AuthService.cs`

```csharp
private static readonly SemaphoreSlim _bcryptGate =
    new(Math.Max(1, Environment.ProcessorCount),
        Math.Max(1, Environment.ProcessorCount));
```

At login, `_bcryptGate.WaitAsync()` queues requests beyond `ProcessorCount` (e.g., 8 on an
8-core machine). This prevents 60 goroutines from each doing a 300 ms CPU-bound BCrypt
verification simultaneously, eliminating thread-pool saturation.

**Expected impact:** Login p(95) under 60 concurrent users: 4.57 s → ~2 s (bounded by queuing
time + sequential throughput). Under normal 50-VU mixed load: no change (<100 ms).

---

### 4. Smart Email/Phone Routing — `AuthService.cs`

```csharp
user = dto.Identifier.Contains('@')
    ? await _userRepo.GetByEmailAsync(dto.Identifier)
    : await _userRepo.GetByPhoneAsync(dto.Identifier);
```

Identifiers with `@` go straight to the email lookup. Numeric identifiers go straight to
phone. Ambiguous identifiers (neither) fall back to the original try-both behaviour.

**Impact:** Eliminates a wasted DB query for phone-based logins (1 round trip → 0 wasted trips).

---

### 5. Response Compression — `Program.cs`

```csharp
builder.Services.AddResponseCompression(opts => {
    opts.EnableForHttps = true;
    opts.Providers.Add<BrotliCompressionProvider>();
    opts.Providers.Add<GzipCompressionProvider>();
});
```

Brotli preferred, Gzip fallback. Both configured at `CompressionLevel.Fastest` to minimise
CPU overhead. Applied before controllers in the middleware pipeline.

**Expected impact:** Product list responses (~20 KB JSON) compress ~70 % with Brotli → ~6 KB.
Reduces bandwidth and proxy cache storage. Throughput improvement is modest but meaningful at
high request volumes.

---

### 6. Rate Limiting — `Program.cs` + `AuthController.cs`

Sliding-window limiters, partitioned by remote IP:

| Policy | Permit Limit | Window | Applied To |
|--------|-------------|--------|------------|
| `login` | 10 req | 1 minute | `POST /api/auth/login` |
| `register` | 5 req | 5 minutes | `POST /api/auth/register` |

**Impact:** Prevents BCrypt saturation caused by brute-force or runaway clients.
Under load testing, limits VUs per IP before they can exhaust the BCrypt semaphore.
Returns HTTP 429 with `Retry-After: 60` header on breach.

---

### 7. Health Check Endpoint — `Program.cs` + `HealthChecks/DatabaseHealthCheck.cs`

```
GET /health        → full JSON status with DB check duration
GET /health/ready  → minimal {"status":"ready"} for load-balancer probes
```

`DatabaseHealthCheck` opens a `SqlConnection` and executes `SELECT 1` to confirm DB
connectivity. No additional packages — uses `Microsoft.Data.SqlClient` already in scope.

---

## Before vs After — Expected Metrics

| Metric | Before | After (estimated) | Improvement |
|--------|--------|--------------------|------------|
| `GET /api/products` p(95) @ 50 VUs | 9 ms | < 1 ms | ~10× |
| Login p(95) @ 60 concurrent | 4.57 s | ~1–2 s | ~3–5× |
| Order success rate @ 60 VUs | 37 % | 65–80 % | +70–115 % |
| p(95) latency @ 50 VUs mixed | 337 ms | ~150–200 ms | ~2× |
| Max product DB reads/min @ 30 RPS | 1,800 | ~2 (cache warm) | 900× |
| Error rate @ 400 VUs stress | 5.18 % | ~2–3 % | ~2× |
| Supported concurrent mixed users | ~50 | ~100–150 | ~2–3× |

*Re-run the k6 load and order-flow scenarios after deployment to confirm actual numbers.*

---

## Production Deployment Recommendations

### Minimum before going live

1. ✅ Connection pool raised to 300 (done)
2. ✅ IMemoryCache on product catalogue (done)
3. ✅ BCrypt semaphore (done)
4. ✅ Rate limiting on auth (done)
5. ✅ Response compression (done)
6. ✅ Health check endpoints (done)
7. ⬜ **Switch to PostgreSQL** — SQLite is not suitable for concurrent writes in production.
   PostgreSQL with a connection pooler (PgBouncer) handles high-concurrency writes far better.
8. ⬜ **Reduce BCrypt work factor from 12 → 10** if latency SLAs can't be met under peak login
   load. Work factor 10 is still industry-standard secure and is 4× faster than 12.
9. ⬜ **Set `ASPNETCORE_ENVIRONMENT=Production`** to enable HTTPS redirect and disable
   OpenAPI/dev tooling.

### Short-term (1–2 sprints)

10. ⬜ Offload email sending to a background queue (removes 200–400 ms from order critical path)
11. ⬜ Add DB indexes: `Orders(UserId)`, `Orders(CreatedAt DESC)`, `Products(Slug)`,
    `Products(IsAvailable)`, `Products(IsFeatured)`
12. ⬜ `GET /health` endpoint already added — wire to load-balancer readiness probe
13. ⬜ Add distributed Redis cache to share cache across multiple API instances

### Scalability (3–6 months)

14. ⬜ Horizontal scaling: 2–3 API instances behind NGINX/Azure Front Door
15. ⬜ Read replica for product catalogue queries
16. ⬜ Async order processing via message queue (RabbitMQ / Azure Service Bus)
17. ⬜ CDN for product images (currently served from API)

---

## Appendix — Raw Metrics (Before)

### Load Test (50 VUs, 15 min mixed)
```
http_req_duration   avg=51 ms   p(95)=337 ms   p(99)=646 ms   max=3.69 s
http_req_failed     0.04 %  (12 / 26,983)
order_success_rate  98.65 %  (877 / 889)
login_success_rate  100 %
http_reqs           26,983 @ 29.9 req/s
```

### Order Flow Test (60 VUs, 12 min, all orders)
```
http_req_duration        avg=539 ms  p(95)=2.36 s  p(99)=4.5 s  max=8.92 s
http_req_failed          11.71 %  (3,635 / 31,040)
order_flow_login_ms      avg=1.7 s  p(95)=4.57 s
order_flow_submit_ms     avg=599 ms  p(95)=2.05 s
order_success_rate       37.09 %  (2,144 / 5,779 attempts)
http_reqs                31,040 @ 42.9 req/s
```

### Stress Test (0 → 400 VUs, 25 min mixed)
```
http_req_duration   avg=1.65 s   p(95)=6.36 s   p(99)=10.24 s   max=33.64 s
http_req_failed     5.18 %  (9,462 / 182,479)
login_success_rate  100 %  (32,541 / 32,541)
order_success_rate  21.47 %  (2,587 / 12,049 attempts)
http_reqs           182,479 @ 122 req/s
iterations          80,993 @ 54 iter/s
vus_max             400
```

---

## Cleanup

All load-test orders include `[LOAD TEST]` in notes:

```sql
DELETE FROM Orders WHERE Notes LIKE '%LOAD TEST%';
```
