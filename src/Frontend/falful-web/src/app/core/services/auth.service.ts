import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import {
  AuthResponse,
  LoginRequest,
  RegisterOrganizationRequest,
  RegisterUserRequest,
  UserInfo,
} from '../models/auth.models';
import { ApiService } from './api.service';
import { CartService } from './cart.service';

const ACCESS_TOKEN_KEY = 'falful_access_token';
const REFRESH_TOKEN_KEY = 'falful_refresh_token';
const USER_KEY = 'falful_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _currentUser = signal<UserInfo | null>(this.loadUser());
  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated = computed(() => !!this._currentUser());

  constructor(private api: ApiService, private router: Router, private cart: CartService) {}

  register(dto: RegisterUserRequest): Observable<AuthResponse> {
    return this.api.post<AuthResponse>('/api/auth/register', dto).pipe(
      tap(res => this.persistSession(res))
    );
  }

  registerOrganization(dto: RegisterOrganizationRequest): Observable<AuthResponse> {
    return this.api.post<AuthResponse>('/api/auth/register-organization', dto).pipe(
      tap(res => this.persistSession(res))
    );
  }

  login(dto: LoginRequest): Observable<AuthResponse> {
    return this.api.post<AuthResponse>('/api/auth/login', dto).pipe(
      tap(res => this.persistSession(res))
    );
  }

  googleLogin(idToken: string): Observable<AuthResponse> {
    return this.api.post<AuthResponse>('/api/auth/google', { idToken }).pipe(
      tap(res => this.persistSession(res))
    );
  }

  logout(): void {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (refreshToken) {
      this.api.post('/api/auth/logout', { refreshToken }).subscribe();
    }
    this.clearSession({ clearCart: true });
    this.router.navigate(['/auth/login']);
  }

  /** Called by the auth interceptor when a token refresh fails silently.
   *  Does NOT clear the cart so a guest's pre-login cart survives. */
  silentLogout(): void {
    this.clearSession({ clearCart: false });
    this.router.navigate(['/auth/login']);
  }

  refreshToken(): Observable<AuthResponse> {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY) ?? '';
    return this.api.post<AuthResponse>('/api/auth/refresh', { refreshToken }).pipe(
      tap(res => this.persistSession(res))
    );
  }

  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  private persistSession(res: AuthResponse): void {
    const previous = this._currentUser();
    localStorage.setItem(ACCESS_TOKEN_KEY, res.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, res.refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    this._currentUser.set(res.user);
    // Clear the cart only when a DIFFERENT user logs in to prevent
    // one user's cart from leaking into another user's session.
    // Guest → user and same-user re-login both preserve the cart.
    if (previous && previous.id !== res.user.id) {
      this.cart.clearCart();
    }
  }

  private clearSession(opts: { clearCart: boolean } = { clearCart: true }): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this._currentUser.set(null);
    if (opts.clearCart) this.cart.clearCart();
  }

  private loadUser(): UserInfo | null {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  }
}
