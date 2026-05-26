import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminStats } from '../../../core/models/admin.models';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="admin-page">
      <div class="page-header">
        <div>
          <h1>Dashboard</h1>
          <p class="page-sub">Welcome to the FalFul admin panel. Manage your website content from here.</p>
        </div>
      </div>

      @if (loading()) {
        <p class="loading-text">Loading stats…</p>
      } @else if (stats()) {
        <div class="stats-grid">
          <a routerLink="/admin/users" class="stat-card stat-blue">
            <div class="stat-icon">👥</div>
            <div class="stat-body">
              <div class="stat-value">{{ stats()!.totalUsers }}</div>
              <div class="stat-label">Total Users</div>
              <div class="stat-sub">{{ stats()!.activeUsers }} active</div>
            </div>
          </a>

          <a routerLink="/admin/pages" class="stat-card stat-green">
            <div class="stat-icon">📄</div>
            <div class="stat-body">
              <div class="stat-value">{{ stats()!.totalPages }}</div>
              <div class="stat-label">Pages</div>
              <div class="stat-sub">{{ stats()!.publishedPages }} published</div>
            </div>
          </a>

          <a routerLink="/admin/banners" class="stat-card stat-orange">
            <div class="stat-icon">🖼️</div>
            <div class="stat-body">
              <div class="stat-value">{{ stats()!.totalBanners }}</div>
              <div class="stat-label">Banners</div>
              <div class="stat-sub">{{ stats()!.activeBanners }} active</div>
            </div>
          </a>

          <a routerLink="/admin/sections" class="stat-card stat-purple">
            <div class="stat-icon">🏠</div>
            <div class="stat-body">
              <div class="stat-value">{{ stats()!.visibleSections }}</div>
              <div class="stat-label">Homepage Sections</div>
              <div class="stat-sub">currently visible</div>
            </div>
          </a>
        </div>

        <div class="quick-links">
          <h2>Quick Actions</h2>
          <div class="link-grid">
            <a routerLink="/admin/pages" class="quick-link">
              <span>📄</span>
              <div>
                <strong>Manage Pages</strong>
                <p>Add legal, about, or custom content pages accessible via /pages/[slug]</p>
              </div>
            </a>
            <a routerLink="/admin/banners" class="quick-link">
              <span>🖼️</span>
              <div>
                <strong>Manage Banners</strong>
                <p>Create promotional banners shown on the homepage and product pages</p>
              </div>
            </a>
            <a routerLink="/admin/sections" class="quick-link">
              <span>🏠</span>
              <div>
                <strong>Homepage Sections</strong>
                <p>Edit the text content of each section on the landing page</p>
              </div>
            </a>
            <a routerLink="/admin/users" class="quick-link">
              <span>👥</span>
              <div>
                <strong>Manage Users</strong>
                <p>View, activate, promote, reset passwords, or remove users</p>
              </div>
            </a>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-sub { color: #64748b; margin: .25rem 0 0; font-size: .9rem; }

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

    .stat-icon { font-size: 2rem; }
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
      transition: background .15s;
      &:hover { background: #f8fafc; }
      span { font-size: 1.5rem; flex-shrink: 0; margin-top: 2px; }
      strong { font-size: .9rem; font-weight: 600; display: block; margin-bottom: .25rem; }
      p { font-size: .8rem; color: #64748b; margin: 0; line-height: 1.4; }
    }

    .loading-text { color: #64748b; }
  `]
})
export class AdminDashboardComponent implements OnInit {
  private adminService = inject(AdminService);

  stats = signal<AdminStats | null>(null);
  loading = signal(true);

  ngOnInit() {
    this.adminService.getStats().subscribe({
      next: s => { this.stats.set(s); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }
}
