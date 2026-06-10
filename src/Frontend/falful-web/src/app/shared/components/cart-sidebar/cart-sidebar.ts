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
  styleUrl: './cart-sidebar.scss'
})
export class CartSidebarComponent {
  readonly close = output<void>();
  readonly cart  = inject(CartService);
  protected imgSvc = inject(ImageUrlService);

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
