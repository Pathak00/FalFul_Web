import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  template: `
    <div class="auth-layout">
      <div class="auth-brand">
        <a routerLink="/" class="logo">
          <span>🍎</span>
          <span class="logo-text">FalFul</span>
        </a>
        <div class="brand-tagline">
          <h1>Fresh Fruits,<br>Fast Delivery</h1>
          <p>Order premium fruits online and get them delivered fresh to your door.</p>
        </div>
      </div>
      <div class="auth-content">
        <router-outlet />
      </div>
    </div>
  `,
  styleUrl: './auth-layout.scss'
})
export class AuthLayoutComponent {}
