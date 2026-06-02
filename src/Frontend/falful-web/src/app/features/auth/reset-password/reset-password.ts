import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PasswordResetService } from '../../../core/services/password-reset.service';

function passwordsMatch(group: import('@angular/forms').AbstractControl) {
  const pw  = group.get('newPassword')?.value;
  const cpw = group.get('confirmPassword')?.value;
  return pw && cpw && pw !== cpw ? { mismatch: true } : null;
}

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-card">
      <div class="step-header">
        <div class="step-badges">
          <span class="step-badge done">✓</span>
          <span class="step-line active"></span>
          <span class="step-badge done">✓</span>
          <span class="step-line active"></span>
          <span class="step-badge active">3</span>
        </div>
      </div>

      <h2>Set New Password</h2>
      <p class="subtitle">Choose a strong password with at least 8 characters.</p>

      @if (error()) {
        <div class="alert alert-error">{{ error() }}</div>
      }
      @if (success()) {
        <div class="alert alert-success">
          <i class="bi bi-check-circle-fill"></i>
          {{ success() }}
        </div>
        <a routerLink="/auth/login" class="btn-submit" style="display:block;text-align:center;margin-top:.5rem">
          Go to Login
        </a>
      } @else {
        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="newPassword">New Password</label>
            <div class="input-with-toggle">
              <input
                id="newPassword"
                [type]="showPw() ? 'text' : 'password'"
                formControlName="newPassword"
                placeholder="At least 8 characters"
                autocomplete="new-password"
                [class.invalid]="form.controls.newPassword.invalid && form.controls.newPassword.touched"
              />
              <button type="button" class="toggle-pw" (click)="showPw.set(!showPw())">
                <i class="bi {{ showPw() ? 'bi-eye-slash' : 'bi-eye' }}"></i>
              </button>
            </div>
            @if (form.controls.newPassword.invalid && form.controls.newPassword.touched) {
              <span class="error-text">Password must be at least 8 characters.</span>
            }
          </div>

          <div class="form-group">
            <label for="confirmPassword">Confirm Password</label>
            <div class="input-with-toggle">
              <input
                id="confirmPassword"
                [type]="showCpw() ? 'text' : 'password'"
                formControlName="confirmPassword"
                placeholder="Repeat your password"
                autocomplete="new-password"
                [class.invalid]="form.controls.confirmPassword.touched && form.hasError('mismatch')"
              />
              <button type="button" class="toggle-pw" (click)="showCpw.set(!showCpw())">
                <i class="bi {{ showCpw() ? 'bi-eye-slash' : 'bi-eye' }}"></i>
              </button>
            </div>
            @if (form.controls.confirmPassword.touched && form.hasError('mismatch')) {
              <span class="error-text">Passwords do not match.</span>
            }
          </div>

          <button type="submit" class="btn-submit" [disabled]="form.invalid || loading()">
            @if (loading()) { <span class="spinner"></span> Saving… }
            @else { Reset Password }
          </button>
        </form>
      }
    </div>
  `,
  styleUrl: '../auth-shared.scss',
})
export class ResetPasswordComponent {
  private fb     = inject(FormBuilder);
  private svc    = inject(PasswordResetService);
  private router = inject(Router);

  loading = signal(false);
  error   = signal('');
  success = signal('');
  showPw  = signal(false);
  showCpw = signal(false);

  form = this.fb.group(
    {
      newPassword:     ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordsMatch }
  );

  constructor() {
    // Guard: must have a valid reset token in memory
    if (!this.svc.flowResetToken()) {
      this.router.navigate(['/auth/forgot-password']);
    }
  }

  onSubmit(): void {
    if (this.form.invalid || this.loading()) return;
    const { newPassword, confirmPassword } = this.form.value;

    this.loading.set(true);
    this.error.set('');

    this.svc
      .resetPassword(this.svc.flowResetToken(), newPassword!, confirmPassword!)
      .subscribe({
        next: res => {
          this.loading.set(false);
          this.success.set(res.message ?? 'Password reset successfully!');
          this.svc.clearFlow();
          setTimeout(() => this.router.navigate(['/auth/login']), 2500);
        },
        error: err => {
          this.loading.set(false);
          this.error.set(err.error?.message ?? 'Failed to reset password. Please try again.');
        },
      });
  }
}
