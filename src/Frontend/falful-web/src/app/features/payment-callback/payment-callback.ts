import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PaymentService } from '../../core/services/payment.service';

@Component({
  selector: 'app-payment-callback',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './payment-callback.html',
  styleUrl: './payment-callback.scss'
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
