import { Component, ElementRef, OnDestroy, OnInit, QueryList, ViewChildren, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PasswordResetService } from '../../../core/services/password-reset.service';

@Component({
  selector: 'app-verify-otp',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="auth-card">
      <button class="back-home" (click)="goBack()"><i class="bi bi-arrow-left"></i> Back</button>

      <div class="step-header">
        <div class="step-badges">
          <span class="step-badge done">✓</span>
          <span class="step-line active"></span>
          <span class="step-badge active">2</span>
          <span class="step-line"></span>
          <span class="step-badge">3</span>
        </div>
      </div>

      <h2>Enter Verification Code</h2>
      <p class="subtitle">
        We sent a 6-digit code to
        <strong>{{ svc.flowMasked() || 'your ' + (svc.flowChannel() === 'email' ? 'email' : 'phone') }}</strong>.
        It expires in {{ svc.flowChannel() === 'sms' ? '10' : '10' }} minutes.
      </p>

      @if (error()) {
        <div class="alert alert-error">{{ error() }}</div>
      }

      <div class="otp-boxes">
        @for (i of [0,1,2,3,4,5]; track i) {
          <input
            #otpInput
            type="text"
            inputmode="numeric"
            maxlength="1"
            class="otp-box"
            [class.filled]="digits[i]"
            [(ngModel)]="digits[i]"
            (input)="onInput(i, $event)"
            (keydown)="onKeydown(i, $event)"
            (paste)="onPaste($event)"
          />
        }
      </div>

      <button class="btn-submit" (click)="onVerify()" [disabled]="!isComplete() || loading()">
        @if (loading()) { <span class="spinner"></span> Verifying… }
        @else { Verify & Continue }
      </button>

      <div class="resend-row">
        @if (resendCooldown() > 0) {
          <span class="resend-disabled">Resend code in {{ resendCooldown() }}s</span>
        } @else {
          <button class="btn-link" (click)="onResend()" [disabled]="resending()">
            {{ resending() ? 'Sending…' : 'Resend Code' }}
          </button>
        }
      </div>
    </div>
  `,
  styleUrl: '../auth-shared.scss',
})
export class VerifyOtpComponent implements OnInit, OnDestroy {
  @ViewChildren('otpInput') otpInputs!: QueryList<ElementRef<HTMLInputElement>>;

  readonly svc    = inject(PasswordResetService);
  private  router = inject(Router);

  digits:   string[] = ['', '', '', '', '', ''];
  loading   = signal(false);
  resending = signal(false);
  error     = signal('');
  resendCooldown = signal(0);

  private cooldownTimer?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    // Guard: if no flow in progress, redirect to step 1
    if (!this.svc.flowIdentifier()) {
      this.router.navigate(['/auth/forgot-password']);
      return;
    }
    this.startCooldown(45);
  }

  ngOnDestroy(): void {
    clearInterval(this.cooldownTimer);
  }

  isComplete(): boolean {
    return this.digits.every(d => d.length === 1);
  }

  onInput(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const val   = input.value.replace(/\D/g, '').slice(-1);
    this.digits[index] = val;
    input.value = val;
    if (val && index < 5) {
      this.focusBox(index + 1);
    }
  }

  onKeydown(index: number, event: KeyboardEvent): void {
    if (event.key === 'Backspace' && !this.digits[index] && index > 0) {
      this.focusBox(index - 1);
    }
  }

  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const text = event.clipboardData?.getData('text')?.replace(/\D/g, '') ?? '';
    text.slice(0, 6).split('').forEach((c, i) => { this.digits[i] = c; });
    const next = Math.min(text.length, 5);
    setTimeout(() => this.focusBox(next), 0);
  }

  private focusBox(index: number): void {
    const el = this.otpInputs.get(index)?.nativeElement;
    el?.focus();
    el?.select();
  }

  onVerify(): void {
    if (!this.isComplete() || this.loading()) return;
    const otp = this.digits.join('');
    this.loading.set(true);
    this.error.set('');

    this.svc.verifyOtp(this.svc.flowIdentifier(), otp).subscribe({
      next: res => {
        this.loading.set(false);
        this.svc.setFlowStep2(res.resetToken);
        this.router.navigate(['/auth/reset-password']);
      },
      error: err => {
        this.loading.set(false);
        this.error.set(err.error?.message ?? 'Invalid OTP. Please try again.');
        this.digits = ['', '', '', '', '', ''];
        setTimeout(() => this.focusBox(0), 50);
      },
    });
  }

  onResend(): void {
    if (this.resendCooldown() > 0 || this.resending()) return;
    this.resending.set(true);
    this.error.set('');
    this.digits = ['', '', '', '', '', ''];

    this.svc.forgotPassword(this.svc.flowIdentifier()).subscribe({
      next: res => {
        this.resending.set(false);
        this.svc.setFlowStep1(this.svc.flowIdentifier(), res);
        this.startCooldown(60);
        setTimeout(() => this.focusBox(0), 50);
      },
      error: () => {
        this.resending.set(false);
        this.error.set('Could not resend code. Please try again.');
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/auth/forgot-password']);
  }

  private startCooldown(seconds: number): void {
    clearInterval(this.cooldownTimer);
    this.resendCooldown.set(seconds);
    this.cooldownTimer = setInterval(() => {
      const next = this.resendCooldown() - 1;
      this.resendCooldown.set(next);
      if (next <= 0) clearInterval(this.cooldownTimer);
    }, 1000);
  }
}
