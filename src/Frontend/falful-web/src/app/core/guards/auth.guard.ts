import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Perm, PermKey } from '../constants/permissions';
import { AuthService } from '../services/auth.service';
import { HomeRouteService } from '../services/home-route.service';
import { PermissionService } from '../services/permission.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) return true;

  router.navigate(['/auth/login']);
  return false;
};

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const homeRoute = inject(HomeRouteService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) return true;

  router.navigate([homeRoute.route()]);
  return false;
};

export const permissionGuard = (perm: PermKey): CanActivateFn => () => {
  const perms = inject(PermissionService);
  const router = inject(Router);

  if (perms.can(perm)) return true;

  router.navigate(['/dashboard']);
  return false;
};

/**
 * Guards admin routes. Blocks users whose only permission is 'deliveries'
 * (riders) — they have their own portal at /rider/deliveries.
 */
export const anyPermGuard: CanActivateFn = () => {
  const perms = inject(PermissionService);
  const router = inject(Router);

  if (perms.canEnterAdmin()) return true;

  router.navigate(['/dashboard']);
  return false;
};

/**
 * Guards consumer/shop routes. Blocks authenticated users who hold
 * ONLY the 'deliveries' permission (riders). Guests are always allowed.
 */
export const shopGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const homeRoute = inject(HomeRouteService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) return true; // guests browse freely

  const userPerms = auth.currentUser()?.permissions ?? [];

  // Rider: has permissions but every single one is 'deliveries'
  const isRiderOnly = userPerms.length > 0 && userPerms.every(p => p === Perm.Deliveries);

  if (isRiderOnly) {
    router.navigate([homeRoute.route()]);
    return false;
  }

  return true;
};
