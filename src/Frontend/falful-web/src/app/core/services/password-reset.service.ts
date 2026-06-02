import { Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface ForgotPasswordResponse {
  maskedDestination: string;
  channel: string;        // 'email' | 'sms'
  expiresInMinutes: number;
}

export interface VerifyOtpResponse {
  resetToken: string;
  expiresInMinutes: number;
}

@Injectable({ providedIn: 'root' })
export class PasswordResetService {
  constructor(private api: ApiService) {}

  // In-memory flow state — never touches localStorage
  readonly flowIdentifier   = signal('');
  readonly flowChannel      = signal('');
  readonly flowMasked       = signal('');
  readonly flowResetToken   = signal('');

  setFlowStep1(identifier: string, res: ForgotPasswordResponse): void {
    this.flowIdentifier.set(identifier);
    this.flowChannel.set(res.channel);
    this.flowMasked.set(res.maskedDestination);
    this.flowResetToken.set('');
  }

  setFlowStep2(resetToken: string): void {
    this.flowResetToken.set(resetToken);
  }

  clearFlow(): void {
    this.flowIdentifier.set('');
    this.flowChannel.set('');
    this.flowMasked.set('');
    this.flowResetToken.set('');
  }

  forgotPassword(identifier: string): Observable<ForgotPasswordResponse> {
    return this.api.post<ForgotPasswordResponse>('/api/auth/forgot-password', { identifier });
  }

  verifyOtp(identifier: string, otp: string): Observable<VerifyOtpResponse> {
    return this.api.post<VerifyOtpResponse>('/api/auth/verify-otp', { identifier, otp });
  }

  resetPassword(resetToken: string, newPassword: string, confirmPassword: string): Observable<{ message: string }> {
    return this.api.post<{ message: string }>('/api/auth/reset-password', {
      resetToken, newPassword, confirmPassword,
    });
  }
}
