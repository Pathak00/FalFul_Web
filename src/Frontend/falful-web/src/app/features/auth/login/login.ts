import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { HomeRouteService } from '../../../core/services/home-route.service';
import { PermissionService } from '../../../core/services/permission.service';
import { GoogleSignInButtonComponent } from '../../../shared/components/google-signin-button/google-signin-button';
import { PopDialogBoxComponent } from '../../../shared/components/PopUpConfirmationModel/popDialogBox';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, GoogleSignInButtonComponent, PopDialogBoxComponent],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class LoginComponent {
  private fb          = inject(FormBuilder);
  private authService = inject(AuthService);
  private cart        = inject(CartService);
  private homeRoute   = inject(HomeRouteService);
  private perms       = inject(PermissionService);
  private router      = inject(Router);
  private route       = inject(ActivatedRoute);

  isLoading    = signal(false);
  showDialog   = false;
  dialogMessage = '';

  form = this.fb.group({
    identifier: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(8)]]
  });

  private redirectAfterLogin(): void {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    if (returnUrl) {
      this.router.navigateByUrl(returnUrl);
    } else if (this.perms.canShop() && this.cart.itemCount() > 0) {
      this.router.navigate(['/checkout']);
    } else {
      this.router.navigate([this.homeRoute.route()]);
    }
  }

  onGoogleLogin(idToken: string): void {
    console.log('[Google] token received, length:', idToken?.length);
    this.isLoading.set(true);
    this.authService.googleLogin(idToken).subscribe({
      next: () => this.redirectAfterLogin(),
      error: (err) => {
        console.error('[Google] sign-in error — status:', err.status, 'body:', err.error);
        const msg = err.error?.message ?? err.message ?? `HTTP ${err.status}: Google sign-in failed.`;
        this.showLoginError(msg);
        this.isLoading.set(false);
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid || this.isLoading()) return;

    this.isLoading.set(true);

    this.authService.login(this.form.value as any).subscribe({
      next: () => this.redirectAfterLogin(),
      error: (err) => {
        this.showLoginError(err.error?.message ?? 'Login failed. Please try again.');
        this.isLoading.set(false);
      }
    });
  }

  private showLoginError(message: string): void {
    this.dialogMessage = message;
    this.showDialog = true;
  }
}
