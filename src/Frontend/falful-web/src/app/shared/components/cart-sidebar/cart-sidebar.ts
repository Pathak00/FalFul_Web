import { Component, inject, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CartService } from '../../../core/services/cart.service';

@Component({
  selector: 'app-cart-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="cart-overlay" (click)="close.emit()"></div>
    <div class="cart-drawer">
      <div class="cart-header">
        <h3><i class="bi bi-cart3"></i> Your Cart <span class="item-count">({{ cart.itemCount() }})</span></h3>
        <button class="close-btn" (click)="close.emit()"><i class="bi bi-x-lg"></i></button>
      </div>

      @if (cart.items().length === 0) {
        <div class="cart-empty">
          <i class="bi bi-cart-x"></i>
          <p>Your cart is empty</p>
          <a routerLink="/products" (click)="close.emit()" class="btn-shop">Browse Products</a>
        </div>
      } @else {
        <div class="cart-items">

          <!-- Regular Products section -->
          @if (productEntries().length > 0) {
            <div class="section-header">
              <i class="bi bi-box-seam"></i> Products
            </div>
            @for (entry of productEntries(); track entry.index) {
              <div class="cart-item">
                <div class="item-img">
                  @if (entry.item.imageUrl) {
                    <img [src]="entry.item.imageUrl" [alt]="entry.item.productName" />
                  } @else {
                    <div class="img-placeholder"><i class="bi bi-image"></i></div>
                  }
                </div>
                <div class="item-info">
                  <span class="item-name">{{ entry.item.productName }}</span>
                  <div class="qty-control">
                    <button class="qty-btn" (click)="cart.updateQuantity(entry.index, entry.item.quantity - 1)"
                            title="{{ entry.item.quantity === 1 ? 'Remove item' : 'Decrease' }}">
                      <i class="bi {{ entry.item.quantity === 1 ? 'bi-trash3' : 'bi-dash' }}"></i>
                    </button>
                    <span class="qty-val">{{ entry.item.quantity }}</span>
                    <button class="qty-btn" (click)="cart.updateQuantity(entry.index, entry.item.quantity + 1)">
                      <i class="bi bi-plus"></i>
                    </button>
                    <span class="qty-unit">{{ entry.item.unit }}</span>
                  </div>
                  <span class="item-unit-price">Rs. {{ entry.item.unitPrice | number:'1.0-0' }} each</span>
                </div>
                <div class="item-right">
                  <span class="item-price">Rs. {{ entry.item.totalPrice | number:'1.0-0' }}</span>
                </div>
              </div>
            }
          }

          <!-- Fruit Bowls section -->
          @if (bowlEntries().length > 0) {
            <div class="section-header bowl-section-header">
              <i class="bi bi-scissors"></i> Fruit Bowls
            </div>
            @for (entry of bowlEntries(); track entry.index) {
              <div class="cart-item bowl-item">
                <div class="item-img bowl-img">
                  <i class="bi bi-basket2"></i>
                </div>
                <div class="item-info">
                  <span class="item-name">{{ entry.item.productName }}</span>
                  <span class="bowl-badge"><i class="bi bi-scissors"></i> Custom Build</span>
                  <div class="qty-control">
                    <button class="qty-btn" (click)="cart.updateQuantity(entry.index, entry.item.quantity - 1)"
                            title="{{ entry.item.quantity === 1 ? 'Remove item' : 'Decrease' }}">
                      <i class="bi {{ entry.item.quantity === 1 ? 'bi-trash3' : 'bi-dash' }}"></i>
                    </button>
                    <span class="qty-val">{{ entry.item.quantity }}</span>
                    <button class="qty-btn" (click)="cart.updateQuantity(entry.index, entry.item.quantity + 1)">
                      <i class="bi bi-plus"></i>
                    </button>
                  </div>
                  <span class="item-unit-price">Rs. {{ entry.item.unitPrice | number:'1.0-0' }} each</span>
                </div>
                <div class="item-right">
                  <span class="item-price">Rs. {{ entry.item.totalPrice | number:'1.0-0' }}</span>
                </div>
              </div>
            }
          }

        </div>

        <div class="cart-footer">
          <div class="subtotal-row">
            <span>Subtotal</span>
            <span class="subtotal-val">Rs. {{ cart.subTotal() | number:'1.0-0' }}</span>
          </div>
          <p class="fee-note">Delivery fee & service fee calculated at checkout</p>
          <a routerLink="/checkout" (click)="close.emit()" class="btn-checkout">
            <i class="bi bi-bag-check"></i> Proceed to Checkout
          </a>
          <button class="btn-clear" (click)="cart.clearCart()">
            <i class="bi bi-trash"></i> Clear Cart
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .cart-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,.45);
      z-index: 1000; animation: fadeIn .2s;
    }
    @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }

    .cart-drawer {
      position: fixed; top: 0; right: 0; bottom: 0; width: 380px; max-width: 95vw;
      background: #fff; z-index: 1001; display: flex; flex-direction: column;
      box-shadow: -4px 0 20px rgba(0,0,0,.12);
      animation: slideIn .25s ease;
    }
    @keyframes slideIn { from { transform: translateX(100%) } to { transform: translateX(0) } }

    .cart-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 1rem 1.25rem; border-bottom: 1px solid #e5e7eb;
      h3 { margin: 0; font-size: 1rem; font-weight: 700; color: #111;
        display: flex; align-items: center; gap: .5rem;
        .item-count { color: #6b7280; font-weight: 500; }
      }
      .close-btn {
        background: none; border: none; font-size: 1.1rem; color: #6b7280;
        cursor: pointer; padding: .25rem .5rem; border-radius: 6px;
        &:hover { background: #f3f4f6; color: #111; }
      }
    }

    .cart-empty {
      flex: 1; display: flex; flex-direction: column; align-items: center;
      justify-content: center; gap: 1rem; color: #9ca3af;
      i { font-size: 3rem; }
      p { margin: 0; font-size: .95rem; }
      .btn-shop {
        background: #16a34a; color: #fff; padding: .5rem 1.5rem;
        border-radius: 8px; text-decoration: none; font-size: .85rem; font-weight: 600;
        &:hover { background: #15803d; }
      }
    }

    .cart-items { flex: 1; overflow-y: auto; padding: .75rem 1.25rem; display: flex; flex-direction: column; gap: .625rem; }

    .section-header {
      font-size: .7rem; font-weight: 700; text-transform: uppercase; letter-spacing: .06em;
      color: #94a3b8; display: flex; align-items: center; gap: .35rem;
      padding: .25rem 0 .1rem;
      &.bowl-section-header { color: #7c3aed; margin-top: .25rem; }
    }

    .cart-item {
      display: flex; gap: .75rem; align-items: flex-start;
      padding: .75rem; background: #f9fafb; border-radius: 8px; border: 1px solid #f0f0f0;

      &.bowl-item { background: #faf5ff; border-color: #ede9fe; }

      .item-img {
        width: 52px; height: 52px; flex-shrink: 0; border-radius: 6px; overflow: hidden;
        img { width: 100%; height: 100%; object-fit: cover; }
        .img-placeholder { width: 100%; height: 100%; background: #e5e7eb; display: flex; align-items: center; justify-content: center; color: #9ca3af; }
      }
      .bowl-img {
        background: #ede9fe; display: flex; align-items: center; justify-content: center;
        color: #7c3aed; font-size: 1.4rem; border-radius: 6px;
      }
      .item-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: .25rem;
        .item-name { font-size: .85rem; font-weight: 600; color: #111; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .bowl-badge { font-size: .7rem; color: #7c3aed; background: #f5f3ff; padding: 1px 6px; border-radius: 4px; width: fit-content;
          display: flex; align-items: center; gap: .25rem;
        }
        .item-unit-price { font-size: .72rem; color: #9ca3af; }
      }
      .item-right { display: flex; flex-direction: column; align-items: flex-end; justify-content: center;
        .item-price { font-size: .875rem; font-weight: 700; color: #16a34a; }
      }
      .qty-control {
        display: flex; align-items: center; gap: .25rem;
        .qty-btn {
          width: 24px; height: 24px; border-radius: 6px; border: 1px solid #e5e7eb;
          background: #fff; cursor: pointer; font-size: .65rem; color: #374151;
          display: flex; align-items: center; justify-content: center;
          transition: border-color .15s, color .15s, background .15s;
          &:hover { border-color: #16a34a; color: #16a34a; background: #f0fdf4; }
        }
        .qty-val { font-size: .82rem; font-weight: 700; color: #111; min-width: 20px; text-align: center; }
        .qty-unit { font-size: .72rem; color: #9ca3af; }
      }
    }

    .cart-footer {
      padding: 1rem 1.25rem; border-top: 1px solid #e5e7eb;
      display: flex; flex-direction: column; gap: .625rem;
      .subtotal-row { display: flex; justify-content: space-between; align-items: center;
        font-size: .9rem; color: #374151;
        .subtotal-val { font-weight: 800; font-size: 1rem; color: #111; }
      }
      .fee-note { margin: 0; font-size: .7rem; color: #9ca3af; }
      .btn-checkout {
        background: #16a34a; color: #fff; padding: .75rem 1rem;
        border-radius: 10px; text-decoration: none; font-size: .875rem; font-weight: 700;
        text-align: center; display: flex; align-items: center; justify-content: center; gap: .5rem;
        &:hover { background: #15803d; }
      }
      .btn-clear {
        background: none; border: 1px solid #e5e7eb; color: #9ca3af;
        padding: .5rem; border-radius: 8px; font-size: .75rem; cursor: pointer;
        display: flex; align-items: center; justify-content: center; gap: .4rem;
        &:hover { border-color: #ef4444; color: #ef4444; }
      }
    }
  `]
})
export class CartSidebarComponent {
  readonly close = output<void>();
  readonly cart  = inject(CartService);

  readonly productEntries = computed(() =>
    this.cart.items()
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => item.itemType === 'PRODUCT')
  );

  readonly bowlEntries = computed(() =>
    this.cart.items()
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => item.itemType === 'BUILD_BOWL')
  );
}
