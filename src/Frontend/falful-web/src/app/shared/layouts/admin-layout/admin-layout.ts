import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Subscription } from 'rxjs';
import { AdminNavItem } from '../../../core/models/admin.models';
import { AdminService } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastComponent } from '../../components/toast/toast';

interface NavGroup { label: string; items: AdminNavItem[]; }

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ToastComponent],
  template: `
    <div class="admin-shell">
      <!-- Sidebar overlay (mobile) -->
      @if (sidebarOpen()) {
        <div class="sidebar-overlay" (click)="sidebarOpen.set(false)"></div>
      }

      <aside class="admin-sidebar" [class.sidebar-mobile-open]="sidebarOpen()">
        <div class="sidebar-brand">
          <a routerLink="/" class="brand-logo">
            <i class="bi bi-basket2-fill"></i> FalFul
          </a>
          <span class="admin-badge">{{ user()?.role ?? 'Admin' }}</span>
        </div>

        <nav class="sidebar-nav">
          @if (navLoading()) {
            <div class="nav-loading">
              <div class="nav-spinner"></div>
            </div>
          } @else {
            @for (group of navGroups(); track group.label) {
              @if (group.label) {
                <p class="nav-section-label">{{ group.label }}</p>
              }
              @for (item of group.items; track item.id) {
                <a [routerLink]="item.route"
                   [routerLinkActiveOptions]="item.route === '/admin' ? { exact: true } : {}"
                   routerLinkActive="active"
                   class="nav-item"
                   (click)="closeSidebarOnMobile()">
                  <i class="bi {{ item.icon }} nav-icon"></i> {{ item.label }}
                </a>
              }
            }
          }

          <p class="nav-section-label" style="margin-top:auto">Account</p>
          <a routerLink="/" class="nav-item" (click)="closeSidebarOnMobile()">
            <i class="bi bi-globe nav-icon"></i> View Site
          </a>
          <button class="nav-item nav-btn" (click)="logout()">
            <i class="bi bi-box-arrow-right nav-icon"></i> Logout
          </button>
        </nav>
      </aside>

      <div class="admin-main">
        <header class="admin-topbar">
          <button class="sidebar-toggle" (click)="sidebarOpen.set(!sidebarOpen())"
                  [class.is-open]="sidebarOpen()" aria-label="Toggle sidebar">
            <i class="bi" [class.bi-list]="!sidebarOpen()" [class.bi-x-lg]="sidebarOpen()"></i>
          </button>
          <div class="topbar-breadcrumb">FalFul Admin Panel</div>
          <div class="topbar-user">
            <div class="topbar-avatar">{{ initial() }}</div>
            <span class="topbar-name">{{ user()?.fullName }}</span>
          </div>
        </header>
        <main class="admin-content">
          <router-outlet />
        </main>
        <app-toast />
      </div>
    </div>
  `,
  styles: [`
    .admin-shell { display: flex; min-height: 100vh; background: #f8fafc; }

    /* ── Sidebar ─────────────────────────────────────────────────────────── */
    .admin-sidebar {
      width: 220px; min-height: 100vh; background: #0a2218;
      display: flex; flex-direction: column; flex-shrink: 0;
      position: sticky; top: 0; height: 100vh;
      transition: transform .3s cubic-bezier(.4,0,.2,1);
      z-index: 120;
    }

    .sidebar-brand {
      display: flex; align-items: center; justify-content: space-between;
      padding: 1.25rem; border-bottom: 1px solid rgba(255,255,255,.08); flex-shrink: 0;
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

    .nav-loading {
      display: flex; justify-content: center; padding: 1.5rem;
      .nav-spinner {
        width: 20px; height: 20px; border-radius: 50%;
        border: 2px solid rgba(255,255,255,.15); border-top-color: #4ade80;
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
      &.active { background: rgba(34,197,94,.15); color: #4ade80;
        &::before { content: ''; position: absolute; left: 0; top: 50%; transform: translateY(-50%); height: 20px; width: 3px; background: #4ade80; border-radius: 0 2px 2px 0; }
      }
      .nav-icon { font-size: 1rem; flex-shrink: 0; width: 16px; text-align: center; }
    }

    .nav-btn { border-radius: 0; }

    /* ── Main area ───────────────────────────────────────────────────────── */
    .admin-main { flex: 1; display: flex; flex-direction: column; min-width: 0; }

    .admin-topbar {
      height: 52px; background: #fff; border-bottom: 1px solid #e2e8f0;
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 1.5rem; position: sticky; top: 0; z-index: 10;
      gap: .75rem;
      .topbar-breadcrumb { font-size: .8rem; color: #94a3b8; font-weight: 500; flex: 1; }
      .topbar-user { display: flex; align-items: center; gap: .625rem;
        .topbar-name { font-size: .825rem; color: #374151; font-weight: 600; }
      }
    }

    .topbar-avatar {
      width: 30px; height: 30px; border-radius: 50%; background: #dcfce7; color: #16a34a;
      font-size: .8rem; font-weight: 800; display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }

    .sidebar-toggle {
      display: none;
      background: none; border: 1px solid #e2e8f0; color: #374151;
      width: 34px; height: 34px; border-radius: 7px;
      align-items: center; justify-content: center;
      cursor: pointer; font-size: 1rem; transition: all .15s; flex-shrink: 0;
      &:hover { border-color: #16a34a; color: #16a34a; }
      &.is-open { border-color: #16a34a; color: #16a34a; background: #f0fdf4; }
    }

    .admin-content { flex: 1; padding: 1.75rem; overflow-y: auto; }

    /* ── Sidebar overlay (mobile) ────────────────────────────────────────── */
    .sidebar-overlay {
      display: none;
      position: fixed; inset: 0;
      background: rgba(0,0,0,.5);
      z-index: 119;
      backdrop-filter: blur(2px);
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    /* ── Responsive ──────────────────────────────────────────────────────── */
    @media (max-width: 768px) {
      .admin-sidebar {
        position: fixed; left: 0; top: 0;
        transform: translateX(-100%);
        height: 100vh; z-index: 120;
      }
      .admin-sidebar.sidebar-mobile-open {
        transform: translateX(0);
        box-shadow: 4px 0 30px rgba(0,0,0,.3);
      }
      .sidebar-overlay { display: block; }
      .admin-shell { flex-direction: column; }
      .admin-main { width: 100%; }
      .sidebar-toggle { display: flex; }
      .admin-topbar { padding: 0 1rem; }
      .admin-content { padding: 1rem; }
      .topbar-name { display: none; }
    }

    @media (max-width: 480px) {
      .admin-content { padding: .75rem; }
      .topbar-breadcrumb { font-size: .75rem; }
    }
  `]
})
export class AdminLayoutComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private adminService = inject(AdminService);
  private router = inject(Router);

  readonly user = this.authService.currentUser;
  readonly initial = () => this.user()?.fullName?.charAt(0)?.toUpperCase() ?? 'A';
  readonly sidebarOpen = signal(false);
  readonly navItems = signal<AdminNavItem[]>([]);
  readonly navLoading = signal(true);

  private navSub = new Subscription();

  readonly navGroups = computed<NavGroup[]>(() => {
    const groups: NavGroup[] = [];
    const seen = new Map<string, NavGroup>();
    for (const item of this.navItems()) {
      const key = item.groupLabel ?? '';
      if (!seen.has(key)) {
        const g: NavGroup = { label: item.groupLabel ?? '', items: [] };
        seen.set(key, g);
        groups.push(g);
      }
      seen.get(key)!.items.push(item);
    }
    return groups;
  });

  ngOnInit(): void {
    this.loadNav();
    this.navSub = this.adminService.navRefresh$.subscribe(() => this.loadNav());
  }

  ngOnDestroy(): void { this.navSub.unsubscribe(); }

  private loadNav(): void {
    this.adminService.getAdminNav().subscribe({
      next: items => { this.navItems.set(items); this.navLoading.set(false); },
      error: () => this.navLoading.set(false)
    });
  }

  closeSidebarOnMobile(): void {
    if (window.innerWidth <= 768) this.sidebarOpen.set(false);
  }

  logout(): void { this.authService.logout(); }
}
