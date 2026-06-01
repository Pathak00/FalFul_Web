import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { AdminNavItem } from '../../../core/models/admin.models';
import { AdminService } from '../../../core/services/admin.service';
import { ToastService } from '../../../core/services/toast.service';

interface Role {
  id: number;
  name: string;
  description?: string;
  isDefault: boolean;
  portalType: string;
}

interface Permission {
  id: number;
  name: string;
  displayName: string;
  category: string;
}

@Component({
  selector: 'app-admin-roles',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrl: '../admin-shared.scss',
  template: `
    <div class="admin-page">
      <div class="page-header">
        <div>
          <h1>Roles & Permissions</h1>
          <p class="page-sub">Create roles, assign permissions per role, and set the default role for new registrations.</p>
        </div>
        <button class="btn btn-primary" (click)="openCreate()">
          <i class="bi bi-plus-lg"></i> New Role
        </button>
      </div>

      <div class="panel-grid">
        <!-- Role list -->
        <div class="card">
          <div class="card-header"><h2>Roles</h2></div>
          @if (loading()) {
            <div class="loading-state"><div class="spinner"></div></div>
          } @else {
            <table class="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Portal</th>
                  <th>Description</th>
                  <th>Default</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @for (role of roles(); track role.id) {
                  <tr [class.row-active]="selectedRole()?.id === role.id">
                    <td>
                      <strong>{{ role.name }}</strong>
                    </td>
                    <td>
                      <span class="badge" [class.badge-blue]="role.portalType === 'rider'" [class.badge-purple]="role.portalType === 'customer'" [class.badge-green]="role.portalType === 'admin'">
                        {{ role.portalType }}
                      </span>
                    </td>
                    <td class="text-muted">{{ role.description ?? '—' }}</td>
                    <td>
                      @if (role.isDefault) {
                        <span class="badge badge-green">Default</span>
                      } @else {
                        <button class="btn btn-xs btn-ghost" (click)="setDefault(role)" title="Set as default for new registrations">
                          Set default
                        </button>
                      }
                    </td>
                    <td class="actions">
                      <button class="btn btn-xs" (click)="selectRole(role)">
                        <i class="bi bi-shield-check"></i> Permissions
                      </button>
                      <button class="btn btn-xs btn-ghost" (click)="openEdit(role)">
                        <i class="bi bi-pencil"></i>
                      </button>
                      <button class="btn btn-xs btn-danger-soft" (click)="confirmDelete(role)" [disabled]="role.isDefault" [title]="role.isDefault ? 'Cannot delete the default role' : 'Delete role'">
                        <i class="bi bi-trash3"></i>
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          }
        </div>

        <!-- Permission editor -->
        @if (selectedRole()) {
          <div class="card">
            <div class="card-header">
              <h2>{{ selectedRole()!.name }} — Permissions</h2>
              <button class="btn btn-sm btn-primary" (click)="savePermissions()" [disabled]="saving()">
                {{ saving() ? 'Saving…' : 'Save' }}
              </button>
            </div>
            @if (permsLoading()) {
              <div class="loading-state"><div class="spinner"></div></div>
            } @else {
              <div class="perm-grid">
                @for (group of permGroups(); track group.category) {
                  <div class="perm-group">
                    <p class="perm-category">{{ group.category }}</p>
                    @for (perm of group.permissions; track perm.id) {
                      <label class="perm-row">
                        <input type="checkbox"
                               [checked]="selectedPermIds().has(perm.id)"
                               (change)="togglePerm(perm.id)">
                        <span>
                          <strong>{{ perm.displayName }}</strong>
                          @let navs = navsByPerm().get(perm.name);
                          @if (navs?.length) {
                            <small>
                              Unlocks:
                              @for (nav of navs; track nav.id) {
                                <span class="nav-hint">
                                  <i class="bi {{ nav.icon }}"></i>
                                  <em>{{ nav.label }}</em>
                                  <span class="scope-tag">{{ portalScopeLabel(nav.portalScope) }}</span>
                                </span>
                              }
                            </small>
                          } @else {
                            <small>{{ perm.name }}</small>
                          }
                        </span>
                      </label>
                    }
                  </div>
                }
              </div>
            }
          </div>
        }
      </div>
    </div>

    <!-- Delete confirm modal -->
    @if (deleteTarget()) {
      <div class="modal-overlay" (click)="deleteTarget.set(null)">
        <div class="modal modal-sm" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Delete "{{ deleteTarget()!.name }}"?</h2>
            <button class="btn-close" (click)="deleteTarget.set(null)">✕</button>
          </div>
          <div class="modal-body">
            <p>This will permanently delete the role and unassign it from all users. This cannot be undone.</p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" (click)="deleteTarget.set(null)">Cancel</button>
            <button class="btn btn-danger-solid" (click)="executeDelete()">Yes, Delete</button>
          </div>
        </div>
      </div>
    }

    <!-- Create / Edit modal -->
    @if (modalOpen()) {
      <div class="modal-overlay" (click)="closeModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>{{ editTarget() ? 'Edit Role' : 'New Role' }}</h2>
            <button class="btn-close" (click)="closeModal()">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Role Name</label>
              <input class="form-control" [(ngModel)]="form.name" placeholder="e.g. Staff, Rider, Manager" />
            </div>
            <div class="form-group">
              <label>Portal <span class="text-muted">(determines which dashboard users with this role see)</span></label>
              <select class="form-control" [(ngModel)]="form.portalType">
                <option value="admin">Admin — access to admin panel</option>
                <option value="rider">Rider — access to rider portal</option>
                <option value="customer">Customer — access to shop/storefront</option>
              </select>
            </div>
            <div class="form-group">
              <label>Description <span class="text-muted">(optional)</span></label>
              <input class="form-control" [(ngModel)]="form.description" placeholder="Brief description" />
            </div>
            @if (error()) {
              <p class="form-error">{{ error() }}</p>
            }
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" (click)="closeModal()">Cancel</button>
            <button class="btn btn-primary" (click)="save()" [disabled]="saving()">
              {{ saving() ? 'Saving…' : (editTarget() ? 'Update' : 'Create') }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .panel-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; align-items: start; }
    @media (max-width: 900px) { .panel-grid { grid-template-columns: 1fr; } }

    .row-active td { background: rgba(34,197,94,.06); }

    .perm-grid { padding: 1rem 1.25rem; display: flex; flex-direction: column; gap: 1.25rem; }
    .perm-group { display: flex; flex-direction: column; gap: .375rem; }
    .perm-category { font-size: .65rem; text-transform: uppercase; letter-spacing: .08em; color: #94a3b8; margin: 0 0 .25rem; font-weight: 600; }
    .perm-row {
      display: flex; align-items: center; gap: .625rem; cursor: pointer; padding: .375rem .5rem;
      border-radius: 6px; transition: background .1s;
      &:hover { background: #f1f5f9; }
      input { width: 15px; height: 15px; flex-shrink: 0; accent-color: #16a34a; }
      span { display: flex; flex-direction: column; gap: 1px; }
      strong { font-size: .8rem; color: #1e293b; font-weight: 600; }
      small { font-size: .7rem; color: #64748b; display: flex; flex-wrap: wrap; align-items: center; gap: .25rem .5rem; }
    }
    .nav-hint { display: inline-flex; align-items: center; gap: .2rem; }
    .scope-tag { font-size: .62rem; background: #f1f5f9; color: #64748b; padding: 0 5px; border-radius: 3px; font-family: monospace; }

    .btn-xs { font-size: .7rem; padding: .2rem .5rem; }
    .btn-danger-soft { background: #fef2f2; color: #dc2626; border-color: #fecaca; &:hover { background: #fee2e2; } &:disabled { opacity: .4; cursor: not-allowed; } }
    .badge-blue   { background: #dbeafe; color: #1d4ed8; }
    .badge-purple { background: #ede9fe; color: #6d28d9; }
    .badge-green  { background: #dcfce7; color: #15803d; }
  `]
})
export class AdminRolesComponent implements OnInit {
  private admin = inject(AdminService);
  private toast = inject(ToastService);

  readonly roles        = signal<Role[]>([]);
  readonly allPerms     = signal<Permission[]>([]);
  readonly selectedRole = signal<Role | null>(null);
  readonly selectedPermIds = signal<Set<number>>(new Set());
  readonly loading      = signal(true);
  readonly permsLoading = signal(false);
  readonly saving       = signal(false);
  readonly modalOpen    = signal(false);
  readonly editTarget   = signal<Role | null>(null);
  readonly deleteTarget = signal<Role | null>(null);
  readonly error        = signal('');

  readonly form = { name: '', description: '', portalType: 'admin' };

  readonly navItems  = signal<AdminNavItem[]>([]);

  readonly permGroups = computed(() => {
    const map = new Map<string, { category: string; permissions: Permission[] }>();
    for (const p of this.allPerms()) {
      if (!map.has(p.category)) map.set(p.category, { category: p.category, permissions: [] });
      map.get(p.category)!.permissions.push(p);
    }
    return [...map.values()];
  });

  /** Map of permissionName → AdminNavItem[] — all nav items that require this permission.
   *  Uses an array because multiple items may share a permission (e.g. receipts → 2 items). */
  readonly navsByPerm = computed(() => {
    const map = new Map<string, AdminNavItem[]>();
    for (const item of this.navItems()) {
      if (item.requiredPermission) {
        const existing = map.get(item.requiredPermission) ?? [];
        map.set(item.requiredPermission, [...existing, item]);
      }
    }
    return map;
  });

  portalScopeLabel(scope?: string | null): string {
    if (!scope) return 'all portals';
    const portals = scope.split(',').map(p => p.trim()).filter(Boolean);
    if (portals.length === 0) return 'all portals';
    return portals.join('+');
  }

  ngOnInit(): void {
    this.loadRoles();
    this.admin.getPermissions().subscribe(p => this.allPerms.set(p as Permission[]));
    this.admin.getAllAdminNav().subscribe(items => this.navItems.set(items as AdminNavItem[]));
  }

  private loadRoles(): void {
    this.loading.set(true);
    this.admin.getRoles().subscribe({
      next: r => { this.roles.set(r as Role[]); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  selectRole(role: Role): void {
    this.selectedRole.set(role);
    this.permsLoading.set(true);
    this.admin.getRolePermissions(role.id).subscribe({
      next: perms => {
        this.selectedPermIds.set(new Set((perms as Permission[]).map(p => p.id)));
        this.permsLoading.set(false);
      },
      error: () => this.permsLoading.set(false)
    });
  }

  togglePerm(id: number): void {
    const set = new Set(this.selectedPermIds());
    if (set.has(id)) set.delete(id); else set.add(id);
    this.selectedPermIds.set(set);
  }

  savePermissions(): void {
    const role = this.selectedRole();
    if (!role) return;
    this.saving.set(true);
    this.admin.setRolePermissions(role.id, [...this.selectedPermIds()]).subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success('Permissions saved.');
        this.admin.triggerNavRefresh();
      },
      error: () => { this.saving.set(false); this.toast.error('Failed to save permissions.'); }
    });
  }

  setDefault(role: Role): void {
    this.admin.setDefaultRole(role.id).subscribe(() => {
      this.roles.update(list => list.map(r => ({ ...r, isDefault: r.id === role.id })));
    });
  }

  confirmDelete(role: Role): void {
    this.deleteTarget.set(role);
  }

  executeDelete(): void {
    const role = this.deleteTarget();
    if (!role) return;
    this.admin.deleteRole(role.id).subscribe({
      next: () => {
        this.deleteTarget.set(null);
        if (this.selectedRole()?.id === role.id) this.selectedRole.set(null);
        this.loadRoles();
      },
      error: (err: { error?: { message?: string } }) => {
        this.deleteTarget.set(null);
        this.toast.error(err?.error?.message ?? 'Failed to delete role.');
      }
    });
  }

  openCreate(): void {
    this.editTarget.set(null);
    this.form.name = '';
    this.form.description = '';
    this.form.portalType = 'admin';
    this.error.set('');
    this.modalOpen.set(true);
  }

  openEdit(role: Role): void {
    this.editTarget.set(role);
    this.form.name = role.name;
    this.form.description = role.description ?? '';
    this.form.portalType = role.portalType ?? 'admin';
    this.error.set('');
    this.modalOpen.set(true);
  }

  closeModal(): void { this.modalOpen.set(false); }

  save(): void {
    if (!this.form.name.trim()) { this.error.set('Role name is required.'); return; }
    this.saving.set(true);
    this.error.set('');
    const target = this.editTarget();

    const obs: Observable<unknown> = target
      ? this.admin.updateRole(target.id, this.form.name.trim(), this.form.description || undefined, this.form.portalType)
      : this.admin.createRole(this.form.name.trim(), this.form.description || undefined, this.form.portalType);

    obs.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeModal();
        this.loadRoles();
      },
      error: (err: { error?: { message?: string } }) => {
        this.saving.set(false);
        this.error.set(err?.error?.message ?? 'An error occurred.');
      }
    });
  }
}
