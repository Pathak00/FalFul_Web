import { Component, inject, output, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../../../core/services/cart.service';
import { ImageUrlService } from '../../../core/services/image-url.service';
import { AuthService } from '../../../core/services/auth.service';
import { PopDialogBoxComponent } from '../PopUpConfirmationModel/popDialogBox';

@Component({
  selector: 'app-cart-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, PopDialogBoxComponent],
  templateUrl: './cart-sidebar.html',
  styleUrl: './cart-sidebar.scss'
})
export class CartSidebarComponent {
  readonly close = output<void>();
  readonly cart  = inject(CartService);
  protected imgSvc = inject(ImageUrlService);
  private authSvc  = inject(AuthService);
  private router   = inject(Router);

  readonly showLoginGate = signal(false);

  onCheckoutClick(): void {
    if (this.authSvc.isAuthenticated()) {
      this.close.emit();
      this.router.navigate(['/checkout']);
    } else {
      this.showLoginGate.set(true);
    }
  }

  goToLogin(): void {
    this.close.emit();
    this.router.navigate(['/auth/login'], { queryParams: { returnUrl: '/checkout' } });
  }

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
