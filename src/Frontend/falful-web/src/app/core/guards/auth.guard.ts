import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { PermKey } from '../constants/permissions';
import { AdminNavStore } from '../stores/admin-nav.store';
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
 * Guards admin routes. Only allows users whose role's PortalType is 'admin'.
 */
export const anyPermGuard: CanActivateFn = () => {
  const perms = inject(PermissionService);
  const homeRoute = inject(HomeRouteService);
  const router = inject(Router);

  if (perms.canEnterAdmin()) return true;

  router.navigate([homeRoute.route()]);
  return false;
};

/**
 * Guards the rider portal. Only allows users whose role's PortalType is 'rider'.
 */
export const riderGuard: CanActivateFn = () => {
  const perms = inject(PermissionService);
  const homeRoute = inject(HomeRouteService);
  const router = inject(Router);

  if (perms.isRiderOnly()) return true;

  router.navigate([homeRoute.route()]);
  return false;
};

/**
 * DB-driven guard for admin and rider child routes.
 *
 * Looks up the required permission for the current URL from AdminNavStore
 * (which is backed by AdminNavItems.RequiredPermission in the database).
 * This means sidebar visibility and route access are always in sync:
 * changing RequiredPermission in the DB updates both the nav item and the guard.
 */
export const dynamicNavGuard: CanActivateFn = (_route, state) => {
  const store     = inject(AdminNavStore);
  const homeRoute = inject(HomeRouteService);
  const router    = inject(Router);

  return store.canAccess(state.url).pipe(
    map(allowed => allowed || router.createUrlTree([homeRoute.route()]))
  );
};
