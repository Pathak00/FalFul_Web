import { Component, HostListener, OnInit, effect, inject, output, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { MenuStore } from '../../../core/stores/menu.store';
import { PopDialogBoxComponent } from '../PopUpConfirmationModel/popDialogBox';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class NavbarComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  readonly cart = inject(CartService);
  readonly menuStore = inject(MenuStore);
  readonly cartOpen = output<void>();

  readonly isAuthenticated = this.authService.isAuthenticated;
  readonly user = this.authService.currentUser;

  scrolled = signal(false);
  cartBouncing = signal(false);
  activeDropdown = signal<number | null>(null);
  mobileMenuOpen = signal(false);
  Message = '';

  constructor() {
    // Bounce the cart icon whenever a new item is added
    effect(
      () => {
        if (this.cart.lastAdded() > 0) {
          this.cartBouncing.set(true);
          setTimeout(() => this.cartBouncing.set(false), 600);
        }
      },
      { allowSignalWrites: true },
    );
  }

  ngOnInit(): void {
    this.updateScrolled();
    this.router.events.subscribe((e) => {
      if (e instanceof NavigationEnd) this.updateScrolled();
    });

    if (!this.user()) {
      // this.popUpDialog.isOpen = true;
    }
  }

  @HostListener('window:scroll')
  onScroll() {
    this.updateScrolled();
  }

  private updateScrolled(): void {
    const onHome = this.router.url === '/' || this.router.url === '';
    this.scrolled.set(!onHome || window.scrollY > 60);
  }

  private closeTimer: ReturnType<typeof setTimeout> | null = null;

  openDropdown(id: number) {
    if (this.closeTimer) {
      clearTimeout(this.closeTimer);
      this.closeTimer = null;
    }
    this.activeDropdown.set(id);
  }

  closeDropdown() {
    this.closeTimer = setTimeout(() => {
      this.activeDropdown.set(null);
      this.closeTimer = null;
    }, 150);
  }

  logout() {
    this.authService.logout();
  }
}
