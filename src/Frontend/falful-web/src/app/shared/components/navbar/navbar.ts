import { Component, inject, output, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { HomeRouteService } from '../../../core/services/home-route.service';
import { PermissionService } from '../../../core/services/permission.service';
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

      <ul class="nav-links">
        @for (item of menuStore.topLevel(); track item.id) {
          @if (item.children.length > 0) {
            <!-- Dropdown item -->
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
            <!-- Plain link -->
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

      <div class="nav-actions">
        @if (perms.canShop()) {
          <button class="cart-btn" (click)="cartOpen.emit()">
            <i class="bi bi-cart3"></i>
            @if (cart.itemCount() > 0) {
              <span class="cart-badge">{{ cart.itemCount() }}</span>
            }
          </button>
        }
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
    </nav>
  `,
  styleUrl: './navbar.scss'
})
export class NavbarComponent {
  private authService = inject(AuthService);
  readonly cart        = inject(CartService);
  readonly menuStore   = inject(MenuStore);
  readonly perms       = inject(PermissionService);
  readonly cartOpen    = output<void>();

  readonly isAuthenticated = this.authService.isAuthenticated;
  readonly user = this.authService.currentUser;

  activeDropdown = signal<number | null>(null);

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
