import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PasswordResetService } from '../../../core/services/password-reset.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.html',
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
