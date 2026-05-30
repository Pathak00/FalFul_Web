import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PaymentService } from '../../core/services/payment.service';

@Component({
  selector: 'app-payment-callback',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="cb-page">
      @if (status() === 'verifying') {
        <div class="cb-card">
          <div class="cb-spinner"></div>
          <h2>Verifying payment…</h2>
          <p>Please wait while we confirm your payment.</p>
        </div>
      } @else if (status() === 'success') {
        <div class="cb-card cb-success">
          <i class="bi bi-check-circle-fill cb-icon"></i>
          <h2>Payment Successful!</h2>
          <p>Your payment has been verified. Your order is being processed.</p>
          <a routerLink="/orders" class="cb-btn-primary">View My Orders</a>
        </div>
      } @else {
        <div class="cb-card cb-fail">
          <i class="bi bi-x-circle-fill cb-icon"></i>
          <h2>Payment Failed</h2>
          <p>{{ errorMsg() || 'Your payment could not be verified. Please try again or contact support.' }}</p>
          <div class="cb-actions">
            <a routerLink="/orders" class="cb-btn-secondary">My Orders</a>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .cb-page {
      min-height: 80vh; display: flex; align-items: center; justify-content: center;
      padding: 2rem 1rem;
    }
    .cb-card {
      background: #fff; border: 1px solid #e2e8f0; border-radius: 16px;
      padding: 2.5rem 2rem; max-width: 440px; width: 100%;
      text-align: center; box-shadow: 0 4px 24px rgba(0,0,0,.07);
      h2 { font-size: 1.35rem; font-weight: 800; color: #0f172a; margin: .75rem 0 .4rem; }
      p  { color: #64748b; font-size: .9rem; line-height: 1.5; margin: 0 0 1.5rem; }
    }
    .cb-spinner {
      width: 52px; height: 52px; margin: 0 auto .75rem;
      border: 4px solid #e2e8f0; border-top-color: #16a34a;
      border-radius: 50%; animation: spin .8s linear infinite;
    }
    .cb-icon { font-size: 3.5rem; display: block; margin-bottom: .5rem; }
    .cb-success .cb-icon { color: #16a34a; }
    .cb-fail    .cb-icon { color: #dc2626; }

    .cb-btn-primary {
      display: inline-block; background: #16a34a; color: #fff;
      padding: .6rem 1.75rem; border-radius: 8px; font-weight: 700;
      text-decoration: none; font-size: .95rem;
      transition: background .15s;
      &:hover { background: #15803d; }
    }
    .cb-btn-secondary {
      display: inline-block; background: #f1f5f9; color: #334155;
      padding: .6rem 1.75rem; border-radius: 8px; font-weight: 600;
      text-decoration: none; font-size: .9rem;
      transition: background .15s;
      &:hover { background: #e2e8f0; }
    }
    .cb-actions { display: flex; gap: .75rem; justify-content: center; flex-wrap: wrap; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class PaymentCallbackComponent implements OnInit {
  private route  = inject(ActivatedRoute);
  private router = inject(Router);
  private paySvc = inject(PaymentService);

  status   = signal<'verifying' | 'success' | 'failed'>('verifying');
  errorMsg = signal('');

  ngOnInit() {
    const params  = this.route.snapshot.queryParamMap;
    const gateway = params.get('gateway') ?? this.detectGateway(params);

    if (gateway === 'esewa') {
      const data = params.get('data');
      if (!data) { this.fail('Missing eSewa payment data.'); return; }
      this.paySvc.verifyEsewa(data).subscribe({
        next:  () => this.success(),
        error: (e: { error?: { message?: string } }) => this.fail(e?.error?.message),
      });
    } else if (gateway === 'khalti') {
      const pidx      = params.get('pidx');
      const paymentId = params.get('payment_id');
      if (!pidx) { this.fail('Missing Khalti payment token.'); return; }
      this.paySvc.verifyKhalti(pidx, paymentId ?? undefined).subscribe({
        next:  () => this.success(),
        error: (e: { error?: { message?: string } }) => this.fail(e?.error?.message),
      });
    } else {
      this.fail('Unknown payment gateway callback.');
    }
  }

  private detectGateway(params: import('@angular/router').ParamMap): string {
    if (params.has('data'))  return 'esewa';
    if (params.has('pidx'))  return 'khalti';
    return '';
  }

  private success() { this.status.set('success'); }
  private fail(msg?: string) {
    this.errorMsg.set(msg ?? '');
    this.status.set('failed');
  }
}
