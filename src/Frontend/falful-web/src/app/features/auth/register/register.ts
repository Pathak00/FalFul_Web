import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { GoogleSignInButtonComponent } from '../../../shared/components/google-signin-button/google-signin-button';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, GoogleSignInButtonComponent],
  templateUrl: './register.html',
  styleUrl: './register.scss'
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  isLoading = signal(false);
  errorMessage = signal('');

  form = this.fb.group({
    fullName: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.email]],
    phoneNumber: [''],
    password: ['', [Validators.minLength(8)]]
  });

  onGoogleSignUp(idToken: string): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.authService.googleLogin(idToken).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.errorMessage.set(err.error?.message ?? 'Google sign-up failed.');
        this.isLoading.set(false);
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid || this.isLoading()) return;

    const { email, phoneNumber } = this.form.value;
    if (!email && !phoneNumber) {
      this.errorMessage.set('Please provide an email or phone number.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.authService.register(this.form.value as any).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.errorMessage.set(err.error?.message ?? 'Registration failed. Please try again.');
        this.isLoading.set(false);
      }
    });
  }
}
