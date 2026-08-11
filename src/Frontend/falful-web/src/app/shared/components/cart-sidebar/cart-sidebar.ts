import { Component, inject, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CartService } from '../../../core/services/cart.service';
import { ImageUrlService } from '../../../core/services/image-url.service';

@Component({
  selector: 'app-cart-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './cart-sidebar.html',
  styleUrls: ['./cart-sidebar.scss'],
})
export class CartSidebarComponent {
  readonly close = output<void>();
  readonly cart = inject(CartService);
  protected imgSvc = inject(ImageUrlService);

  readonly productEntries = computed(() =>
    this.cart
      .items()
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => item.itemType === 'PRODUCT'),
  );

  readonly bowlEntries = computed(() =>
    this.cart
      .items()
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => item.itemType === 'BUILD_BOWL'),
  );

  readonly subscriptionEntries = computed(() => {
    const allItems = this.cart.items();

    // DEBUG LOG: Look at your browser console (F12) when the cart opens
    console.log('[Cart Debug] All Cart Items:', allItems);

    return allItems
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => {
        // Robust check: handling case-insensitive match or fallback
        const type = (item.itemType || '').toString().toUpperCase();
        return type === 'SUBSCRIPTION';
      });
  });
}
