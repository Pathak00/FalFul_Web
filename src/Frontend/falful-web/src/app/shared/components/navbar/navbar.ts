import { Component, inject, output, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { MenuNode, MenuStore } from '../../../core/stores/menu.store';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="navbar">
      <div class="navbar-brand">
        <a routerLink="/" class="logo">
          <i class="bi bi-basket2-fill logo-icon"></i>
          <span class="logo-text">FalFul</span>
        </a>
      </div>

      <!-- Desktop nav links -->
      <ul class="nav-links">
        @for (item of menuStore.topLevel(); track item.id) {
          @if (item.children.length > 0) {
            <li class="nav-has-dropdown" (mouseenter)="openDropdown(item.id)" (mouseleave)="closeDropdown()">
              <a [href]="item.url || '#'" (click)="item.url ? null : $event.preventDefault()" class="nav-link-btn" routerLinkActive="active">
                @if (item.icon) {
                  @if (item.icon.startsWith('bi-')) { <i class="bi {{ item.icon }}"></i> }
                  @else { <span class="nav-emoji">{{ item.icon }}</span> }
                } {{ item.label }}
                <i class="bi bi-chevron-down dropdown-caret"></i>
              </a>
              <ul class="dropdown-menu" [class.open]="activeDropdown() === item.id"
                  (mouseenter)="openDropdown(item.id)" (mouseleave)="closeDropdown()">
                @for (child of item.children; track child.id) {
                  <li>
                    <a [routerLink]="child.url" routerLinkActive="active"
                       [target]="child.openInNewTab ? '_blank' : '_self'"
                       class="dropdown-item">
                      @if (child.icon) {
                        @if (child.icon.startsWith('bi-')) { <i class="bi {{ child.icon }} d-icon"></i> }
                        @else { <span class="d-icon">{{ child.icon }}</span> }
                      }
                      {{ child.label }}
                    </a>
                  </li>
                }
              </ul>
            </li>
          } @else {
            <li>
              <a [routerLink]="item.url || '/'" routerLinkActive="active"
                 [routerLinkActiveOptions]="item.url === '/' ? {exact:true} : {}"
                 [target]="item.openInNewTab ? '_blank' : '_self'">
                @if (item.icon) {
                  @if (item.icon.startsWith('bi-')) { <i class="bi {{ item.icon }}"></i> }
                  @else { <span class="nav-emoji">{{ item.icon }}</span> }
                } {{ item.label }}
              </a>
            </li>
          }
        }
      </ul>

      <!-- Desktop actions -->
      <div class="nav-actions">
        <button class="cart-btn" (click)="cartOpen.emit()">
          <i class="bi bi-cart3"></i>
          @if (cart.itemCount() > 0) {
            <span class="cart-badge">{{ cart.itemCount() }}</span>
          }
        </button>
        @if (isAuthenticated()) {
          <span class="user-greeting">
            <i class="bi bi-person-circle"></i> {{ user()?.fullName }}
          </span>
          <a class="btn-dashboard" routerLink="/home">
            <i class="bi bi-speedometer2"></i> Dashboard
          </a>
          <button class="btn-logout" (click)="logout()">
            <i class="bi bi-box-arrow-right"></i> Logout
          </button>
        } @else {
          <a routerLink="/auth/login" class="btn-login">
            <i class="bi bi-person"></i> Login
          </a>
          <a routerLink="/auth/register" class="btn-register">
            <i class="bi bi-rocket-takeoff"></i> Get Started
          </a>
        }
      </div>

      <!-- Mobile controls: cart + hamburger -->
      <div class="mobile-controls">
        <button class="cart-btn" (click)="cartOpen.emit()">
          <i class="bi bi-cart3"></i>
          @if (cart.itemCount() > 0) {
            <span class="cart-badge">{{ cart.itemCount() }}</span>
          }
        </button>
        <button class="hamburger" (click)="mobileMenuOpen.set(!mobileMenuOpen())"
                [class.is-open]="mobileMenuOpen()" aria-label="Toggle menu">
          <span></span><span></span><span></span>
        </button>
      </div>
    </nav>

    <!-- Mobile overlay -->
    @if (mobileMenuOpen()) {
      <div class="mobile-overlay" (click)="mobileMenuOpen.set(false)"></div>
    }

    <!-- Mobile drawer -->
    <div class="mobile-drawer" [class.open]="mobileMenuOpen()">
      <div class="drawer-header">
        <a routerLink="/" class="logo" (click)="mobileMenuOpen.set(false)">
          <i class="bi bi-basket2-fill logo-icon"></i>
          <span class="logo-text">FalFul</span>
        </a>
        <button class="drawer-close" (click)="mobileMenuOpen.set(false)" aria-label="Close menu">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>

      <nav class="drawer-nav">
        @for (item of menuStore.topLevel(); track item.id) {
          <a [routerLink]="item.url || '/'" class="drawer-link" (click)="mobileMenuOpen.set(false)"
             [target]="item.openInNewTab ? '_blank' : '_self'">
            @if (item.icon) {
              @if (item.icon.startsWith('bi-')) { <i class="bi {{ item.icon }}"></i> }
              @else { <span>{{ item.icon }}</span> }
            }
            {{ item.label }}
          </a>
          @if (item.children.length > 0) {
            @for (child of item.children; track child.id) {
              <a [routerLink]="child.url" class="drawer-link drawer-link-child"
                 (click)="mobileMenuOpen.set(false)"
                 [target]="child.openInNewTab ? '_blank' : '_self'">
                @if (child.icon) {
                  @if (child.icon.startsWith('bi-')) { <i class="bi {{ child.icon }}"></i> }
                  @else { <span>{{ child.icon }}</span> }
                }
                {{ child.label }}
              </a>
            }
          }
        }
      </nav>

      <div class="drawer-footer">
        @if (isAuthenticated()) {
          <div class="drawer-user">
            <i class="bi bi-person-circle"></i> {{ user()?.fullName }}
          </div>
          <a class="drawer-action-btn drawer-btn-primary" routerLink="/home"
             (click)="mobileMenuOpen.set(false)">
            <i class="bi bi-speedometer2"></i> Dashboard
          </a>
          <button class="drawer-action-btn drawer-btn-ghost" (click)="logout(); mobileMenuOpen.set(false)">
            <i class="bi bi-box-arrow-right"></i> Logout
          </button>
        } @else {
          <a routerLink="/auth/login" class="drawer-action-btn drawer-btn-ghost"
             (click)="mobileMenuOpen.set(false)">
            <i class="bi bi-person"></i> Login
          </a>
          <a routerLink="/auth/register" class="drawer-action-btn drawer-btn-primary"
             (click)="mobileMenuOpen.set(false)">
            <i class="bi bi-rocket-takeoff"></i> Get Started
          </a>
        }
      </div>
    </div>
  `,
  styleUrl: './navbar.scss'
})
export class NavbarComponent {
  private authService = inject(AuthService);
  readonly cart        = inject(CartService);
  readonly menuStore   = inject(MenuStore);
  readonly cartOpen    = output<void>();

  readonly isAuthenticated = this.authService.isAuthenticated;
  readonly user = this.authService.currentUser;

  activeDropdown = signal<number | null>(null);
  mobileMenuOpen = signal(false);

  private closeTimer: ReturnType<typeof setTimeout> | null = null;

  openDropdown(id: number) {
    if (this.closeTimer) { clearTimeout(this.closeTimer); this.closeTimer = null; }
    this.activeDropdown.set(id);
  }

  closeDropdown() {
    this.closeTimer = setTimeout(() => { this.activeDropdown.set(null); this.closeTimer = null; }, 150);
  }

  logout() { this.authService.logout(); }
}
