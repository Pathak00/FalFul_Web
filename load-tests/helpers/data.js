import { SharedArray } from 'k6/data';
import { API, USER_POOL, DELIVERY } from '../config.js';

// ─── User pool (shared read-only across all VUs) ───────────────────────────
export const USERS = new SharedArray('users', () => USER_POOL);

/** Pick a user from the pool, cycling by VU number so no two VUs share credentials. */
export function pickUser() {
  return USERS[(__VU - 1) % USERS.length];
}

// ─── Delivery date helpers ─────────────────────────────────────────────────
/** Returns a delivery date 2 days from today as YYYY-MM-DD (respects lead time). */
export function futureDate(daysAhead = 2) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split('T')[0];
}

// ─── Order payload builder ─────────────────────────────────────────────────
/**
 * Build a minimal but valid PlaceOrderDto from a products array returned
 * by GET /api/products.  Picks a random available product.
 */
// Minimum order value enforced by the API (Rs. 200)
const MIN_ORDER_VALUE = 200;

export function buildOrderPayload(products) {
  const available = products.filter(p => p.isAvailable && !p.minOrderGrams);
  if (!available.length) return null;

  const product = available[Math.floor(Math.random() * available.length)];
  // Ensure total >= MIN_ORDER_VALUE regardless of unit price
  const minQty  = Math.ceil(MIN_ORDER_VALUE / product.price);
  const qty     = Math.max(minQty, Math.floor(Math.random() * 3) + 1);
  const total   = product.price * qty;

  return {
    ...DELIVERY,
    deliveryDate: futureDate(2),
    items: [{
      productId:    product.id,
      productName:  product.name,
      productSlug:  product.slug,
      imageUrl:     product.imageUrl || null,
      unitPrice:    product.price,
      quantity:     qty,
      unit:         product.unit || 'KG',
      totalPrice:   total,
      isCustomBuild: false,
    }],
  };
}

// ─── Slug pool ─────────────────────────────────────────────────────────────
/**
 * Returns an array of slugs extracted from a products list.
 * Use in setup() to pre-fetch and share across VUs.
 */
export function extractSlugs(products) {
  return products.filter(p => !!p.slug).map(p => p.slug);
}

/** Pick a random slug from the pre-fetched array. */
export function randomSlug(slugs) {
  return slugs[Math.floor(Math.random() * slugs.length)];
}
