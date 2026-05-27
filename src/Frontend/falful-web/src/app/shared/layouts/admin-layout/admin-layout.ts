import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="admin-shell">
      <aside class="admin-sidebar">
        <div class="sidebar-brand">
          <a routerLink="/" class="brand-logo">
            <i class="bi bi-basket2-fill"></i> FalFul
          </a>
          <span class="admin-badge">Admin</span>
        </div>

        <nav class="sidebar-nav">
          <a routerLink="/admin" [routerLinkActiveOptions]="{exact:true}" routerLinkActive="active" class="nav-item">
            <i class="bi bi-speedometer2 nav-icon"></i> Dashboard
          </a>

          <p class="nav-section-label">Content Management</p>
          <a routerLink="/admin/menus" routerLinkActive="active" class="nav-item">
            <i class="bi bi-list-nested nav-icon"></i> Menus
            <span class="nav-hint">Navigation</span>
          </a>
          <a routerLink="/admin/pages" routerLinkActive="active" class="nav-item">
            <i class="bi bi-file-earmark-text nav-icon"></i> Pages
            <span class="nav-hint">Custom pages</span>
          </a>
          <a routerLink="/admin/banners" routerLinkActive="active" class="nav-item">
            <i class="bi bi-image nav-icon"></i> Banners
            <span class="nav-hint">Promotions</span>
          </a>
          <a routerLink="/admin/sections" routerLinkActive="active" class="nav-item">
            <i class="bi bi-layout-text-window-reverse nav-icon"></i> Homepage
            <span class="nav-hint">Section content</span>
          </a>

          <p class="nav-section-label">Product Catalog</p>
          <a routerLink="/admin/categories" routerLinkActive="active" class="nav-item">
            <i class="bi bi-tags nav-icon"></i> Categories
            <span class="nav-hint">Fruit categories</span>
          </a>
          <a routerLink="/admin/products" routerLinkActive="active" class="nav-item">
            <i class="bi bi-box-seam nav-icon"></i> Products
            <span class="nav-hint">Fruit catalog</span>
          </a>

          <p class="nav-section-label">Orders & Pricing</p>
          <a routerLink="/admin/orders" routerLinkActive="active" class="nav-item">
            <i class="bi bi-bag-check nav-icon"></i> Orders
            <span class="nav-hint">All orders</span>
          </a>
          <a routerLink="/admin/price-config" routerLinkActive="active" class="nav-item">
            <i class="bi bi-sliders nav-icon"></i> Price Config
            <span class="nav-hint">Fees & rules</span>
          </a>

          <p class="nav-section-label">User Management</p>
          <a routerLink="/admin/users" routerLinkActive="active" class="nav-item">
            <i class="bi bi-people nav-icon"></i> Users
            <span class="nav-hint">All accounts</span>
          </a>

          <p class="nav-section-label" style="margin-top:auto">Account</p>
          <a routerLink="/dashboard" class="nav-item">
            <i class="bi bi-arrow-left-circle nav-icon"></i> Back to Site
          </a>
          <button class="nav-item nav-btn" (click)="logout()">
            <i class="bi bi-box-arrow-right nav-icon"></i> Logout
          </button>
        </nav>
      </aside>

      <div class="admin-main">
        <header class="admin-topbar">
          <div class="topbar-breadcrumb">FalFul Admin Panel</div>
          <div class="topbar-user">
            <div class="topbar-avatar">{{ initial() }}</div>
            <span>{{ user()?.fullName }}</span>
          </div>
        </header>
        <main class="admin-content">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styles: [`
    .admin-shell { display: flex; min-height: 100vh; background: #f8fafc; }

    .admin-sidebar {
      width: 220px; min-height: 100vh; background: #0a2218;
      display: flex; flex-direction: column; flex-shrink: 0;
      position: sticky; top: 0; height: 100vh;
    }

    .sidebar-brand {
      display: flex; align-items: center; justify-content: space-between;
      padding: 1.25rem; border-bottom: 1px solid rgba(255,255,255,.08);
      .brand-logo {
        color: #fff; text-decoration: none; font-weight: 800; font-size: 1rem;
        display: flex; align-items: center; gap: .4rem;
        i { color: #4ade80; font-size: 1.1rem; }
      }
      .admin-badge {
        font-size: .6rem; background: #22c55e; color: #fff;
        padding: 2px 7px; border-radius: 4px; text-transform: uppercase; letter-spacing: .06em;
      }
    }

    .sidebar-nav {
      padding: .75rem 0; flex: 1; overflow-y: auto; display: flex; flex-direction: column;
    }

    .nav-section-label {
      font-size: .6rem; color: rgba(255,255,255,.3); text-transform: uppercase;
      letter-spacing: .1em; padding: .875rem 1.25rem .3rem; margin: 0;
    }

    .nav-item {
      display: flex; align-items: center; gap: .5rem;
      padding: .5rem 1.25rem; color: rgba(255,255,255,.65);
      text-decoration: none; font-size: .825rem; transition: all .15s;
      border: none; background: none; width: 100%; cursor: pointer; text-align: left;
      position: relative;
      &:hover { background: rgba(255,255,255,.06); color: #fff; }
      &.active { background: rgba(34,197,94,.15); color: #4ade80;
        &::before { content: ''; position: absolute; left: 0; top: 50%; transform: translateY(-50%); height: 20px; width: 3px; background: #4ade80; border-radius: 0 2px 2px 0; }
      }
      .nav-icon { font-size: 1rem; flex-shrink: 0; width: 16px; text-align: center; }
      .nav-hint { margin-left: auto; font-size: .65rem; color: rgba(255,255,255,.25); font-style: italic; }
    }

    .nav-btn { border-radius: 0; }

    .admin-main { flex: 1; display: flex; flex-direction: column; min-width: 0; }

    .admin-topbar {
      height: 52px; background: #fff; border-bottom: 1px solid #e2e8f0;
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 1.5rem; position: sticky; top: 0; z-index: 10;
      .topbar-breadcrumb { font-size: .8rem; color: #94a3b8; font-weight: 500; }
      .topbar-user { display: flex; align-items: center; gap: .625rem;
        span { font-size: .825rem; color: #374151; font-weight: 600; }
      }
    }

    .topbar-avatar {
      width: 30px; height: 30px; border-radius: 50%; background: #dcfce7; color: #16a34a;
      font-size: .8rem; font-weight: 800; display: flex; align-items: center; justify-content: center;
    }

    .admin-content { flex: 1; padding: 1.75rem; overflow-y: auto; }
  `]
})
export class AdminLayoutComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  readonly user = this.authService.currentUser;
  readonly initial = () => this.user()?.fullName?.charAt(0)?.toUpperCase() ?? 'A';

  logout() { this.authService.logout(); }
}
