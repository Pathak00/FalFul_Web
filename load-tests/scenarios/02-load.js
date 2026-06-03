/**
 * LOAD TEST — scenario 02
 * ────────────────────────
 * Purpose  : Simulate expected normal production traffic.
 *            Validates the system under a realistic mix of user behaviour.
 * Stages   : Ramp 0 → 50 VUs over 3 min, sustain 10 min, ramp down 2 min
 * Mix      : 70 % anonymous browsing | 20 % auth browsing | 10 % order placement
 * Pass/fail: p(95) < 500 ms, error rate < 1 %, checks > 95 %
 */
import http        from 'k6/http';
import { check, sleep, group } from 'k6';
import { API, THRESHOLDS }     from '../config.js';
import { login, authHeaders }  from '../helpers/auth.js';
import { pickUser, buildOrderPayload, randomSlug, extractSlugs } from '../helpers/data.js';
import {
  loginSuccessRate,
  orderSuccessRate,
  ordersPlaced,
  productListDuration,
  productDetailDuration,
} from '../helpers/metrics.js';

export const options = {
  stages: [
    { duration: '3m', target: 50 },   // ramp up
    { duration: '10m', target: 50 },  // sustain
    { duration: '2m', target: 0 },    // ramp down
  ],
  thresholds: {
    ...THRESHOLDS,
    order_success_rate: ['rate>0.90'],
    login_success_rate: ['rate>0.95'],
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
  // Distribute traffic: 70% browse, 20% auth browse, 10% order
  const roll = Math.random();

  if (roll < 0.70) {
    anonymousBrowse(slugs);
  } else if (roll < 0.90) {
    authenticatedBrowse(slugs);
  } else {
    placeOrder(products);
  }
}

// ── Scenarios ───────────────────────────────────────────────────────────────

function anonymousBrowse(slugs) {
  group('Anon — Browse', () => {
    let start = Date.now();
    let res   = http.get(`${API}/products`, { tags: { name: 'GET /products' } });
    productListDuration.add(Date.now() - start);
    check(res, { 'products list 200': (r) => r.status === 200 });
    sleep(think(1, 2));

    if (slugs.length) {
      const slug = randomSlug(slugs);
      start = Date.now();
      res   = http.get(`${API}/products/${slug}`, { tags: { name: 'GET /products/:slug' } });
      productDetailDuration.add(Date.now() - start);
      check(res, { 'product detail 200': (r) => r.status === 200 });
      sleep(think(1, 3));
    }

    res = http.get(`${API}/categories`, { tags: { name: 'GET /categories' } });
    check(res, { 'categories 200': (r) => r.status === 200 });
    sleep(think(0.5, 1.5));
  });
}

function authenticatedBrowse(slugs) {
  group('Auth — Browse', () => {
    const user  = pickUser();
    const token = login(user.identifier, user.password);
    loginSuccessRate.add(!!token);
    if (!token) return;

    const hdrs = authHeaders(token);

    let start = Date.now();
    let res   = http.get(`${API}/products`, { headers: hdrs, tags: { name: 'GET /products' } });
    productListDuration.add(Date.now() - start);
    check(res, { 'auth products list 200': (r) => r.status === 200 });
    sleep(think(1, 2));

    if (slugs.length) {
      start = Date.now();
      res   = http.get(`${API}/products/${randomSlug(slugs)}`, { headers: hdrs, tags: { name: 'GET /products/:slug' } });
      productDetailDuration.add(Date.now() - start);
      check(res, { 'auth product detail 200': (r) => r.status === 200 });
      sleep(think(1, 3));
    }

    res = http.get(`${API}/settings/checkout-config`, { headers: hdrs, tags: { name: 'GET /settings/checkout-config' } });
    check(res, { 'checkout config 200': (r) => r.status === 200 });
    sleep(think(0.5, 1));
  });
}

function placeOrder(products) {
  group('Order — Full flow', () => {
    const user  = pickUser();
    const token = login(user.identifier, user.password);
    loginSuccessRate.add(!!token);
    if (!token) return;

    sleep(think(1, 2));

    const payload = buildOrderPayload(products);
    if (!payload) return;

    const res = http.post(
      `${API}/orders`,
      JSON.stringify(payload),
      { headers: authHeaders(token), tags: { name: 'POST /orders' } },
    );

    const placed = check(res, {
      'order placed 200': (r) => r.status === 200 || r.status === 201,
      'order has id':     (r) => {
        try { return !!JSON.parse(r.body).orderId; } catch { return false; }
      },
    });
    orderSuccessRate.add(placed);
    if (placed) ordersPlaced.add(1);
  });
}

/** Random think time between min and max seconds */
function think(min, max) {
  return min + Math.random() * (max - min);
}
