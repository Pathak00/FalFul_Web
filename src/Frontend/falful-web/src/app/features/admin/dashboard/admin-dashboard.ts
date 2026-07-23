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
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.scss'
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
