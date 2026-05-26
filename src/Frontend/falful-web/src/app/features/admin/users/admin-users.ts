import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminUser } from '../../../core/models/admin.models';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [FormsModule, DatePipe],
  styleUrl: '../admin-shared.scss',
  template: `
    <div class="admin-page">
      <div class="page-header">
        <div>
          <h1>Users</h1>
          <p class="page-sub">View and manage all registered users. You can activate/deactivate accounts, change roles, reset passwords, or remove users.</p>
        </div>
      </div>

      <!-- Filter bar -->
      <div class="filter-bar">
        <button class="filter-btn" [class.active]="filter() === 'all'" (click)="filter.set('all')">All ({{ users().length }})</button>
        <button class="filter-btn" [class.active]="filter() === 'Admin'" (click)="filter.set('Admin')">Admins</button>
        <button class="filter-btn" [class.active]="filter() === 'Organization'" (click)="filter.set('Organization')">Organizations</button>
        <button class="filter-btn" [class.active]="filter() === 'Individual'" (click)="filter.set('Individual')">Individuals</button>
        <button class="filter-btn" [class.active]="filter() === 'inactive'" (click)="filter.set('inactive')">Inactive</button>
      </div>

      @if (loading()) {
        <div class="empty-state">
          <div class="spinner"></div>
          <p>Loading users…</p>
        </div>
      } @else if (filtered().length === 0) {
        <div class="empty-state">
          <i class="bi bi-people empty-icon"></i>
          <h3>No users found</h3>
          <p>Try a different filter.</p>
        </div>
      } @else {
        <div class="data-table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Contact</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Last Login</th>
                <th style="text-align:right">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (u of filtered(); track u.id) {
                <tr [class.row-inactive]="!u.isActive">
                  <td>
                    <div class="user-avatar-row">
                      <div class="user-avatar">{{ u.fullName.charAt(0).toUpperCase() }}</div>
                      <div>
                        <strong>{{ u.fullName }}</strong>
                        <div class="text-muted text-sm">#{{ u.id }}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    @if (u.email) { <div>{{ u.email }}</div> }
                    @if (u.phoneNumber) { <div class="text-muted text-sm">{{ u.phoneNumber }}</div> }
                  </td>
                  <td>
                    <select class="inline-select" [value]="u.userType" (change)="changeType(u, +$any($event.target).value)">
                      <option value="1">Individual</option>
                      <option value="2">Organization</option>
                      <option value="3">Admin</option>
                    </select>
                  </td>
                  <td>
                    <span class="badge" [class.badge-green]="u.isActive" [class.badge-gray]="!u.isActive">
                      {{ u.isActive ? 'Active' : 'Inactive' }}
                    </span>
                  </td>
                  <td class="text-muted text-sm">{{ u.createdAt | date:'d MMM y' }}</td>
                  <td class="text-muted text-sm">{{ u.lastLoginAt ? (u.lastLoginAt | date:'d MMM y') : '—' }}</td>
                  <td class="actions">
                    <button class="btn-sm btn-edit" (click)="openReset(u)" title="Reset password"><i class="bi bi-key"></i> Reset</button>
                    <button class="btn-sm" [class.btn-warn]="u.isActive" [class.btn-success]="!u.isActive"
                            (click)="toggleActive(u)" [title]="u.isActive ? 'Deactivate account' : 'Activate account'">
                      {{ u.isActive ? 'Deactivate' : 'Activate' }}
                    </button>
                    <button class="btn-sm btn-danger" (click)="deleteTarget.set(u)" title="Delete user">Delete</button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>

    <!-- Reset Password Modal -->
    @if (resetTarget()) {
      <div class="modal-overlay" (click)="resetTarget.set(null)">
        <div class="modal modal-sm" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div>
              <h2>Reset Password</h2>
              <p class="modal-sub">Set a new password for <strong>{{ resetTarget()!.fullName }}</strong>.</p>
            </div>
            <button class="btn-close" (click)="resetTarget.set(null)">✕</button>
          </div>

          <div class="form-group">
            <label>New Password <span class="required">*</span></label>
            <input type="password" [(ngModel)]="newPassword" placeholder="Minimum 6 characters" />
            <span class="field-hint">The user will need to use this password to log in next time.</span>
          </div>

          @if (resetError()) { <div class="form-error-box"><i class="bi bi-exclamation-triangle"></i> {{ resetError() }}</div> }

          <div class="modal-actions">
            <button class="btn-secondary" (click)="resetTarget.set(null)">Cancel</button>
            <button class="btn-primary" (click)="confirmReset()" [disabled]="resetting()">
              {{ resetting() ? 'Updating…' : 'Set New Password' }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Delete Confirm Modal -->
    @if (deleteTarget()) {
      <div class="modal-overlay" (click)="deleteTarget.set(null)">
        <div class="modal modal-sm" (click)="$event.stopPropagation()">
          <div class="confirm-icon"><i class="bi bi-person-x"></i></div>
          <h2>Delete User?</h2>
          <p>Permanently remove <strong>{{ deleteTarget()!.fullName }}</strong>? This cannot be undone.</p>
          <div class="modal-actions">
            <button class="btn-secondary" (click)="deleteTarget.set(null)">Cancel</button>
            <button class="btn-danger-solid" (click)="confirmDelete()">Yes, Delete</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .page-sub { color: #64748b; margin: .25rem 0 0; font-size: .875rem; }

    .filter-bar {
      display: flex; gap: .5rem; margin-bottom: 1.25rem; flex-wrap: wrap;
    }

    .filter-btn {
      padding: .375rem .875rem; border-radius: 20px; border: 1px solid #e2e8f0;
      background: #fff; font-size: .8rem; font-weight: 500; color: #475569; cursor: pointer;
      transition: all .15s;
      &:hover { border-color: #16a34a; color: #16a34a; }
      &.active { background: #16a34a; border-color: #16a34a; color: #fff; }
    }

    .user-avatar-row { display: flex; align-items: center; gap: .625rem; }

    .user-avatar {
      width: 32px; height: 32px; border-radius: 50%; background: #dcfce7; color: #16a34a;
      font-size: .875rem; font-weight: 700; display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }

    .row-inactive { opacity: .65; }

    .inline-select {
      border: 1px solid #e2e8f0; border-radius: 5px; padding: .25rem .5rem;
      font-size: .8rem; background: #fff; color: #334155; cursor: pointer;
    }

    .btn-warn    { background: #fff7ed; color: #ea580c; &:hover { background: #ffedd5; } }
    .btn-success { background: #f0fdf4; color: #16a34a; &:hover { background: #dcfce7; } }
  `]
})
export class AdminUsersComponent implements OnInit {
  private adminService = inject(AdminService);

  users = signal<AdminUser[]>([]);
  loading = signal(true);
  filter = signal<string>('all');

  resetTarget = signal<AdminUser | null>(null);
  newPassword = '';
  resetError = signal('');
  resetting = signal(false);

  deleteTarget = signal<AdminUser | null>(null);

  filtered = () => {
    const f = this.filter();
    const all = this.users();
    if (f === 'all') return all;
    if (f === 'inactive') return all.filter(u => !u.isActive);
    return all.filter(u => u.userType === f);
  };

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.adminService.getUsers().subscribe({ next: u => { this.users.set(u); this.loading.set(false); }, error: () => this.loading.set(false) });
  }

  changeType(u: AdminUser, typeValue: number) {
    const typeName = typeValue === 3 ? 'Admin' : typeValue === 2 ? 'Organization' : 'Individual';
    if (!confirm(`Change ${u.fullName}'s role to ${typeName}?`)) { this.load(); return; }
    this.adminService.setUserType({ userId: u.id, userType: typeValue }).subscribe({
      next: () => { u.userType = typeName; },
      error: () => this.load()
    });
  }

  toggleActive(u: AdminUser) {
    const action = u.isActive ? 'deactivate' : 'activate';
    if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} ${u.fullName}'s account?`)) return;
    this.adminService.setUserActive({ userId: u.id, isActive: !u.isActive }).subscribe({
      next: () => { u.isActive = !u.isActive; },
      error: () => {}
    });
  }

  openReset(u: AdminUser) {
    this.resetTarget.set(u);
    this.newPassword = '';
    this.resetError.set('');
  }

  confirmReset() {
    if (this.newPassword.length < 6) { this.resetError.set('Password must be at least 6 characters.'); return; }
    this.resetting.set(true);
    this.adminService.resetPassword({ userId: this.resetTarget()!.id, newPassword: this.newPassword }).subscribe({
      next: () => { this.resetting.set(false); this.resetTarget.set(null); },
      error: (e: any) => { this.resetting.set(false); this.resetError.set(e.error?.message ?? 'Failed to reset password.'); }
    });
  }

  confirmDelete() {
    if (!this.deleteTarget()) return;
    this.adminService.deleteUser(this.deleteTarget()!.id).subscribe({
      next: () => { this.deleteTarget.set(null); this.load(); }
    });
  }
}
