import { Injectable, computed, inject } from '@angular/core';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class HomeRouteService {
  private user = inject(AuthService).currentUser;

  /** Reactive computed: re-evaluates whenever currentUser changes. */
  readonly route = computed(() => {
    const user = this.user();
    if (!user) return '/';
    switch (user.portalType) {
      case 'rider':    return '/rider/deliveries';
      case 'customer': return '/';
      case 'admin':
      default:         return '/admin';
    }
  });
}
