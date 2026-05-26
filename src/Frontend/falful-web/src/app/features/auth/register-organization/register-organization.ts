import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register-organization',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register-organization.html',
  styleUrl: './register-organization.scss'
})
export class RegisterOrganizationComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  isLoading = signal(false);
  errorMessage = signal('');

  readonly orgTypes = ['Gym', 'Cafe', 'Restaurant', 'Office', 'Store', 'Hotel', 'School', 'Other'];

  form = this.fb.group({
    ownerFullName: ['', [Validators.required, Validators.maxLength(100)]],
    ownerEmail: ['', [Validators.required, Validators.email]],
    ownerPhone: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    organizationName: ['', [Validators.required, Validators.maxLength(150)]],
    organizationType: ['', [Validators.required]],
    organizationDescription: [''],
    address: ['']
  });

  onSubmit(): void {
    if (this.form.invalid || this.isLoading()) return;

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.authService.registerOrganization(this.form.value as any).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.errorMessage.set(err.error?.message ?? 'Registration failed. Please try again.');
        this.isLoading.set(false);
      }
    });
  }
}
