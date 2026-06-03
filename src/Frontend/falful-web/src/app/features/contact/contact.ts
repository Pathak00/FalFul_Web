import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';

interface ContactForm {
  name:    string;
  email:   string;
  phone:   string;
  subject: string;
  message: string;
}

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './contact.html',
  styleUrl: './contact.scss',
})
export class ContactComponent {
  private api = inject(ApiService);

  form: ContactForm = { name: '', email: '', phone: '', subject: '', message: '' };

  submitting = signal(false);
  submitted  = signal(false);
  error      = signal<string | null>(null);

  subjects = [
    'General Inquiry',
    'Order Support',
    'Delivery Issue',
    'Product Feedback',
    'Partnership / Business',
    'Other',
  ];

  submit(): void {
    this.error.set(null);
    this.submitting.set(true);

    this.api.post<{ message: string }>('/api/contact', this.form).subscribe({
      next: () => {
        this.submitting.set(false);
        this.submitted.set(true);
      },
      error: (e: { error?: { message?: string } }) => {
        this.submitting.set(false);
        this.error.set(e?.error?.message ?? 'Something went wrong. Please try again.');
      },
    });
  }

  reset(): void {
    this.form = { name: '', email: '', phone: '', subject: '', message: '' };
    this.submitted.set(false);
    this.error.set(null);
  }
}
