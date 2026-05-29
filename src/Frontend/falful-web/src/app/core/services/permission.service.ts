import { Injectable, inject } from '@angular/core';
import { Perm, PermKey } from '../constants/permissions';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class PermissionService {
  private user = inject(AuthService).currentUser;

  can(key: PermKey): boolean {
    return this.user()?.permissions.includes(key) ?? false;
  }

  canAny(...keys: PermKey[]): boolean {
    const perms = this.user()?.permissions ?? [];
    return keys.some(k => perms.includes(k));
  }

  /** True if the user holds at least one permission (used for admin shell entry). */
  hasAny(): boolean {
    return (this.user()?.permissions.length ?? 0) > 0;
  }

  /** True if the user holds at least one admin-panel permission (excludes riders and customer-only perms). */
  canEnterAdmin(): boolean {
    if (this.isRiderOnly()) return false;
    const perms = this.user()?.permissions ?? [];
    return perms.some(p => p !== Perm.Deliveries && p !== Perm.Shop);
  }

  /** True when the user is a Rider — checked by role name first, then by permissions fallback. */
  isRiderOnly(): boolean {
    const user = this.user();
    if (!user) return false;
    if (user.role?.toLowerCase() === 'rider') return true;
    const perms = user.permissions ?? [];
    return perms.length > 0 && perms.every(p => p === Perm.Deliveries);
  }

  /** True if the user holds the 'shop' permission (assigned per role in /admin/roles). */
  canShop(): boolean {
    return this.can(Perm.Shop);
  }
}
