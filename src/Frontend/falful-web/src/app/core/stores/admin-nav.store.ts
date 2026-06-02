import { Injectable, inject, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, distinctUntilChanged, filter, map, skip, tap } from 'rxjs/operators';
import { AdminNavItem } from '../models/admin.models';
import { AdminService } from '../services/admin.service';
import { AuthService } from '../services/auth.service';
import { PermissionService } from '../services/permission.service';

/**
 * Singleton cache for the current user's admin nav items.
 *
 * Maintains TWO separate item lists:
 *
 *   _visibleItems  — items the user can SEE in the sidebar (IsVisible=1 + has permission).
 *                    Used by admin-layout and rider-layout to render the sidebar.
 *
 *   _permittedItems — items the user has PERMISSION to access, regardless of IsVisible.
 *                    Used exclusively by dynamicNavGuard.
 *
 * This separation fixes the security bug where hidden nav items were accessible
 * by direct URL: previously canAccess() returned true for any URL not in the
 * visible-items list, so staff could bypass permission checks by typing a URL
 * whose nav item had been hidden.
 */
@Injectable({ providedIn: 'root' })
export class AdminNavStore {
  private adminService = inject(AdminService);
  private permService  = inject(PermissionService);
  private authService  = inject(AuthService);

  private readonly _visibleItems   = signal<AdminNavItem[]>([]);
  private readonly _permittedItems = signal<AdminNavItem[]>([]);
  private readonly _loaded         = signal(false);

  /** Sidebar navigation (visible items the user has permission for). */
  readonly items  = this._visibleItems.asReadonly();
  readonly loaded = this._loaded.asReadonly();

  constructor() {
    toObservable(this.authService.isAuthenticated).pipe(
      distinctUntilChanged(),
      skip(1),
      filter(authenticated => !authenticated)
    ).subscribe(() => this.clear());
  }

  /** Fetch both nav lists for the current user and populate the cache. */
  load(): Observable<AdminNavItem[]> {
    return forkJoin({
      visible:   this.adminService.getAdminNav().pipe(catchError(() => of([] as AdminNavItem[]))),
      permitted: this.adminService.getPermittedAdminNav().pipe(catchError(() => of([] as AdminNavItem[])))
    }).pipe(
      tap(({ visible, permitted }) => {
        this._visibleItems.set(visible);
        this._permittedItems.set(permitted);
        this._loaded.set(true);
      }),
      map(({ visible }) => visible)
    );
  }

  clear(): void {
    this._visibleItems.set([]);
    this._permittedItems.set([]);
    this._loaded.set(false);
  }

  /**
   * Guard helper: returns true if the user may access this URL.
   *
   * Uses _permittedItems (not _visibleItems) so that hidden nav items still
   * enforce their RequiredPermission.  If the URL is not registered in
   * AdminNavItems at all (e.g. a newly added route without a nav entry),
   * access is allowed — the parent anyPermGuard / riderGuard already
   * enforced portal-type access.
   *
   * Rider URLs (/rider/*) are normalised to /admin/* before matching,
   * because rider nav items share the same AdminNavItems rows.
   */
  canAccess(url: string): Observable<boolean> {
    const doCheck = () => {
      const normalized = url
        .replace(/^\/rider\//, '/admin/')
        .split('?')[0]
        .split('#')[0];

      const item = this._permittedItems().find(i => i.route === normalized);

      // Route not registered in AdminNavItems — allow (unregistered routes are
      // protected only by the portal-type guard above this one).
      if (!item) return true;

      // Route is registered: check permission.
      if (!item.requiredPermission) return true;
      return this.permService.can(item.requiredPermission);
    };

    if (this._loaded()) return of(doCheck());
    return this.load().pipe(map(() => doCheck()), catchError(() => of(false)));
  }
}
