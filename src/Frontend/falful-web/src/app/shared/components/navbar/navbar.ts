import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="navbar">
      <div class="navbar-brand">
        <a routerLink="/" class="logo">
          <span class="logo-icon">🍎</span>
          <span class="logo-text">FalFul</span>
        </a>
      </div>

      <ul class="nav-links">
        <li><a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">Home</a></li>
        <li><a routerLink="/products" routerLinkActive="active">Products</a></li>
        @if (isAuthenticated()) {
          <li><a routerLink="/dashboard" routerLinkActive="active">Dashboard</a></li>
        }
      </ul>

      <div class="nav-actions">
        @if (isAuthenticated()) {
          <span class="user-greeting">Hello, {{ user()?.fullName }}</span>
          <button class="btn-logout" (click)="logout()">Logout</button>
        } @else {
          <a routerLink="/auth/login" class="btn-login">Login</a>
          <a routerLink="/auth/register" class="btn-register">Get Started</a>
        }
      </div>
    </nav>
  `,
  styleUrl: './navbar.scss'
})
export class NavbarComponent {
  private authService = inject(AuthService);
  readonly isAuthenticated = this.authService.isAuthenticated;
  readonly user = this.authService.currentUser;

  logout() {
    this.authService.logout();
  }
}
