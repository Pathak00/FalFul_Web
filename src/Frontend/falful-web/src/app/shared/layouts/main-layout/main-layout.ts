import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar';
import { FooterComponent } from '../../components/footer/footer';
import { CartSidebarComponent } from '../../components/cart-sidebar/cart-sidebar';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, FooterComponent, CartSidebarComponent],
  template: `
    <app-navbar (cartOpen)="cartVisible.set(true)" />
    <main class="main-content">
      <router-outlet />
    </main>
    <app-footer />
    @if (cartVisible()) {
      <app-cart-sidebar (close)="cartVisible.set(false)" />
    }
  `,
  styles: [`
    .main-content { min-height: calc(100vh - 70px); }
  `]
})
export class MainLayoutComponent {
  cartVisible = signal(false);
}
