import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  template: `
    <div class="auth-layout">
      <div class="auth-brand">
        <div class="auth-brand-grain" aria-hidden="true"></div>
        <a routerLink="/" class="logo">
          <span class="logo-leaf">🌿</span>
          <span class="logo-text">FalFul</span>
        </a>
        <div class="brand-tagline">
          <p class="brand-overline">Farm to Table · Since 2024</p>
          <h1>Sun-Kissed.<br><em>Grove-Fresh.</em></h1>
          <p class="brand-desc">Hand-picked seasonal fruits from Himalayan farms, delivered within 48 hours of harvest.</p>
        </div>
        <div class="brand-fruits" aria-hidden="true">🍊 🥭 🍎 🍇 🍋 🍓</div>
        <div class="brand-stat-row">
          <div class="brand-stat"><strong>2,400+</strong><span>Happy customers</span></div>
          <div class="brand-stat-div"></div>
          <div class="brand-stat"><strong>48 hr</strong><span>Farm to door</span></div>
          <div class="brand-stat-div"></div>
          <div class="brand-stat"><strong>100%</strong><span>Natural</span></div>
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
