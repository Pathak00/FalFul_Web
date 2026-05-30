import { Injectable, inject, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable, of } from 'rxjs';
import { catchError, distinctUntilChanged, filter, map, skip, tap } from 'rxjs/operators';
import { AdminNavItem } from '../models/admin.models';
import { AdminService } from '../services/admin.service';
import { AuthService } from '../services/auth.service';
import { PermissionService } from '../services/permission.service';

/**
 * Singleton cache for the current user's admin nav items.
 * Both admin/rider layout sidebars and the dynamicNavGuard read from here,
 * so sidebar visibility and route access are always derived from the same
 * DB source (AdminNavItems.RequiredPermission via sp_AdminNavItem_GetForUser).
 */
@Injectable({ providedIn: 'root' })
export class AdminNavStore {
  private adminService = inject(AdminService);
  private permService  = inject(PermissionService);
  private authService  = inject(AuthService);

  private readonly _items  = signal<AdminNavItem[]>([]);
  private readonly _loaded = signal(false);

  readonly items  = this._items.asReadonly();
  readonly loaded = this._loaded.asReadonly();

  constructor() {
    // Wipe cached items when the user logs out so the next login gets fresh data.
    toObservable(this.authService.isAuthenticated).pipe(
      distinctUntilChanged(),
      skip(1),
      filter(authenticated => !authenticated)
    ).subscribe(() => this.clear());
  }

  /** Fetch nav items for the current user and populate the cache. */
  load(): Observable<AdminNavItem[]> {
    return this.adminService.getAdminNav().pipe(
      tap(items => { this._items.set(items); this._loaded.set(true); })
    );
  }

  clear(): void {
    this._items.set([]);
    this._loaded.set(false);
  }

  /**
   * Guard helper: returns true if the user may access this URL.
   *
   * The check works by matching the URL to an AdminNavItem and reading its
   * RequiredPermission from the DB.  Rider URLs (/rider/*) are normalised to
   * their admin equivalents (/admin/*) before matching, because a rider's nav
   * items are the same rows — just remapped at runtime.
   *
   * If no matching nav item exists (e.g. admin dashboard root "/admin") the
   * route is allowed; the parent anyPermGuard / riderGuard already enforced
   * portal-type access.
   */
  canAccess(url: string): Observable<boolean> {
    const doCheck = () => {
      const normalized = url
        .replace(/^\/rider\//, '/admin/')
        .split('?')[0]
        .split('#')[0];

      const item = this._items().find(i => i.route === normalized);
      if (!item) return true;
      if (!item.requiredPermission) return true;
      return this.permService.can(item.requiredPermission);
    };

    if (this._loaded()) return of(doCheck());
    return this.load().pipe(map(() => doCheck()), catchError(() => of(false)));
  }
}
