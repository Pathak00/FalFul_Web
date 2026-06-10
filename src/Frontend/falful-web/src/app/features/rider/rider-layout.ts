import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Subscription, catchError, of, switchMap } from 'rxjs';
import { AdminService } from '../../core/services/admin.service';
import { AuthService } from '../../core/services/auth.service';
import { AdminNavStore } from '../../core/stores/admin-nav.store';

@Component({
  selector: 'app-rider-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './rider-layout.html',
  styleUrl: './rider-layout.scss'
})
export class RiderLayoutComponent implements OnInit, OnDestroy {
  private authService  = inject(AuthService);
  private adminService = inject(AdminService);
  private navStore     = inject(AdminNavStore);

  readonly user    = this.authService.currentUser;
  readonly initial = () => this.user()?.fullName?.charAt(0)?.toUpperCase() ?? 'R';
  sidebarOpen = signal(false);
  navLoading  = signal(true);

  // Remap admin routes to rider equivalents from the shared store.
  readonly navItems = computed(() =>
    this.navStore.items()
      .filter(i => i.route !== '/admin')
      .map(i => ({ ...i, route: i.route.replace(/^\/admin\//, '/rider/') }))
  );

  private navSub = new Subscription();

  ngOnInit(): void {
    if (this.navStore.loaded()) {
      this.navLoading.set(false);
    } else {
      this.loadNav();
    }

    this.navSub = this.adminService.navRefresh$
      .pipe(switchMap(() => this.authService.refreshToken()))
      .subscribe({ next: () => this.reloadNav(), error: () => this.reloadNav() });
  }

  ngOnDestroy(): void { this.navSub.unsubscribe(); }

  private loadNav(): void {
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

  closeSidebar() { this.sidebarOpen.set(false); }
  logout() { this.authService.logout(); }
}
