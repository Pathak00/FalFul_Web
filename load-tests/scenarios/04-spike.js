/**
 * SPIKE TEST — scenario 04
 * ─────────────────────────
 * Purpose  : Simulate a sudden, extreme traffic burst (flash sale, viral post,
 *            marketing campaign) to check if the system recovers gracefully
 *            after the spike subsides.
 * Pattern  :
 *   Baseline (5 VUs) → Spike (150 VUs) → Recover (5 VUs) — repeat 3 times
 * Key question: Does the system recover fully between spikes, or does each
 *               spike leave the system in a worse state?
 */
import http        from 'k6/http';
import { check, sleep, group } from 'k6';
import { API, THRESHOLDS }     from '../config.js';
import { login, authHeaders }  from '../helpers/auth.js';
import { pickUser, buildOrderPayload, extractSlugs, randomSlug } from '../helpers/data.js';
import { orderSuccessRate, ordersPlaced, loginSuccessRate } from '../helpers/metrics.js';

export const options = {
  stages: [
    // ── Spike 1 ──────────────────────────────────────
    { duration: '1m',   target: 5   },  // baseline
    { duration: '30s',  target: 150 },  // spike up
    { duration: '2m',   target: 150 },  // sustain spike
    { duration: '30s',  target: 5   },  // recover
    { duration: '2m',   target: 5   },  // settle
    // ── Spike 2 ──────────────────────────────────────
    { duration: '30s',  target: 150 },
    { duration: '2m',   target: 150 },
    { duration: '30s',  target: 5   },
    { duration: '2m',   target: 5   },
    // ── Spike 3 ──────────────────────────────────────
    { duration: '30s',  target: 150 },
    { duration: '2m',   target: 150 },
    { duration: '30s',  target: 5   },
    { duration: '1m',   target: 0   },  // done
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    http_req_failed:   ['rate<0.10'],
    checks:            ['rate>0.90'],
    order_success_rate: ['rate>0.85'],
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

  if (roll < 0.65) {
    group('Spike — Browse', () => {
      const res = http.get(`${API}/products`, { tags: { name: 'GET /products' } });
      check(res, { 'products 200': (r) => r.status === 200 });

      if (slugs.length) {
        const r2 = http.get(`${API}/products/${randomSlug(slugs)}`, { tags: { name: 'GET /products/:slug' } });
        check(r2, { 'detail 200': (r) => r.status === 200 });
      }
      sleep(0.5);
    });
  } else {
    group('Spike — Order', () => {
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
}
