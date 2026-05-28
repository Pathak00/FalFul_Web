import { Injectable, computed, inject } from '@angular/core';
import { Perm } from '../constants/permissions';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class HomeRouteService {
  private user = inject(AuthService).currentUser;

  /** Reactive computed: re-evaluates whenever currentUser changes. */
  readonly route = computed(() => {
    const user = this.user();
    if (!user || user.permissions.length === 0) return '/dashboard';
    if (user.permissions.includes(Perm.System)) return '/admin';
    if (user.permissions.some(p => p !== Perm.Deliveries)) return '/admin';
    return '/rider/deliveries';
  });
}
