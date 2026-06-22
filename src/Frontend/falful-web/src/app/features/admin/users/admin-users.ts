import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminUser } from '../../../core/models/admin.models';
import { AdminService } from '../../../core/services/admin.service';

interface RoleOption {
  id: number;
  name: string;
  description?: string;
  isDefault?: boolean;
  portalType: string;
}

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [FormsModule, DatePipe, RouterLink],
  styleUrl: '../admin-shared.scss',
  templateUrl: './admin-users.html',
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

  roles = signal<RoleOption[]>([]);
  roleTarget = signal<AdminUser | null>(null);
  selectedRoleId = 0;
  roleLoading = signal(false);
  roleSaving = signal(false);
  roleError = signal('');

  /** Portal type of the currently selected role (reactive via getter). */
  get selectedRolePortalType(): string {
    return this.roles().find((r) => r.id === +this.selectedRoleId)?.portalType ?? 'customer';
  }

  openRole(u: AdminUser) {
    this.roleTarget.set(u);
    this.roleError.set('');
    this.roleLoading.set(true);
    this.adminService.getUserRole(u.id).subscribe({
      next: (role) => {
        this.selectedRoleId = role.id;
        this.roleLoading.set(false);
      },
      error: () => {
        this.selectedRoleId = this.roles()[0]?.id ?? 0;
        this.roleLoading.set(false);
      },
    });
  }

  saveRole() {
    this.roleSaving.set(true);
    this.adminService.assignRole(this.roleTarget()!.id, +this.selectedRoleId).subscribe({
      next: () => {
        this.roleSaving.set(false);
        this.roleTarget.set(null);
        this.load();
      },
      error: (e: any) => {
        this.roleSaving.set(false);
        this.roleError.set(e.error?.message ?? 'Failed to save role.');
      },
    });
  }

  /* Create user */
  showCreate = signal(false);
  creating = signal(false);
  createError = signal('');
  createForm = this.emptyCreateForm();

  openCreate() {
    const def = this.roles().find((r) => r.isDefault);
    this.createForm = this.emptyCreateForm();
    if (def) this.createForm.roleId = def.id;
    this.createError.set('');
    this.showCreate.set(true);
  }
  closeCreate() {
    this.showCreate.set(false);
  }

  submitCreate() {
    if (!this.createForm.fullName.trim()) {
      this.createError.set('Full name is required.');
      return;
    }
    if (!this.createForm.email?.trim() && !this.createForm.phoneNumber?.trim()) {
      this.createError.set('Email or phone number is required.');
      return;
    }
    if (this.createForm.password.length < 6) {
      this.createError.set('Password must be at least 6 characters.');
      return;
    }
    this.creating.set(true);
    this.adminService
      .createUser({
        fullName: this.createForm.fullName,
        email: this.createForm.email || undefined,
        phoneNumber: this.createForm.phoneNumber || undefined,
        password: this.createForm.password,
        roleId: this.createForm.roleId || undefined,
      })
      .subscribe({
        next: () => {
          this.creating.set(false);
          this.closeCreate();
          this.load();
        },
        error: (e: any) => {
          this.creating.set(false);
          this.createError.set(e.error?.message ?? 'Failed to create user.');
        },
      });
  }

  private emptyCreateForm() {
    return { fullName: '', email: '', phoneNumber: '', password: '', roleId: 0 };
  }

  filtered = () => {
    const f = this.filter();
    const all = this.users();
    if (f === 'all') return all;
    if (f === 'inactive') return all.filter((u) => !u.isActive);
    if (f === 'norole') return all.filter((u) => !u.roleName);
    return all.filter((u) => u.roleName === f);
  };

  ngOnInit() {
    this.load();
    this.adminService.getRoles().subscribe((r) => this.roles.set(r));
  }

  load() {
    this.loading.set(true);
    this.adminService.getUsers().subscribe({
      next: (u) => {
        this.users.set(u);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  toggleActive(u: AdminUser) {
    const action = u.isActive ? 'deactivate' : 'activate';
    if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} ${u.fullName}'s account?`))
      return;
    this.adminService.setUserActive({ userId: u.id, isActive: !u.isActive }).subscribe({
      next: () => {
        u.isActive = !u.isActive;
      },
      error: () => {},
    });
  }

  openReset(u: AdminUser) {
    this.resetTarget.set(u);
    this.newPassword = '';
    this.resetError.set('');
  }

  confirmReset() {
    if (this.newPassword.length < 6) {
      this.resetError.set('Password must be at least 6 characters.');
      return;
    }
    this.resetting.set(true);
    this.adminService
      .resetPassword({ userId: this.resetTarget()!.id, newPassword: this.newPassword })
      .subscribe({
        next: () => {
          this.resetting.set(false);
          this.resetTarget.set(null);
        },
        error: (e: any) => {
          this.resetting.set(false);
          this.resetError.set(e.error?.message ?? 'Failed to reset password.');
        },
      });
  }

  confirmDelete() {
    if (!this.deleteTarget()) return;
    this.adminService.deleteUser(this.deleteTarget()!.id).subscribe({
      next: () => {
        this.deleteTarget.set(null);
        this.load();
      },
    });
  }
}
