import { Rate, Trend, Counter } from 'k6/metrics';

// ─── Custom application-level metrics ─────────────────────────────────────

/** Rate of successful order placements vs attempts */
export const orderSuccessRate = new Rate('order_success_rate');

/** End-to-end time for full order flow: login → browse → place order */
export const orderFlowDuration = new Trend('order_flow_duration_ms', true);

/** Total orders successfully placed */
export const ordersPlaced = new Counter('orders_placed_total');

/** Rate of successful logins */
export const loginSuccessRate = new Rate('login_success_rate');

/** Number of login failures */
export const loginFailures = new Counter('login_failures_total');

/** Time to fetch product list */
export const productListDuration = new Trend('product_list_duration_ms', true);

/** Time to fetch a single product detail */
export const productDetailDuration = new Trend('product_detail_duration_ms', true);

/** Rate of checkout config fetches that succeeded */
export const checkoutConfigSuccessRate = new Rate('checkout_config_success_rate');
