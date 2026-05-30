import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PermKey } from '../constants/permissions';
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
 * Guards consumer/shop routes. Blocks users whose role's PortalType is 'rider' or 'admin'.
 * Guests are always allowed.
 */
export const shopGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const homeRoute = inject(HomeRouteService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) return true;

  const portalType = auth.currentUser()?.portalType;
  if (portalType === 'rider' || portalType === 'admin') {
    router.navigate([homeRoute.route()]);
    return false;
  }

  return true;
};
