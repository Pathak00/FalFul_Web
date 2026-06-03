import { Injectable, signal, computed } from '@angular/core';
import { CartItem } from '../models/order.models';

const CART_KEY = 'falful_cart';

@Injectable({ providedIn: 'root' })
export class CartService {
  private _items = signal<CartItem[]>(this.loadCart());

  readonly items      = this._items.asReadonly();
  readonly itemCount  = computed(() => this._items().length);
  readonly subTotal   = computed(() => this._items().reduce((s, i) => s + i.totalPrice, 0));

  // Incremented on every addItem call — consumers watch it to trigger bounce animations
  readonly lastAdded  = signal(0);

  readonly productItems  = computed(() => this._items().filter(i => i.itemType === 'PRODUCT'));
  readonly bowlItems     = computed(() => this._items().filter(i => i.itemType === 'BUILD_BOWL'));

  addItem(item: CartItem): void {
    if (item.itemType === 'BUILD_BOWL') {
      // Identical bowl signature → increment quantity; different composition → new entry
      const idx = this._items().findIndex(
        i => i.itemType === 'BUILD_BOWL' && i.bowlSignature === item.bowlSignature
      );
      if (idx >= 0) {
        this._items.update(list => {
          const updated = [...list];
          const cur     = updated[idx];
          const newQty  = cur.quantity + item.quantity;
          updated[idx]  = { ...cur, quantity: newQty, totalPrice: cur.unitPrice * newQty };
          return updated;
        });
      } else {
        this._items.update(list => [...list, item]);
      }
    } else {
      // PRODUCT — match by productId only within PRODUCT items
      const idx = this._items().findIndex(
        i => i.itemType === 'PRODUCT' && i.productId === item.productId
      );
      if (idx >= 0) {
        this._items.update(list => {
          const updated = [...list];
          updated[idx]  = {
            ...updated[idx],
            quantity:   updated[idx].quantity   + item.quantity,
            totalPrice: updated[idx].totalPrice + item.totalPrice,
          };
          return updated;
        });
      } else {
        this._items.update(list => [...list, item]);
      }
    }
    this.persist();
    this.lastAdded.update(n => n + 1);
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
      if (!raw) return [];
      const items = JSON.parse(raw) as CartItem[];
      // Migrate legacy items that predate itemType field
      return items.map(item => ({
        ...item,
        itemType: item.itemType ?? (item.isCustomBuild ? 'BUILD_BOWL' : 'PRODUCT'),
      }));
    } catch { return []; }
  }
}
