import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MenuItem } from '../../../core/models/cms.models';
import { AuthService } from '../../../core/services/auth.service';
import { CmsService } from '../../../core/services/cms.service';

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
        @for (item of topLevel(); track item.id) {
          @if (hasChildren(item.id)) {
            <!-- Dropdown item -->
            <li class="nav-has-dropdown" (mouseenter)="openDropdown(item.id)" (mouseleave)="closeDropdown()">
              <a [href]="item.url || '#'" (click)="item.url ? null : $event.preventDefault()" class="nav-link-btn" routerLinkActive="active">
                @if (item.icon) {
                  @if (item.icon.startsWith('bi-')) { <i class="bi {{ item.icon }}"></i> }
                  @else { <span class="nav-emoji">{{ item.icon }}</span> }
                } {{ item.label }}
                <i class="bi bi-chevron-down dropdown-caret"></i>
              </a>
              @if (activeDropdown() === item.id) {
                <ul class="dropdown-menu">
                  @for (child of childrenOf(item.id); track child.id) {
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
              }
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
        @if (isAuthenticated()) {
          <span class="user-greeting">
            <i class="bi bi-person-circle"></i> {{ user()?.fullName }}
          </span>
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
export class NavbarComponent implements OnInit {
  private authService = inject(AuthService);
  private cmsService  = inject(CmsService);

  readonly isAuthenticated = this.authService.isAuthenticated;
  readonly isAdmin = this.authService.isAdmin;
  readonly user = this.authService.currentUser;

  private menuItems = signal<MenuItem[]>([]);
  activeDropdown = signal<number | null>(null);

  topLevel   = () => this.menuItems().filter(i => !i.parentId);
  childrenOf = (id: number) => this.menuItems().filter(i => i.parentId === id);
  hasChildren = (id: number) => this.menuItems().some(i => i.parentId === id);

  ngOnInit() { this.loadMenu(); }

  private loadMenu() {
    this.cmsService.getVisibleMenuItems().subscribe({
      next: items => this.menuItems.set(items),
      error: () => {}
    });
  }

  private closeTimer: ReturnType<typeof setTimeout> | null = null;

  openDropdown(id: number) {
    if (this.closeTimer) { clearTimeout(this.closeTimer); this.closeTimer = null; }
    this.activeDropdown.set(id);
  }

  closeDropdown() {
    this.closeTimer = setTimeout(() => { this.activeDropdown.set(null); this.closeTimer = null; }, 120);
  }

  logout() { this.authService.logout(); }
}
