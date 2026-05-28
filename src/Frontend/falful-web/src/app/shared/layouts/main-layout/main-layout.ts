import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar';
import { FooterComponent } from '../../components/footer/footer';
import { CartSidebarComponent } from '../../components/cart-sidebar/cart-sidebar';
import { PermissionService } from '../../../core/services/permission.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, FooterComponent, CartSidebarComponent],
  template: `
    <app-navbar (cartOpen)="openCart()" />
    <main class="main-content">
      <router-outlet />
    </main>
    <app-footer />
    @if (cartVisible() && perms.canShop()) {
      <app-cart-sidebar (close)="cartVisible.set(false)" />
    }
  `,
  styles: [`
    .main-content { min-height: calc(100vh - 70px); }
  `]
})
export class MainLayoutComponent {
  readonly perms = inject(PermissionService);
  cartVisible = signal(false);

  openCart(): void {
    if (this.perms.canShop()) this.cartVisible.set(true);
  }
}
