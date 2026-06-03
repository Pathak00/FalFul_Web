/**
 * SMOKE TEST — scenario 01
 * ─────────────────────────
 * Purpose  : Verify the API is reachable and all critical endpoints respond
 *            correctly with minimal traffic before heavier tests run.
 * Load     : 1 VU for 2 minutes
 * Pass/fail: All checks must pass; no errors; p(95) < 500 ms
 */
import http        from 'k6/http';
import { check, sleep, group } from 'k6';
import { API, TEST_EMAIL, TEST_PASSWORD, THRESHOLDS } from '../config.js';
import { login, authHeaders }     from '../helpers/auth.js';
import { buildOrderPayload }      from '../helpers/data.js';
import {
  loginSuccessRate,
  orderSuccessRate,
  productListDuration,
} from '../helpers/metrics.js';

export const options = {
  vus:      1,
  duration: '2m',
  thresholds: {
    ...THRESHOLDS,
    http_req_failed: ['rate<0.001'],   // stricter for smoke
    checks:          ['rate==1.0'],
  },
};

export function setup() {
  // Pre-fetch products so VUs don't need to discover them independently
  const res  = http.get(`${API}/products`);
  const list = JSON.parse(res.body);
  return { products: Array.isArray(list) ? list : [] };
}

export default function({ products }) {

  group('Public — Product Catalogue', () => {
    const start = Date.now();
    const res = http.get(`${API}/products`, { tags: { name: 'GET /products' } });
    productListDuration.add(Date.now() - start);

    check(res, {
      'GET /products → 200':    (r) => r.status === 200,
      'GET /products → array':  (r) => Array.isArray(JSON.parse(r.body)),
    });
    sleep(0.5);
  });

  group('Public — Categories', () => {
    const res = http.get(`${API}/categories`, { tags: { name: 'GET /categories' } });
    check(res, { 'GET /categories → 200': (r) => r.status === 200 });
    sleep(0.5);
  });

  group('Public — Checkout Config', () => {
    const res = http.get(`${API}/settings/checkout-config`, { tags: { name: 'GET /settings/checkout-config' } });
    check(res, { 'GET /settings/checkout-config → 200': (r) => r.status === 200 });
    sleep(0.5);
  });

  group('Public — Price Rules', () => {
    const res = http.get(`${API}/orders/price-rules`, { tags: { name: 'GET /orders/price-rules' } });
    check(res, { 'GET /orders/price-rules → 200': (r) => r.status === 200 });
    sleep(0.5);
  });

  group('Auth — Login', () => {
    const token = login(TEST_EMAIL, TEST_PASSWORD);
    const ok    = !!token;
    loginSuccessRate.add(ok);

    if (!ok) { sleep(1); return; }

    group('Auth — Authenticated product detail', () => {
      if (!products.length) return;
      const slug = products[0].slug;
      const res  = http.get(`${API}/products/${slug}`, {
        headers: authHeaders(token),
        tags:    { name: 'GET /products/:slug' },
      });
      check(res, { 'GET /products/:slug → 200': (r) => r.status === 200 });
    });

    group('Auth — Place one order', () => {
      const payload = buildOrderPayload(products);
      if (!payload) return;

      const res = http.post(
        `${API}/orders`,
        JSON.stringify(payload),
        { headers: authHeaders(token), tags: { name: 'POST /orders' } },
      );

      const placed = check(res, {
        'POST /orders → 200/201': (r) => r.status === 200 || r.status === 201,
        'POST /orders → orderId': (r) => {
          try { return !!JSON.parse(r.body).orderId; } catch { return false; }
        },
      });
      orderSuccessRate.add(placed);
    });
  });

  sleep(1);
}
