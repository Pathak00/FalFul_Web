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
  const homeRoute = inject(HomeRouteService);
  const router = inject(Router);

  if (perms.can(perm)) return true;

  router.navigate([homeRoute.route()]);
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
 * Guards the rider portal. Only allows pure riders (deliveries is their
 * sole permission). Staff/admin who also hold deliveries are sent to /admin.
 */
export const riderGuard: CanActivateFn = () => {
  const perms  = inject(PermissionService);
  const router = inject(Router);

  if (perms.isRiderOnly()) return true;

  // Staff or admin — redirect to admin dashboard instead of rider portal
  router.navigate([perms.canEnterAdmin() ? '/admin' : '/dashboard']);
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

  const currentUser = auth.currentUser();
  const userPerms = currentUser?.permissions ?? [];

  // Rider: identified by role name first, permissions fallback
  const isRiderOnly = currentUser?.role?.toLowerCase() === 'rider' ||
    (userPerms.length > 0 && userPerms.every(p => p === Perm.Deliveries));

  if (isRiderOnly) {
    router.navigate([homeRoute.route()]);
    return false;
  }

  return true;
};
