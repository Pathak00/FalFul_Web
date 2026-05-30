import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Subscription, switchMap } from 'rxjs';
import { AdminService } from '../../core/services/admin.service';
import { AuthService } from '../../core/services/auth.service';
import { AdminNavStore } from '../../core/stores/admin-nav.store';

@Component({
  selector: 'app-rider-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="rider-shell">
      @if (sidebarOpen()) {
        <div class="sidebar-overlay" (click)="sidebarOpen.set(false)"></div>
      }

      <aside class="rider-sidebar" [class.sidebar-mobile-open]="sidebarOpen()">
        <div class="sidebar-brand">
          <a routerLink="/" class="brand-logo" (click)="closeSidebar()">
            <i class="bi bi-basket2-fill"></i> FalFul
          </a>
          <span class="rider-badge">{{ user()?.role }}</span>
        </div>

        <nav class="sidebar-nav">
          @if (navLoading()) {
            <div class="nav-loading"><div class="nav-spinner"></div></div>
          } @else {
            @for (item of navItems(); track item.id) {
              <a [routerLink]="item.route" routerLinkActive="active" class="nav-item"
                 (click)="closeSidebar()">
                <i class="bi {{ item.icon }} nav-icon"></i> {{ item.label }}
              </a>
            }
          }

          <p class="nav-section-label" style="margin-top:auto">Account</p>
          <a routerLink="/dashboard" class="nav-item" (click)="closeSidebar()">
            <i class="bi bi-arrow-left-circle nav-icon"></i> Back to Site
          </a>
          <button class="nav-item nav-btn" (click)="logout()">
            <i class="bi bi-box-arrow-right nav-icon"></i> Logout
          </button>
        </nav>
      </aside>

      <div class="rider-main">
        <header class="rider-topbar">
          <div class="topbar-left">
            <button class="sidebar-toggle" (click)="sidebarOpen.set(!sidebarOpen())"
                    [class.is-open]="sidebarOpen()" aria-label="Toggle sidebar">
              <i class="bi" [class.bi-list]="!sidebarOpen()" [class.bi-x-lg]="sidebarOpen()"></i>
            </button>
            <div class="topbar-breadcrumb">FalFul Rider Portal</div>
          </div>
          <div class="topbar-user">
            <div class="topbar-avatar">{{ initial() }}</div>
            <span class="topbar-name">{{ user()?.fullName }}</span>
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
      position: sticky; top: 0; height: 100vh; z-index: 200;
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

    .nav-loading {
      display: flex; justify-content: center; padding: 1.5rem;
      .nav-spinner {
        width: 20px; height: 20px; border-radius: 50%;
        border: 2px solid rgba(255,255,255,.15); border-top-color: #60a5fa;
        animation: spin .7s linear infinite;
      }
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
        .topbar-name { font-size: .825rem; color: #374151; font-weight: 600; }
      }
    }

    .topbar-left { display: flex; align-items: center; gap: .75rem; }

    .topbar-avatar {
      width: 30px; height: 30px; border-radius: 50%; background: #dbeafe; color: #2563eb;
      font-size: .8rem; font-weight: 800; display: flex; align-items: center; justify-content: center;
    }

    .sidebar-toggle {
      display: none; align-items: center; justify-content: center;
      width: 36px; height: 36px; border-radius: 8px; background: #f1f5f9;
      border: 1px solid #e2e8f0; color: #475569; font-size: 1.1rem;
      cursor: pointer; transition: background .15s; flex-shrink: 0;
      &:hover { background: #e2e8f0; }
    }

    .sidebar-overlay {
      display: none; position: fixed; inset: 0; background: rgba(0,0,0,.4);
      z-index: 199; backdrop-filter: blur(2px);
    }

    .rider-content { flex: 1; padding: 1.75rem; overflow-y: auto; }

    @keyframes spin { to { transform: rotate(360deg); } }

    @media (max-width: 768px) {
      .rider-sidebar {
        position: fixed; left: 0; top: 0; height: 100vh;
        transform: translateX(-100%); transition: transform .25s ease;
      }
      .rider-sidebar.sidebar-mobile-open { transform: translateX(0); }
      .sidebar-overlay { display: block; }
      .sidebar-toggle { display: flex; }
      .rider-content { padding: 1rem; }
      .topbar-name { display: none; }
    }

    @media (max-width: 480px) {
      .rider-content { padding: .75rem; }
      .rider-topbar { padding: 0 .875rem; }
    }
  `]
})
export class RiderLayoutComponent implements OnInit, OnDestroy {
  private authService  = inject(AuthService);
  private adminService = inject(AdminService);
  private navStore     = inject(AdminNavStore);

  readonly user    = this.authService.currentUser;
  readonly initial = () => this.user()?.fullName?.charAt(0)?.toUpperCase() ?? 'R';
  sidebarOpen = signal(false);
  navLoading  = signal(true);

  // Remap admin routes to rider equivalents from the shared store.
  readonly navItems = computed(() =>
    this.navStore.items()
      .filter(i => i.route !== '/admin')
      .map(i => ({ ...i, route: i.route.replace(/^\/admin\//, '/rider/') }))
  );

  private navSub = new Subscription();

  ngOnInit(): void {
    if (this.navStore.loaded()) {
      this.navLoading.set(false);
    } else {
      this.loadNav();
    }

    this.navSub = this.adminService.navRefresh$
      .pipe(switchMap(() => this.authService.refreshToken()))
      .subscribe({ next: () => this.reloadNav(), error: () => this.reloadNav() });
  }

  ngOnDestroy(): void { this.navSub.unsubscribe(); }

  private loadNav(): void {
    this.navStore.load().subscribe({
      next: () => this.navLoading.set(false),
      error: () => this.navLoading.set(false)
    });
  }

  private reloadNav(): void {
    this.navLoading.set(true);
    this.navStore.load().subscribe({
      next: () => this.navLoading.set(false),
      error: () => this.navLoading.set(false)
    });
  }

  closeSidebar() { this.sidebarOpen.set(false); }
  logout() { this.authService.logout(); }
}
