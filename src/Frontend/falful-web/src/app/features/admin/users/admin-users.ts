import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminUser } from '../../../core/models/admin.models';
import { AdminService } from '../../../core/services/admin.service';

interface RoleOption { id: number; name: string; description?: string; isDefault?: boolean; }
interface PermOption  { id: number; name: string; displayName: string; category: string; }

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [FormsModule, DatePipe, RouterLink],
  styleUrl: '../admin-shared.scss',
  template: `
    <div class="admin-page">
      <div class="page-header">
        <div>
          <h1>Users</h1>
          <p class="page-sub">View and manage all registered users. You can activate/deactivate accounts, change roles, reset passwords, or remove users.</p>
        </div>
        <button class="btn-primary" (click)="openCreate()">
          <i class="bi bi-person-plus"></i> Add User
        </button>
      </div>

      <!-- Filter bar — roles come from DB, fully dynamic -->
      <div class="filter-bar">
        <button class="filter-btn" [class.active]="filter() === 'all'" (click)="filter.set('all')">All ({{ users().length }})</button>
        @for (role of roles(); track role.id) {
          <button class="filter-btn" [class.active]="filter() === role.name" (click)="filter.set(role.name)">
            {{ role.name }}
          </button>
        }
        <button class="filter-btn" [class.active]="filter() === 'inactive'" (click)="filter.set('inactive')">Inactive</button>
        <button class="filter-btn" [class.active]="filter() === 'norole'" (click)="filter.set('norole')">No Role</button>
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
        <div class="users-table-scroll">
          <table class="data-table users-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Contact</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th class="hide-md">Last Login</th>
                <th class="actions-th">Actions</th>
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
                  <td class="contact-cell">
                    @if (u.email) { <div class="contact-line">{{ u.email }}</div> }
                    @if (u.phoneNumber) { <div class="text-muted text-sm">{{ u.phoneNumber }}</div> }
                  </td>
                  <td>
                    <div class="role-cell">
                      @if (u.roleName) {
                        <span class="badge badge-role">{{ u.roleName }}</span>
                      } @else {
                        <span class="text-muted text-sm">—</span>
                      }
                      <span class="portal-tag"
                            [class.portal-rider]="u.portalType === 'rider'"
                            [class.portal-admin]="u.portalType === 'admin'"
                            [class.portal-customer]="u.portalType === 'customer'">
                        {{ u.portalType === 'rider' ? 'Rider Portal' : u.portalType === 'admin' ? 'Admin Panel' : 'Customer' }}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span class="badge" [class.badge-green]="u.isActive" [class.badge-gray]="!u.isActive">
                      {{ u.isActive ? 'Active' : 'Inactive' }}
                    </span>
                  </td>
                  <td class="text-muted text-sm">{{ u.createdAt | date:'d MMM y' }}</td>
                  <td class="text-muted text-sm hide-md">{{ u.lastLoginAt ? (u.lastLoginAt | date:'d MMM y') : '—' }}</td>
                  <td class="user-actions">
                    <button class="ua-btn ua-btn-edit" (click)="openRole(u)" title="Manage role &amp; permissions">
                      <i class="bi bi-shield-check"></i><span class="btn-label"> Role</span>
                    </button>
                    <button class="ua-btn ua-btn-edit" (click)="openReset(u)" title="Reset password">
                      <i class="bi bi-key"></i><span class="btn-label"> Reset</span>
                    </button>
                    <button class="ua-btn" [class.ua-btn-warn]="u.isActive" [class.ua-btn-success]="!u.isActive"
                            (click)="toggleActive(u)" [title]="u.isActive ? 'Deactivate' : 'Activate'">
                      <i class="bi" [class.bi-pause-circle]="u.isActive" [class.bi-play-circle]="!u.isActive"></i>
                      <span class="btn-label">{{ u.isActive ? ' Deactivate' : ' Activate' }}</span>
                    </button>
                    <button class="ua-btn ua-btn-danger" (click)="deleteTarget.set(u)" title="Delete user">
                      <i class="bi bi-trash"></i><span class="btn-label"> Delete</span>
                    </button>
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

    <!-- Role Management Modal -->
    @if (roleTarget()) {
      <div class="modal-overlay" (click)="roleTarget.set(null)">
        <div class="modal modal-sm" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div>
              <h2>Manage Role</h2>
              <p class="modal-sub">Set the system role for <strong>{{ roleTarget()!.fullName }}</strong>.</p>
            </div>
            <button class="btn-close" (click)="roleTarget.set(null)">✕</button>
          </div>

          @if (roleLoading()) {
            <div style="padding:1rem;text-align:center"><div class="spinner"></div></div>
          } @else {
            <div class="form-group">
              <label>Role</label>
              <select class="inline-select" style="width:100%;padding:.5rem" [(ngModel)]="selectedRoleId">
                @for (r of roles(); track r.id) {
                  <option [value]="r.id">{{ r.name }}{{ r.description ? ' — ' + r.description : '' }}</option>
                }
              </select>
            </div>

            <div class="portal-indicator"
                 [class.portal-indicator-rider]="roleTarget()?.portalType === 'rider'"
                 [class.portal-indicator-admin]="roleTarget()?.portalType === 'admin'">
              <i class="bi" [class.bi-bicycle]="roleTarget()?.portalType === 'rider'"
                            [class.bi-speedometer2]="roleTarget()?.portalType === 'admin'"
                            [class.bi-person]="roleTarget()?.portalType === 'customer'"></i>
              <span>
                @if (roleTarget()?.portalType === 'rider') {
                  Currently routes to <strong>Rider Portal</strong> — only has <em>deliveries</em> permission.
                } @else if (roleTarget()?.portalType === 'admin') {
                  Currently routes to <strong>Admin Panel</strong>.
                } @else {
                  No permissions assigned — will access the customer site.
                }
              </span>
            </div>

            @if (roleError()) { <div class="form-error-box"><i class="bi bi-exclamation-triangle"></i> {{ roleError() }}</div> }

            <div class="modal-actions">
              <button class="btn-secondary" (click)="openPermissions()"><i class="bi bi-key"></i> Permissions</button>
              <button class="btn-secondary" (click)="roleTarget.set(null)">Cancel</button>
              <button class="btn-primary" (click)="saveRole()" [disabled]="roleSaving()">
                {{ roleSaving() ? 'Saving…' : 'Save Role' }}
              </button>
            </div>
          }
        </div>
      </div>
    }

    <!-- Permissions Modal -->
    @if (permTarget()) {
      <div class="modal-overlay" (click)="permTarget.set(null)">
        <div class="modal modal-md" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div>
              <h2>Permissions</h2>
              <p class="modal-sub">Override individual permissions for <strong>{{ permTarget()!.fullName }}</strong>. Routing: <em>deliveries only → Rider Portal, any other permission → Admin Panel</em>.</p>
            </div>
            <button class="btn-close" (click)="permTarget.set(null)">✕</button>
          </div>

          @if (permLoading()) {
            <div style="padding:1rem;text-align:center"><div class="spinner"></div></div>
          } @else {
            <div class="perm-groups">
              @for (cat of permCategories(); track cat) {
                <div class="perm-group">
                  <p class="perm-cat">{{ cat }}</p>
                  @for (p of permsByCategory(cat); track p.id) {
                    <label class="perm-row">
                      <input type="checkbox" [checked]="selectedPerms().includes(p.name)"
                             (change)="togglePerm(p.name, $any($event.target).checked)" />
                      <span>{{ p.displayName }}</span>
                    </label>
                  }
                </div>
              }
            </div>

            @if (permError()) { <div class="form-error-box"><i class="bi bi-exclamation-triangle"></i> {{ permError() }}</div> }

            <div class="modal-actions">
              <button class="btn-secondary" (click)="permTarget.set(null)">Cancel</button>
              <button class="btn-primary" (click)="savePermissions()" [disabled]="permSaving()">
                {{ permSaving() ? 'Saving…' : 'Save Permissions' }}
              </button>
            </div>
          }
        </div>
      </div>
    }

    <!-- Create User Modal -->
    @if (showCreate()) {
      <div class="modal-overlay" (click)="closeCreate()">
        <div class="modal modal-lg" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div>
              <h2>Add New User</h2>
              <p class="modal-sub">Create an account for a user of any type. They can log in with the password you set.</p>
            </div>
            <button class="btn-close" (click)="closeCreate()"><i class="bi bi-x-lg"></i></button>
          </div>

          <div class="form-section">
            <div class="form-group">
              <label>Full Name <span class="required">*</span></label>
              <input [(ngModel)]="createForm.fullName" placeholder="e.g. Rupak Pathak" />
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Email Address</label>
                <input type="email" [(ngModel)]="createForm.email" placeholder="user@example.com" />
                <span class="field-hint">Required if no phone number is provided.</span>
              </div>
              <div class="form-group">
                <label>Phone Number</label>
                <input [(ngModel)]="createForm.phoneNumber" placeholder="+977 98XXXXXXXX" />
                <span class="field-hint">Required if no email is provided.</span>
              </div>
            </div>
          </div>

          <div class="form-section">
            <div class="form-group">
              <label>Role <span class="required">*</span></label>
              <div class="role-options">
                @for (r of roles(); track r.id) {
                  <label class="type-option" [class.selected]="createForm.roleId === r.id"
                         (click)="createForm.roleId = r.id">
                    <div class="type-radio"></div>
                    <div>
                      <strong>{{ r.name }}</strong>
                      @if (r.isDefault) { <span class="default-tag">default</span> }
                      @if (r.description) { <span>{{ r.description }}</span> }
                    </div>
                  </label>
                }
                @empty {
                  <p class="text-muted text-sm">No roles found. Create roles in <a routerLink="/admin/roles">Roles & Permissions</a> first.</p>
                }
              </div>
              <span class="field-hint">The user receives the permissions assigned to this role.</span>
            </div>
          </div>

          <div class="form-section">
            <div class="form-group">
              <label>Password <span class="required">*</span></label>
              <input type="password" [(ngModel)]="createForm.password" placeholder="Minimum 6 characters" />
              <span class="field-hint">The user will use this password to log in. You can reset it later if needed.</span>
            </div>
          </div>

          @if (createError()) { <div class="form-error-box"><i class="bi bi-exclamation-triangle"></i> {{ createError() }}</div> }

          <div class="modal-actions">
            <button class="btn-secondary" (click)="closeCreate()">Cancel</button>
            <button class="btn-primary" (click)="submitCreate()" [disabled]="creating()">
              {{ creating() ? 'Creating…' : 'Create User' }}
            </button>
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

    /* Scrollable table wrapper */
    .users-table-scroll {
      background: #fff; border-radius: 12px; border: 1px solid #e2e8f0;
      overflow-x: auto; -webkit-overflow-scrolling: touch;
    }
    .users-table { min-width: 680px; }

    .user-avatar-row { display: flex; align-items: center; gap: .625rem; }
    .user-avatar {
      width: 32px; height: 32px; border-radius: 50%; background: #dcfce7; color: #16a34a;
      font-size: .875rem; font-weight: 700; display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }

    .contact-cell { max-width: 180px; }
    .contact-line { font-size: .8rem; color: #374151; word-break: break-all; }

    .row-inactive { opacity: .65; }

    /* Hide lower-priority columns on smaller viewports */
    @media (max-width: 800px) { .hide-md { display: none !important; } }

    .inline-select {
      border: 1px solid #e2e8f0; border-radius: 5px; padding: .25rem .5rem;
      font-size: .8rem; background: #fff; color: #334155; cursor: pointer; width: 100%;
    }

    /* Action buttons for users table */
    .actions-th { text-align: right; white-space: nowrap; }
    .user-actions {
      display: flex; flex-wrap: wrap; gap: .3rem; justify-content: flex-end; align-items: center;
      padding: .375rem .75rem;
    }
    .ua-btn {
      display: inline-flex; align-items: center; gap: .2rem;
      padding: .25rem .55rem; border-radius: 5px; font-size: .72rem; font-weight: 600;
      border: 1px solid transparent; cursor: pointer; white-space: nowrap;
      transition: all .12s; line-height: 1.4;
    }
    .ua-btn-edit    { background: #eff6ff; color: #1d4ed8; border-color: #dbeafe; &:hover { background: #dbeafe; } }
    .ua-btn-warn    { background: #fff7ed; color: #ea580c; border-color: #fed7aa; &:hover { background: #ffedd5; } }
    .ua-btn-success { background: #f0fdf4; color: #16a34a; border-color: #bbf7d0; &:hover { background: #dcfce7; } }
    .ua-btn-danger  { background: #fef2f2; color: #dc2626; border-color: #fecaca; &:hover { background: #fee2e2; } }

    /* Hide text labels on very small viewports, keep icons */
    @media (max-width: 640px) { .btn-label { display: none; } }

    .btn-primary { display: inline-flex; align-items: center; gap: .35rem; }
    .badge-role {
      background: #f1f5f9; color: #475569; font-size: .7rem; padding: 2px 8px;
      border-radius: 4px; font-weight: 600;
    }

    .role-cell { display: flex; flex-direction: column; gap: .25rem; }

    .portal-tag {
      display: inline-block; font-size: .65rem; font-weight: 600;
      padding: 1px 7px; border-radius: 4px; letter-spacing: .03em;
    }
    .portal-rider    { background: #dbeafe; color: #1d4ed8; }
    .portal-admin    { background: #dcfce7; color: #15803d; }
    .portal-customer { background: #f1f5f9; color: #64748b; }

    .portal-indicator {
      display: flex; align-items: flex-start; gap: .5rem;
      font-size: .8rem; color: #374151;
      background: #f8fafc; border: 1px solid #e2e8f0;
      border-radius: 7px; padding: .5rem .75rem; margin: .5rem 0;
      i { flex-shrink: 0; margin-top: .1rem; }
    }
    .portal-indicator-rider { background: #eff6ff; border-color: #bfdbfe; color: #1e40af; }
    .portal-indicator-admin { background: #f0fdf4; border-color: #bbf7d0; color: #15803d; }

    .perm-groups { display: flex; flex-direction: column; gap: 1rem; padding: .25rem 0; }
    .perm-group  { }
    .perm-cat    { font-size: .65rem; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: #94a3b8; margin: 0 0 .375rem; }
    .perm-row    { display: flex; align-items: center; gap: .5rem; padding: .25rem 0; cursor: pointer; font-size: .875rem; color: #374151; }

    .modal-md { max-width: 480px; }

    .role-options { display: flex; flex-direction: column; gap: .5rem; }
    .default-tag { font-size: .65rem; background: #dcfce7; color: #16a34a; padding: 1px 6px; border-radius: 3px; font-weight: 600; margin-left: .35rem; }

    .type-option {
      display: flex; align-items: flex-start; gap: .75rem;
      padding: .75rem 1rem; border-radius: 8px; border: 1.5px solid #e2e8f0;
      cursor: pointer; transition: border-color .15s, background .15s;
      &.selected { border-color: #16a34a; background: #f0fdf4;
        .type-radio { border-color: #16a34a; background: #16a34a; box-shadow: inset 0 0 0 3px #fff; }
      }
      &:hover:not(.selected) { border-color: #94a3b8; }
      .type-radio {
        width: 16px; height: 16px; border-radius: 50%; border: 2px solid #d1d5db;
        flex-shrink: 0; margin-top: 2px; transition: all .15s;
      }
      strong { display: block; font-size: .875rem; font-weight: 600; color: #0f172a; }
      span { font-size: .775rem; color: #64748b; }
    }
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

  /* Role management */
  roles = signal<RoleOption[]>([]);
  roleTarget  = signal<AdminUser | null>(null);
  selectedRoleId = 0;
  roleLoading = signal(false);
  roleSaving  = signal(false);
  roleError   = signal('');

  openRole(u: AdminUser) {
    this.roleTarget.set(u);
    this.roleError.set('');
    this.roleLoading.set(true);
    this.adminService.getUserRole(u.id).subscribe({
      next: role => { this.selectedRoleId = role.id; this.roleLoading.set(false); },
      error: () => { this.selectedRoleId = this.roles()[0]?.id ?? 0; this.roleLoading.set(false); }
    });
  }

  saveRole() {
    this.roleSaving.set(true);
    this.adminService.assignRole(this.roleTarget()!.id, +this.selectedRoleId).subscribe({
      next: () => { this.roleSaving.set(false); this.roleTarget.set(null); this.load(); },
      error: (e: any) => { this.roleSaving.set(false); this.roleError.set(e.error?.message ?? 'Failed to save role.'); }
    });
  }

  /* Permissions management */
  allPermissions = signal<PermOption[]>([]);
  permTarget  = signal<AdminUser | null>(null);
  selectedPerms = signal<string[]>([]);
  permLoading = signal(false);
  permSaving  = signal(false);
  permError   = signal('');
  permCategories = () => [...new Set(this.allPermissions().map(p => p.category))];
  permsByCategory = (cat: string) => this.allPermissions().filter(p => p.category === cat);

  openPermissions() {
    const u = this.roleTarget();
    if (!u) return;
    this.permTarget.set(u);
    this.permError.set('');
    this.permLoading.set(true);
    this.adminService.getUserPermissions(u.id).subscribe({
      next: perms => { this.selectedPerms.set(perms); this.permLoading.set(false); },
      error: () => { this.selectedPerms.set([]); this.permLoading.set(false); }
    });
  }

  togglePerm(name: string, checked: boolean) {
    const cur = this.selectedPerms();
    this.selectedPerms.set(checked ? [...cur, name] : cur.filter(p => p !== name));
  }

  savePermissions() {
    this.permSaving.set(true);
    this.adminService.setUserPermissions(this.permTarget()!.id, this.selectedPerms()).subscribe({
      next: () => { this.permSaving.set(false); this.permTarget.set(null); },
      error: (e: any) => { this.permSaving.set(false); this.permError.set(e.error?.message ?? 'Failed to save permissions.'); }
    });
  }

  /* Create user */
  showCreate = signal(false);
  creating = signal(false);
  createError = signal('');
  createForm = this.emptyCreateForm();

  openCreate() {
    // Pre-select the default role
    const def = this.roles().find(r => r.isDefault);
    this.createForm = this.emptyCreateForm();
    if (def) this.createForm.roleId = def.id;
    this.createError.set('');
    this.showCreate.set(true);
  }
  closeCreate() { this.showCreate.set(false); }

  submitCreate() {
    if (!this.createForm.fullName.trim()) { this.createError.set('Full name is required.'); return; }
    if (!this.createForm.email?.trim() && !this.createForm.phoneNumber?.trim()) {
      this.createError.set('Email or phone number is required.'); return;
    }
    if (this.createForm.password.length < 6) { this.createError.set('Password must be at least 6 characters.'); return; }
    this.creating.set(true);
    this.adminService.createUser({
      fullName: this.createForm.fullName,
      email: this.createForm.email || undefined,
      phoneNumber: this.createForm.phoneNumber || undefined,
      password: this.createForm.password,
      roleId: this.createForm.roleId || undefined
    }).subscribe({
      next: () => { this.creating.set(false); this.closeCreate(); this.load(); },
      error: (e: any) => { this.creating.set(false); this.createError.set(e.error?.message ?? 'Failed to create user.'); }
    });
  }

  private emptyCreateForm() {
    return { fullName: '', email: '', phoneNumber: '', password: '', roleId: 0 };
  }

  filtered = () => {
    const f = this.filter();
    const all = this.users();
    if (f === 'all')     return all;
    if (f === 'inactive') return all.filter(u => !u.isActive);
    if (f === 'norole')   return all.filter(u => !u.roleName);
    return all.filter(u => u.roleName === f);
  };

  ngOnInit() {
    this.load();
    this.adminService.getRoles().subscribe(r => this.roles.set(r));
    this.adminService.getPermissions().subscribe(p => this.allPermissions.set(p));
  }

  load() {
    this.loading.set(true);
    this.adminService.getUsers().subscribe({ next: u => { this.users.set(u); this.loading.set(false); }, error: () => this.loading.set(false) });
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
