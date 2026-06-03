/**
 * STRESS TEST — scenario 03
 * ──────────────────────────
 * Purpose  : Push the system beyond normal capacity to identify the breaking
 *            point and observe failure behaviour (error types, which tier
 *            degrades first — API, DB, etc.)
 * Stages   : Ramp in steps of +50 VUs every 3 min, up to 400 VUs, then
 *            sustained overload for 5 min, then cool-down.
 * Expected : System may degrade at high VU counts.  The test INTENTIONALLY
 *            violates thresholds to reveal bottlenecks — review the JSON
 *            report rather than just pass/fail.
 * Notes    : Run this in isolation; never against production without approval.
 */
import http        from 'k6/http';
import { check, sleep, group } from 'k6';
import { API }                 from '../config.js';
import { login, authHeaders }  from '../helpers/auth.js';
import { pickUser, buildOrderPayload, randomSlug, extractSlugs } from '../helpers/data.js';
import {
  loginSuccessRate,
  orderSuccessRate,
  ordersPlaced,
  productListDuration,
} from '../helpers/metrics.js';

export const options = {
  stages: [
    { duration: '2m', target: 50  },  // warm up
    { duration: '3m', target: 100 },  // moderate load
    { duration: '3m', target: 150 },  // high load
    { duration: '3m', target: 200 },  // very high load
    { duration: '3m', target: 300 },  // extreme load
    { duration: '3m', target: 400 },  // near-breaking point
    { duration: '5m', target: 400 },  // sustain overload — observe behaviour
    { duration: '3m', target: 0   },  // cool-down
  ],
  thresholds: {
    // Relaxed — stress tests intentionally push past comfortable limits.
    // The goal is observation, not pass/fail.
    http_req_duration: ['p(95)<2000', 'p(99)<5000'],
    http_req_failed:   ['rate<0.20'],
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

export default function({ products, slugs }) {
  const roll = Math.random();

  if (roll < 0.60) {
    browseProducts(slugs);
  } else if (roll < 0.85) {
    authenticatedFlow(slugs, products);
  } else {
    orderFlow(products);
  }
}

function browseProducts(slugs) {
  group('Stress — Browse', () => {
    const start = Date.now();
    const res   = http.get(`${API}/products`, { tags: { name: 'GET /products' } });
    productListDuration.add(Date.now() - start);
    check(res, { 'products 200': (r) => r.status === 200 });

    if (slugs.length) {
      const res2 = http.get(`${API}/products/${randomSlug(slugs)}`, { tags: { name: 'GET /products/:slug' } });
      check(res2, { 'detail 200': (r) => r.status === 200 });
    }
    sleep(0.3);
  });
}

function authenticatedFlow(slugs, products) {
  group('Stress — Auth flow', () => {
    const user  = pickUser();
    const token = login(user.identifier, user.password);
    loginSuccessRate.add(!!token);
    if (!token) return;

    const hdrs = authHeaders(token);
    const res  = http.get(`${API}/products`, { headers: hdrs, tags: { name: 'GET /products (auth)' } });
    check(res, { 'auth list 200': (r) => r.status === 200 });

    if (slugs.length) {
      http.get(`${API}/products/${randomSlug(slugs)}`, { headers: hdrs, tags: { name: 'GET /products/:slug (auth)' } });
    }
    sleep(0.5);
  });
}

function orderFlow(products) {
  group('Stress — Order placement', () => {
    const user  = pickUser();
    const token = login(user.identifier, user.password);
    loginSuccessRate.add(!!token);
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

    sleep(0.5);
  });
}
