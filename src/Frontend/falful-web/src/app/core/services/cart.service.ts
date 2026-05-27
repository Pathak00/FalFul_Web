import { Injectable, signal, computed } from '@angular/core';
import { CartItem } from '../models/order.models';

const CART_KEY = 'falful_cart';

@Injectable({ providedIn: 'root' })
export class CartService {
  private _items = signal<CartItem[]>(this.loadCart());

  readonly items    = this._items.asReadonly();
  readonly itemCount = computed(() => this._items().length);
  readonly subTotal  = computed(() =>
    this._items().reduce((s, i) => s + i.totalPrice, 0)
  );

  addItem(item: CartItem): void {
    const existing = this._items().findIndex(
      i => !i.isCustomBuild && i.productId === item.productId
    );

    if (existing >= 0 && !item.isCustomBuild) {
      this._items.update(list => {
        const updated = [...list];
        updated[existing] = {
          ...updated[existing],
          quantity:   updated[existing].quantity   + item.quantity,
          totalPrice: updated[existing].totalPrice + item.totalPrice,
        };
        return updated;
      });
    } else {
      this._items.update(list => [...list, item]);
    }
    this.persist();
  }

  removeItem(index: number): void {
    this._items.update(list => list.filter((_, i) => i !== index));
    this.persist();
  }

  updateQuantity(index: number, quantity: number): void {
    if (quantity <= 0) { this.removeItem(index); return; }
    this._items.update(list => {
      const updated = [...list];
      const item    = updated[index];
      updated[index] = { ...item, quantity, totalPrice: item.unitPrice * quantity };
      return updated;
    });
    this.persist();
  }

  clearCart(): void {
    this._items.set([]);
    localStorage.removeItem(CART_KEY);
  }

  private persist(): void {
    localStorage.setItem(CART_KEY, JSON.stringify(this._items()));
  }

  private loadCart(): CartItem[] {
    try {
      const raw = localStorage.getItem(CART_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }
}
