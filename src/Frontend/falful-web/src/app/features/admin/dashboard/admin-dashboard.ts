import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminStats } from '../../../core/models/admin.models';
import { AuthService } from '../../../core/services/auth.service';
import { PermissionService } from '../../../core/services/permission.service';
import { AdminService } from '../../../core/services/admin.service';
import { AdminNavStore } from '../../../core/stores/admin-nav.store';
import { Perm } from '../../../core/constants/permissions';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="admin-page">
      <div class="page-header">
        <div>
          <h1>Welcome, {{ user()?.fullName }}</h1>
          <p class="page-sub">
            @if (isSystem()) {
              Full admin access — manage everything from here.
            } @else {
              Here are the sections you have access to.
            }
          </p>
        </div>
      </div>

      @if (isSystem()) {
        <!-- Stats grid — only for system-level admins -->
        @if (loading()) {
          <div class="loading-state"><div class="spinner"></div><p>Loading stats…</p></div>
        } @else if (loadError()) {
          <div class="error-state">
            <i class="bi bi-exclamation-circle"></i>
            <p>Could not load dashboard stats. The API may be unavailable.</p>
          </div>
        } @else if (stats()) {
          <div class="stats-grid">
            <a routerLink="/admin/users" class="stat-card stat-blue">
              <div class="stat-icon"><i class="bi bi-people-fill"></i></div>
              <div class="stat-body">
                <div class="stat-value">{{ stats()!.totalUsers }}</div>
                <div class="stat-label">Total Users</div>
                <div class="stat-sub">{{ stats()!.activeUsers }} active</div>
              </div>
            </a>
            <a routerLink="/admin/pages" class="stat-card stat-green">
              <div class="stat-icon"><i class="bi bi-file-earmark-text-fill"></i></div>
              <div class="stat-body">
                <div class="stat-value">{{ stats()!.totalPages }}</div>
                <div class="stat-label">Pages</div>
                <div class="stat-sub">{{ stats()!.publishedPages }} published</div>
              </div>
            </a>
            <a routerLink="/admin/banners" class="stat-card stat-orange">
              <div class="stat-icon"><i class="bi bi-images"></i></div>
              <div class="stat-body">
                <div class="stat-value">{{ stats()!.totalBanners }}</div>
                <div class="stat-label">Banners</div>
                <div class="stat-sub">{{ stats()!.activeBanners }} active</div>
              </div>
            </a>
            <a routerLink="/admin/sections" class="stat-card stat-purple">
              <div class="stat-icon"><i class="bi bi-layout-text-window-reverse"></i></div>
              <div class="stat-body">
                <div class="stat-value">{{ stats()!.visibleSections }}</div>
                <div class="stat-label">Homepage Sections</div>
                <div class="stat-sub">currently visible</div>
              </div>
            </a>
          </div>
        }
      }

      <!-- Quick actions — sourced from the same DB-driven nav store as the sidebar -->
      <div class="quick-links">
        <h2>Quick Actions</h2>
        <div class="link-grid">
          @for (item of navActions(); track item.id) {
            <a [routerLink]="item.route" class="quick-link">
              <i class="bi {{ item.icon ?? 'bi-grid' }} ql-icon"></i>
              <div>
                <strong>{{ item.label }}</strong>
                @if (item.groupLabel) {
                  <p>{{ item.groupLabel }}</p>
                }
              </div>
            </a>
          }
          @empty {
            <p class="text-muted">No sections are currently assigned to your role. Contact your administrator.</p>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-sub { color: #64748b; margin: .25rem 0 0; font-size: .9rem; }

    .loading-state, .error-state {
      display: flex; align-items: center; gap: .75rem; padding: 1rem;
      color: #64748b; font-size: .9rem;
      .spinner { width: 20px; height: 20px; border: 2px solid #e2e8f0; border-top-color: #16a34a; border-radius: 50%; animation: spin .7s linear infinite; }
    }
    .error-state { color: #dc2626; background: #fef2f2; border-radius: 8px; border: 1px solid #fecaca; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .stats-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 1rem; margin-bottom: 2rem;
    }

    .stat-card {
      display: flex; align-items: center; gap: 1rem;
      background: #fff; border-radius: 12px; padding: 1.25rem 1.5rem;
      border: 1px solid #e2e8f0; text-decoration: none; color: inherit;
      transition: transform .15s, box-shadow .15s;
      &:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,.08); }
    }

    .stat-icon { font-size: 2rem; line-height: 1; display: flex; align-items: center; }
    .stat-value { font-size: 1.8rem; font-weight: 800; line-height: 1; }
    .stat-label { font-size: .8rem; font-weight: 600; text-transform: uppercase; letter-spacing: .05em; margin: .25rem 0 .125rem; }
    .stat-sub { font-size: .75rem; color: #64748b; }

    .stat-blue  .stat-value { color: #1d4ed8; }
    .stat-green .stat-value { color: #16a34a; }
    .stat-orange .stat-value { color: #ea580c; }
    .stat-purple .stat-value { color: #7c3aed; }

    .quick-links h2 { font-size: 1rem; font-weight: 700; color: #0f172a; margin: 0 0 1rem; }

    .link-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: .75rem;
    }

    .quick-link {
      display: flex; align-items: flex-start; gap: 1rem;
      background: #fff; border-radius: 10px; padding: 1rem 1.25rem;
      border: 1px solid #e2e8f0; text-decoration: none; color: #0f172a;
      transition: background .15s, border-color .15s;
      &:hover { background: #f0fdf4; border-color: #bbf7d0; }
      .ql-icon { font-size: 1.5rem; flex-shrink: 0; margin-top: 2px; color: #16a34a; }
      strong { font-size: .9rem; font-weight: 600; display: block; margin-bottom: .25rem; }
      p { font-size: .8rem; color: #64748b; margin: 0; line-height: 1.4; }
    }

    .text-muted { color: #94a3b8; font-size: .9rem; }
  `]
})
export class AdminDashboardComponent implements OnInit {
  private adminService  = inject(AdminService);
  private authService   = inject(AuthService);
  private perms         = inject(PermissionService);
  private adminNavStore = inject(AdminNavStore);

  readonly user     = this.authService.currentUser;
  readonly isSystem = computed(() => this.perms.can(Perm.System));

  // DB-driven quick actions: exactly the same items the sidebar shows,
  // minus the dashboard root itself. No hardcoded permission strings here.
  readonly navActions = computed(() =>
    this.adminNavStore.items().filter(item => item.route !== '/admin')
  );

  stats     = signal<AdminStats | null>(null);
  loading   = signal(false);
  loadError = signal(false);

  ngOnInit() {
    if (!this.isSystem()) return;
    this.loading.set(true);
    this.adminService.getStats().subscribe({
      next:  s => { this.stats.set(s); this.loading.set(false); },
      error: () => { this.loadError.set(true); this.loading.set(false); }
    });
  }
}
