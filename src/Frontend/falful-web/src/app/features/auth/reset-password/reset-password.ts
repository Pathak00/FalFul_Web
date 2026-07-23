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
  templateUrl: './reset-password.html',
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
