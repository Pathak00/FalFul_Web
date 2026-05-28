import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-rider-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="rider-shell">
      <aside class="rider-sidebar">
        <div class="sidebar-brand">
          <a routerLink="/" class="brand-logo">
            <i class="bi bi-basket2-fill"></i> FalFul
          </a>
          <span class="rider-badge">{{ user()?.role }}</span>
        </div>

        <nav class="sidebar-nav">
          <a routerLink="/rider/deliveries" routerLinkActive="active" class="nav-item">
            <i class="bi bi-bicycle nav-icon"></i> My Deliveries
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

      <div class="rider-main">
        <header class="rider-topbar">
          <div class="topbar-breadcrumb">FalFul Rider Portal</div>
          <div class="topbar-user">
            <div class="topbar-avatar">{{ initial() }}</div>
            <span>{{ user()?.fullName }}</span>
          </div>
        </header>
        <main class="rider-content">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styles: [`
    .rider-shell { display: flex; min-height: 100vh; background: #f8fafc; }

    .rider-sidebar {
      width: 200px; min-height: 100vh; background: #1e293b;
      display: flex; flex-direction: column; flex-shrink: 0;
      position: sticky; top: 0; height: 100vh;
    }

    .sidebar-brand {
      display: flex; align-items: center; justify-content: space-between;
      padding: 1.25rem; border-bottom: 1px solid rgba(255,255,255,.08);
      .brand-logo {
        color: #fff; text-decoration: none; font-weight: 800; font-size: 1rem;
        display: flex; align-items: center; gap: .4rem;
        i { color: #60a5fa; font-size: 1.1rem; }
      }
      .rider-badge {
        font-size: .6rem; background: #3b82f6; color: #fff;
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
      &.active { background: rgba(59,130,246,.15); color: #93c5fd;
        &::before { content: ''; position: absolute; left: 0; top: 50%; transform: translateY(-50%); height: 20px; width: 3px; background: #60a5fa; border-radius: 0 2px 2px 0; }
      }
      .nav-icon { font-size: 1rem; flex-shrink: 0; width: 16px; text-align: center; }
    }

    .nav-btn { border-radius: 0; }

    .rider-main { flex: 1; display: flex; flex-direction: column; min-width: 0; }

    .rider-topbar {
      height: 52px; background: #fff; border-bottom: 1px solid #e2e8f0;
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 1.5rem; position: sticky; top: 0; z-index: 10;
      .topbar-breadcrumb { font-size: .8rem; color: #94a3b8; font-weight: 500; }
      .topbar-user { display: flex; align-items: center; gap: .625rem;
        span { font-size: .825rem; color: #374151; font-weight: 600; }
      }
    }

    .topbar-avatar {
      width: 30px; height: 30px; border-radius: 50%; background: #dbeafe; color: #2563eb;
      font-size: .8rem; font-weight: 800; display: flex; align-items: center; justify-content: center;
    }

    .rider-content { flex: 1; padding: 1.75rem; overflow-y: auto; }
  `]
})
export class RiderLayoutComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  readonly user = this.authService.currentUser;
  readonly initial = () => this.user()?.fullName?.charAt(0)?.toUpperCase() ?? 'R';

  logout() { this.authService.logout(); }
}
