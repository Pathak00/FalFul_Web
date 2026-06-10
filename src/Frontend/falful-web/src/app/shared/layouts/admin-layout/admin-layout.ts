import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Subscription, catchError, of, switchMap } from 'rxjs';
import { AdminNavItem } from '../../../core/models/admin.models';
import { AdminService } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';
import { AdminNavStore } from '../../../core/stores/admin-nav.store';
import { ToastComponent } from '../../components/toast/toast';

interface NavGroup { label: string; items: AdminNavItem[]; }

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ToastComponent],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.scss'
})
export class AdminLayoutComponent implements OnInit, OnDestroy {
  private authService  = inject(AuthService);
  private adminService = inject(AdminService);
  private navStore     = inject(AdminNavStore);

  readonly user        = this.authService.currentUser;
  readonly initial     = () => this.user()?.fullName?.charAt(0)?.toUpperCase() ?? 'A';
  readonly sidebarOpen = signal(false);
  readonly navLoading  = signal(true);

  // Read nav items directly from the shared store (same source as the route guard).
  readonly navItems = this.navStore.items;

  private navSub = new Subscription();

  readonly navGroups = computed<NavGroup[]>(() => {
    const groups: NavGroup[] = [];
    const seen = new Map<string, NavGroup>();
    for (const item of this.navItems()) {
      const key = item.groupLabel ?? '';
      if (!seen.has(key)) {
        const g: NavGroup = { label: item.groupLabel ?? '', items: [] };
        seen.set(key, g);
        groups.push(g);
      }
      seen.get(key)!.items.push(item);
    }
    return groups;
  });

  ngOnInit(): void {
    // If the guard already loaded nav items for this session, skip the extra API call.
    if (this.navStore.loaded()) {
      this.navLoading.set(false);
    } else {
      this.loadNav();
    }

    // On permission change: refresh JWT (updates claims), then reload nav from DB.
    this.navSub = this.adminService.navRefresh$
      .pipe(switchMap(() => this.authService.refreshToken()))
      .subscribe({ next: () => this.reloadNav(), error: () => this.reloadNav() });
  }

  ngOnDestroy(): void { this.navSub.unsubscribe(); }

  private loadNav(): void {
    // Refresh the JWT first so permission claims are always in sync with DB,
    // then load nav. Without this, stale tokens cause the guard to deny access
    // to pages whose permissions were granted after the user last logged in.
    this.authService.refreshToken().pipe(
      catchError(() => of(null)),
      switchMap(() => this.navStore.load())
    ).subscribe({
      next: () => this.navLoading.set(false),
      error: () => this.navLoading.set(false)
    });
  }

  private reloadNav(): void {
    this.navLoading.set(true);
    this.navStore.load().subscribe({
      next: () => this.navLoading.set(false),
      error: () => this.navLoading.set(false)
    });
  }

  closeSidebarOnMobile(): void {
    if (window.innerWidth <= 768) this.sidebarOpen.set(false);
  }

  logout(): void { this.authService.logout(); }
}
