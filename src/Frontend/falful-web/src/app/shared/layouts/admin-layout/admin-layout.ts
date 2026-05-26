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
            <span>🍎</span> FalFul
          </a>
          <span class="admin-badge">Admin</span>
        </div>

        <nav class="sidebar-nav">
          <p class="nav-section-label">Content</p>
          <a routerLink="/admin/pages" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">📄</span> Pages
          </a>
          <a routerLink="/admin/banners" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">🖼️</span> Banners
          </a>
          <a routerLink="/admin/sections" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">🏠</span> Homepage Sections
          </a>

          <p class="nav-section-label" style="margin-top:1.5rem">General</p>
          <a routerLink="/dashboard" class="nav-item">
            <span class="nav-icon">📊</span> Dashboard
          </a>
          <button class="nav-item nav-btn" (click)="logout()">
            <span class="nav-icon">🚪</span> Logout
          </button>
        </nav>
      </aside>

      <div class="admin-main">
        <header class="admin-topbar">
          <span class="topbar-user">{{ user()?.fullName }}</span>
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
      width: 240px; min-height: 100vh; background: #0a2218;
      display: flex; flex-direction: column; flex-shrink: 0;
      padding: 1.5rem 0;
    }

    .sidebar-brand {
      display: flex; align-items: center; gap: .5rem;
      padding: 0 1.25rem 1.5rem; border-bottom: 1px solid rgba(255,255,255,.08);
      .brand-logo { color: #fff; text-decoration: none; font-weight: 700; font-size: 1.1rem; }
      .admin-badge {
        font-size: .65rem; background: #22c55e; color: #fff;
        padding: 2px 6px; border-radius: 4px; text-transform: uppercase; letter-spacing: .05em;
      }
    }

    .sidebar-nav { padding: 1rem 0; flex: 1; }

    .nav-section-label {
      font-size: .65rem; color: rgba(255,255,255,.35); text-transform: uppercase;
      letter-spacing: .1em; padding: .25rem 1.25rem .5rem; margin: 0;
    }

    .nav-item {
      display: flex; align-items: center; gap: .625rem;
      padding: .625rem 1.25rem; color: rgba(255,255,255,.7);
      text-decoration: none; font-size: .875rem; transition: all .15s;
      border: none; background: none; width: 100%; cursor: pointer; text-align: left;
      &:hover { background: rgba(255,255,255,.06); color: #fff; }
      &.active { background: rgba(34,197,94,.15); color: #4ade80; }
      .nav-icon { font-size: 1rem; }
    }

    .nav-btn { border-radius: 0; }

    .admin-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

    .admin-topbar {
      height: 56px; background: #fff; border-bottom: 1px solid #e2e8f0;
      display: flex; align-items: center; justify-content: flex-end;
      padding: 0 1.5rem;
      .topbar-user { font-size: .875rem; color: #64748b; font-weight: 500; }
    }

    .admin-content { flex: 1; padding: 1.5rem; overflow-y: auto; }
  `]
})
export class AdminLayoutComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  readonly user = this.authService.currentUser;

  logout() {
    this.authService.logout();
  }
}
