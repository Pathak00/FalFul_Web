import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class PermissionService {
  private user = inject(AuthService).currentUser;

  can(key: string): boolean {
    return this.user()?.permissions.includes(key) ?? false;
  }

  canAny(...keys: string[]): boolean {
    const perms = this.user()?.permissions ?? [];
    return keys.some(k => perms.includes(k));
  }

  /** True if the user holds at least one permission. */
  hasAny(): boolean {
    return (this.user()?.permissions.length ?? 0) > 0;
  }

  /** True when the user belongs to the admin portal (set by role's PortalType in DB). */
  canEnterAdmin(): boolean {
    return this.user()?.portalType === 'admin';
  }

  /** True when the user belongs to the rider portal (set by role's PortalType in DB). */
  isRiderOnly(): boolean {
    return this.user()?.portalType === 'rider';
  }

  /** True when the user belongs to the customer/shop portal. */
  canShop(): boolean {
    return this.user()?.portalType === 'customer';
  }
}
