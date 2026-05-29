import { Injectable, computed, inject } from '@angular/core';
import { Perm } from '../constants/permissions';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class HomeRouteService {
  private user = inject(AuthService).currentUser;

  /** Reactive computed: re-evaluates whenever currentUser changes. */
  readonly route = computed(() => {
    const user = this.user();
    if (!user) return '/';
    const perms = user.permissions;
    if (perms.includes(Perm.System)) return '/admin';
    if (perms.includes(Perm.Shop))   return '/products';
    // Riders go to the rider portal — checked by role name first, permissions as fallback.
    const isRider = user.role?.toLowerCase() === 'rider' ||
      (perms.length > 0 && perms.every(p => p === Perm.Deliveries));
    if (isRider) return '/rider/deliveries';
    if (perms.length > 0) return '/admin';
    return '/';
  });
}
