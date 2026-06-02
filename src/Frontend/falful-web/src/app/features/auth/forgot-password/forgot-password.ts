import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PasswordResetService } from '../../../core/services/password-reset.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-card">
      <a routerLink="/auth/login" class="back-home"><i class="bi bi-arrow-left"></i> Back to Login</a>

      <div class="step-header">
        <div class="step-badges">
          <span class="step-badge active">1</span>
          <span class="step-line"></span>
          <span class="step-badge">2</span>
          <span class="step-line"></span>
          <span class="step-badge">3</span>
        </div>
      </div>

      <h2>Forgot Password?</h2>
      <p class="subtitle">Enter your registered email or phone number and we'll send you a verification code.</p>

      @if (error()) {
        <div class="alert alert-error">{{ error() }}</div>
      }

      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <div class="form-group">
          <label for="identifier">Email or Phone Number</label>
          <input
            id="identifier"
            type="text"
            formControlName="identifier"
            placeholder="e.g. john@email.com or 9841234567"
            autocomplete="username"
            [class.invalid]="form.controls.identifier.invalid && form.controls.identifier.touched"
          />
          @if (form.controls.identifier.invalid && form.controls.identifier.touched) {
            <span class="error-text">Please enter a valid email or phone number.</span>
          }
        </div>

        <button type="submit" class="btn-submit" [disabled]="form.invalid || loading()">
          @if (loading()) { <span class="spinner"></span> Sending OTP… }
          @else { Send Verification Code }
        </button>
      </form>

      <p class="auth-link">Remember your password? <a routerLink="/auth/login">Sign In</a></p>
    </div>
  `,
  styleUrl: '../auth-shared.scss',
})
export class ForgotPasswordComponent {
  private fb     = inject(FormBuilder);
  private svc    = inject(PasswordResetService);
  private router = inject(Router);

  loading = signal(false);
  error   = signal('');

  form = this.fb.group({
    identifier: ['', [Validators.required, Validators.minLength(5)]],
  });

  onSubmit(): void {
    if (this.form.invalid || this.loading()) return;
    const identifier = this.form.value.identifier!.trim();

    this.loading.set(true);
    this.error.set('');

    this.svc.forgotPassword(identifier).subscribe({
      next: res => {
        this.loading.set(false);
        this.svc.setFlowStep1(identifier, res);
        this.router.navigate(['/auth/verify-otp']);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Something went wrong. Please try again.');
      },
    });
  }
}
