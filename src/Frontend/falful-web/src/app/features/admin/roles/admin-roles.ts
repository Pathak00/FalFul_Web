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
  templateUrl: './admin-roles.html',
  styleUrl: './admin-roles.scss',
})
export class AdminRolesComponent implements OnInit {
  private admin = inject(AdminService);
  private toast = inject(ToastService);

  readonly roles = signal<Role[]>([]);
  readonly allPerms = signal<Permission[]>([]);
  readonly selectedRole = signal<Role | null>(null);
  readonly selectedPermIds = signal<Set<number>>(new Set());
  readonly loading = signal(true);
  readonly permsLoading = signal(false);
  readonly saving = signal(false);
  readonly modalOpen = signal(false);
  readonly editTarget = signal<Role | null>(null);
  readonly deleteTarget = signal<Role | null>(null);
  readonly error = signal('');

  readonly form = { name: '', description: '', portalType: 'admin' };

  readonly navItems = signal<AdminNavItem[]>([]);

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
    const portals = scope
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
    if (portals.length === 0) return 'all portals';
    return portals.join('+');
  }

  ngOnInit(): void {
    this.loadRoles();
    this.admin.getPermissions().subscribe((p) => this.allPerms.set(p as Permission[]));
    this.admin.getAllAdminNav().subscribe((items) => this.navItems.set(items as AdminNavItem[]));
  }

  private loadRoles(): void {
    this.loading.set(true);
    this.admin.getRoles().subscribe({
      next: (r) => {
        this.roles.set(r as Role[]);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  selectRole(role: Role): void {
    this.selectedRole.set(role);
    this.permsLoading.set(true);
    this.admin.getRolePermissions(role.id).subscribe({
      next: (perms) => {
        this.selectedPermIds.set(new Set((perms as Permission[]).map((p) => p.id)));
        this.permsLoading.set(false);
      },
      error: () => this.permsLoading.set(false),
    });
  }

  togglePerm(id: number): void {
    const set = new Set(this.selectedPermIds());
    if (set.has(id)) set.delete(id);
    else set.add(id);
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
      error: () => {
        this.saving.set(false);
        this.toast.error('Failed to save permissions.');
      },
    });
  }

  setDefault(role: Role): void {
    this.admin.setDefaultRole(role.id).subscribe(() => {
      this.roles.update((list) => list.map((r) => ({ ...r, isDefault: r.id === role.id })));
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
      },
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

  closeModal(): void {
    this.modalOpen.set(false);
  }

  save(): void {
    if (!this.form.name.trim()) {
      this.error.set('Role name is required.');
      return;
    }
    this.saving.set(true);
    this.error.set('');
    const target = this.editTarget();

    const obs: Observable<unknown> = target
      ? this.admin.updateRole(
          target.id,
          this.form.name.trim(),
          this.form.description || undefined,
          this.form.portalType,
        )
      : this.admin.createRole(
          this.form.name.trim(),
          this.form.description || undefined,
          this.form.portalType,
        );

    obs.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeModal();
        this.loadRoles();
      },
      error: (err: { error?: { message?: string } }) => {
        this.saving.set(false);
        this.error.set(err?.error?.message ?? 'An error occurred.');
      },
    });
  }
}
