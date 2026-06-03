/**
 * ENDURANCE / SOAK TEST — scenario 05
 * ─────────────────────────────────────
 * Purpose  : Run moderate load for an extended period to surface problems
 *            that only appear over time:
 *              - Memory leaks in the .NET API process
 *              - Connection pool exhaustion (EF Core / PostgreSQL)
 *              - JWT token expiry / session degradation
 *              - Disk or log file growth
 *              - Gradual response time creep
 * Load     : 30 VUs sustained for 30 minutes
 * Metrics  : Watch for p(95) trending upward over time — export to JSON and
 *            graph latency vs. time to reveal creeping degradation.
 */
import http        from 'k6/http';
import { check, sleep, group } from 'k6';
import { API, THRESHOLDS }     from '../config.js';
import { login, authHeaders }  from '../helpers/auth.js';
import { pickUser, buildOrderPayload, extractSlugs, randomSlug } from '../helpers/data.js';
import {
  loginSuccessRate,
  orderSuccessRate,
  ordersPlaced,
  productListDuration,
  productDetailDuration,
} from '../helpers/metrics.js';

export const options = {
  stages: [
    { duration: '2m',  target: 30 },   // gentle ramp
    { duration: '30m', target: 30 },   // sustained soak
    { duration: '3m',  target: 0  },   // ramp down
  ],
  thresholds: {
    ...THRESHOLDS,
    // Tighter on endurance — degradation that creeps in should fail the test
    http_req_duration:  ['p(95)<600', 'p(99)<1200'],
    http_req_failed:    ['rate<0.005'],
    order_success_rate: ['rate>0.95'],
    login_success_rate: ['rate>0.97'],
  },
};

export function setup() {
  const res      = http.get(`${API}/products`);
  const products = JSON.parse(res.body);
  return {
    products: Array.isArray(products) ? products : [],
    slugs:    Array.isArray(products) ? extractSlugs(products) : [],
  };
}

// Each VU gets its own token and refreshes it if needed
let _token   = null;
let _tokenAt = 0;

function getToken() {
  const now = Date.now();
  // Refresh token every 55 minutes (JWT expires at 60 min)
  if (!_token || now - _tokenAt > 55 * 60 * 1000) {
    const user = pickUser();
    _token     = login(user.identifier, user.password);
    _tokenAt   = now;
    loginSuccessRate.add(!!_token);
  }
  return _token;
}

export default function({ products, slugs }) {
  const roll = Math.random();

  if (roll < 0.50) {
    group('Endurance — Browse public', () => {
      let start = Date.now();
      let res   = http.get(`${API}/products`, { tags: { name: 'GET /products' } });
      productListDuration.add(Date.now() - start);
      check(res, { 'products 200': (r) => r.status === 200 });
      sleep(think(1, 3));

      if (slugs.length) {
        start = Date.now();
        res   = http.get(`${API}/products/${randomSlug(slugs)}`, { tags: { name: 'GET /products/:slug' } });
        productDetailDuration.add(Date.now() - start);
        check(res, { 'detail 200': (r) => r.status === 200 });
        sleep(think(1, 2));
      }
    });
  } else if (roll < 0.80) {
    group('Endurance — Auth browse', () => {
      const token = getToken();
      if (!token) return;

      const hdrs = authHeaders(token);
      const res  = http.get(`${API}/products`, { headers: hdrs, tags: { name: 'GET /products (auth)' } });
      check(res, { 'auth products 200': (r) => r.status === 200 });
      sleep(think(1, 2));

      const res2 = http.get(`${API}/orders`, { headers: hdrs, tags: { name: 'GET /orders' } });
      check(res2, { 'orders list 200': (r) => r.status === 200 });
      sleep(think(1, 2));
    });
  } else {
    group('Endurance — Place order', () => {
      const token = getToken();
      if (!token) return;

      const payload = buildOrderPayload(products);
      if (!payload) return;

      const res = http.post(
        `${API}/orders`,
        JSON.stringify(payload),
        { headers: authHeaders(token), tags: { name: 'POST /orders' } },
      );
      const placed = check(res, {
        'order 200': (r) => r.status === 200 || r.status === 201,
      });
      orderSuccessRate.add(placed);
      if (placed) ordersPlaced.add(1);
      sleep(think(2, 4));
    });
  }
}

function think(min, max) {
  return min + Math.random() * (max - min);
}
