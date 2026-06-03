/**
 * CONCURRENT ORDER FLOW — scenario 06
 * ─────────────────────────────────────
 * Purpose  : Focus exclusively on order processing throughput.
 *            Every VU goes through the full order journey: login → browse
 *            → checkout config → price rules → place order → check status.
 *            Answers: How many orders per second can the system process?
 *            What is the order processing p(95) end-to-end latency?
 * Load     : Ramp to 60 concurrent users all placing orders simultaneously.
 */
import http        from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Counter, Rate } from 'k6/metrics';
import { API }                  from '../config.js';
import { login, authHeaders }   from '../helpers/auth.js';
import { pickUser, buildOrderPayload, futureDate } from '../helpers/data.js';
import {
  orderSuccessRate,
  orderFlowDuration,
  ordersPlaced,
  loginSuccessRate,
} from '../helpers/metrics.js';

// Time each phase of the order journey independently
const loginTime        = new Trend('order_flow_login_ms',          true);
const productFetchTime = new Trend('order_flow_product_fetch_ms',  true);
const checkoutInitTime = new Trend('order_flow_checkout_init_ms',  true);
const orderSubmitTime  = new Trend('order_flow_submit_ms',         true);
const orderCheckTime   = new Trend('order_flow_check_status_ms',   true);

const orderAttempts  = new Counter('order_attempts_total');

export const options = {
  stages: [
    { duration: '2m',  target: 20 },  // warm up
    { duration: '5m',  target: 60 },  // full order concurrency
    { duration: '3m',  target: 60 },  // sustain
    { duration: '2m',  target: 0  },  // ramp down
  ],
  thresholds: {
    http_req_duration:         ['p(95)<800', 'p(99)<1500'],
    http_req_failed:           ['rate<0.02'],
    order_success_rate:        ['rate>0.90'],
    order_flow_submit_ms:      ['p(95)<600'],
    order_flow_login_ms:       ['p(95)<300'],
    order_flow_product_fetch_ms: ['p(95)<400'],
  },
};

export function setup() {
  const res      = http.get(`${API}/products`);
  const products = JSON.parse(res.body);
  return { products: Array.isArray(products) ? products : [] };
}

export default function({ products }) {
  const flowStart = Date.now();

  group('OrderFlow — 1. Login', () => {
    const t     = Date.now();
    const user  = pickUser();
    _token      = login(user.identifier, user.password);
    loginTime.add(Date.now() - t);
    loginSuccessRate.add(!!_token);
  });

  if (!_token) { sleep(1); return; }

  group('OrderFlow — 2. Browse products', () => {
    const t   = Date.now();
    const res = http.get(`${API}/products`, {
      headers: authHeaders(_token),
      tags:    { name: 'GET /products' },
    });
    productFetchTime.add(Date.now() - t);
    check(res, { 'products 200': (r) => r.status === 200 });
    sleep(0.5);
  });

  group('OrderFlow — 3. Checkout init (config + price rules)', () => {
    const t   = Date.now();
    const hdrs = authHeaders(_token);
    const [cfgRes, priceRes] = http.batch([
      ['GET', `${API}/settings/checkout-config`, null, { headers: hdrs, tags: { name: 'GET /checkout-config' } }],
      ['GET', `${API}/orders/price-rules`,        null, { headers: hdrs, tags: { name: 'GET /price-rules' } }],
    ]);
    checkoutInitTime.add(Date.now() - t);
    check(cfgRes,   { 'checkout-config 200': (r) => r.status === 200 });
    check(priceRes, { 'price-rules 200':     (r) => r.status === 200 });
    sleep(0.5);
  });

  group('OrderFlow — 4. Place order', () => {
    const payload = buildOrderPayload(products);
    if (!payload) return;

    orderAttempts.add(1);
    const t   = Date.now();
    const res = http.post(
      `${API}/orders`,
      JSON.stringify(payload),
      { headers: authHeaders(_token), tags: { name: 'POST /orders' } },
    );
    orderSubmitTime.add(Date.now() - t);

    const placed = check(res, {
      'order placed 200':  (r) => r.status === 200 || r.status === 201,
      'order has orderId': (r) => {
        try { return !!JSON.parse(r.body).orderId; } catch { return false; }
      },
    });
    orderSuccessRate.add(placed);

    if (placed) {
      ordersPlaced.add(1);

      // 5. Check order status
      const orderId = JSON.parse(res.body).orderId;
      group('OrderFlow — 5. Check order status', () => {
        const t2  = Date.now();
        const r2  = http.get(
          `${API}/orders/${orderId}`,
          { headers: authHeaders(_token), tags: { name: 'GET /orders/:id' } },
        );
        orderCheckTime.add(Date.now() - t2);
        check(r2, { 'order status 200': (r) => r.status === 200 });
      });
    }
  });

  orderFlowDuration.add(Date.now() - flowStart);
  sleep(1);
}

// Module-level token per VU (re-assigned each iteration)
let _token = null;
