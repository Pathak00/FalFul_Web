import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { OrderService } from '../../../core/services/order.service';
import { PaymentService } from '../../../core/services/payment.service';
import { ImageUrlService } from '../../../core/services/image-url.service';
import { ToastService } from '../../../core/services/toast.service';
import { OrderDetail, ORDER_STATUSES, DELIVERY_STATUSES, PAYMENT_METHODS } from '../../../core/models/order.models';
import { PaymentDto } from '../../../core/models/payment.models';
import { ReceiptService } from '../../../core/services/receipt.service';

interface BowlDetails {
  container: string;
  totalGrams?: number;
  containerFee?: number;
  serviceFee?: number;
  fruits: { productId: number; name: string; grams: number; price?: number }[];
}

const ORDER_STEPS = [
  { status: 1, label: 'Order Placed',       icon: 'bi-bag-check'    },
  { status: 2, label: 'Confirmed',          icon: 'bi-check-circle' },
  { status: 3, label: 'Preparing',          icon: 'bi-gear'         },
  { status: 4, label: 'Ready for Delivery', icon: 'bi-box-seam'     },
];

const DELIVERY_STEPS = [
  { status: 1, label: 'Awaiting Rider',   icon: 'bi-calendar-check' },
  { status: 2, label: 'Rider Assigned',   icon: 'bi-person-check'   },
  { status: 3, label: 'Picked Up',        icon: 'bi-box-seam'       },
  { status: 4, label: 'Out for Delivery', icon: 'bi-bicycle'        },
  { status: 5, label: 'Delivered',        icon: 'bi-house-check'    },
];

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './order-detail.html',
  
  styleUrl: './order-detail.scss'
})
export class OrderDetailComponent implements OnInit {
  private svc        = inject(OrderService);
  private paySvc     = inject(PaymentService);
  private route      = inject(ActivatedRoute);
  private toast      = inject(ToastService);
  private receiptSvc = inject(ReceiptService);
  protected imgSvc   = inject(ImageUrlService);

  order            = signal<OrderDetail | null>(null);
  payments         = signal<PaymentDto[]>([]);
  loading          = signal(true);
  cancelling       = signal(false);
  payingNow        = signal(false);
  submittingRating = signal(false);
  ratingSubmitted  = signal(false);
  cancelPolicy     = signal<string>('');
  cancelModalOpen  = signal(false);
  cancelReason     = '';

  readonly orderSteps    = ORDER_STEPS;
  readonly deliverySteps = DELIVERY_STEPS;

  ratingForm = {
    overallRating:        0,
    deliveryRating:       undefined as number | undefined,
    productQualityRating: undefined as number | undefined,
    comment:              '',
    receiptAcknowledged:  false
  };

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.svc.getOrderById(id).subscribe({
      next: o  => { this.order.set(o); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
    this.paySvc.getPaymentsByOrder(id).subscribe({
      next: list => this.payments.set(list),
      error: ()  => {}
    });
    this.svc.getSetting('cancellation_policy_text').subscribe({
      next: s => this.cancelPolicy.set(s.value),
      error: () => {}
    });
  }

  canCancel(): boolean {
    return this.order()?.status === 1;
  }

  payNow(): void {
    const o = this.order();
    if (!o) return;
    const pending = this.payments().find(p => p.status === 1 && p.paymentMethodCode !== 'cod');
    if (!pending) { this.toast.error('No pending payment found.'); return; }

    const gateway = pending.paymentMethodCode ?? 'esewa';
    const base    = window.location.origin;
    this.payingNow.set(true);
    this.paySvc.initiatePayment(o.id, {
      paymentMethodId: pending.paymentMethodId,
      returnUrl:  `${base}/payment/callback?gateway=${gateway}`,
      failureUrl: `${base}/payment/callback?gateway=${gateway}&status=failed`,
    }).subscribe({
      next: r => {
        this.payingNow.set(false);
        if (r.formFields && r.redirectUrl) {
          this.submitGatewayForm(r.redirectUrl, r.formFields);
        } else if (r.redirectUrl) {
          window.location.href = r.redirectUrl;
        }
      },
      error: (e: any) => {
        this.payingNow.set(false);
        this.toast.error(e?.error?.message ?? 'Payment initiation failed.');
      }
    });
  }

  private submitGatewayForm(action: string, fields: Record<string, string>): void {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = action;
    Object.entries(fields).forEach(([k, v]) => {
      const input = document.createElement('input');
      input.type = 'hidden'; input.name = k; input.value = v;
      form.appendChild(input);
    });
    document.body.appendChild(form);
    form.submit();
  }

  executeCancelOrder(): void {
    const id = this.order()?.id;
    if (!id || !this.cancelReason.trim()) return;
    const reason = this.cancelReason.trim();
    this.cancelling.set(true);
    this.svc.cancelOrder(id, reason).subscribe({
      next: () => {
        this.order.update(o => o ? { ...o, status: 5, cancelReason: reason } : o);
        this.cancelling.set(false);
        this.cancelModalOpen.set(false);
        this.cancelReason = '';
      },
      error: (e: { error?: { message?: string } }) => {
        this.cancelling.set(false);
        this.toast.error(e?.error?.message ?? 'Failed to cancel order.');
      }
    });
  }

  openPrintReceipt(): void {
    const id = this.order()?.id;
    if (!id) return;
    window.open(`/orders/${id}/receipt`, '_blank');
    this.receiptSvc.logPrint(id, { role: 'Customer' }).subscribe({ error: () => {} });
  }

  submitRating(): void {
    const id = this.order()?.id;
    if (!id || this.ratingForm.overallRating === 0) return;
    this.submittingRating.set(true);
    this.svc.submitRating(id, {
      overallRating:        this.ratingForm.overallRating,
      deliveryRating:       this.ratingForm.deliveryRating,
      productQualityRating: this.ratingForm.productQualityRating,
      comment:              this.ratingForm.comment || undefined,
      receiptAcknowledged:  this.ratingForm.receiptAcknowledged
    }).subscribe({
      next: () => { this.ratingSubmitted.set(true); this.submittingRating.set(false); },
      error: () => this.submittingRating.set(false)
    });
  }

  parseBowlDetails(json?: string): BowlDetails | null {
    if (!json) return null;
    try { return JSON.parse(json) as BowlDetails; }
    catch { return null; }
  }

  bowlTotalGrams(bowl: BowlDetails): number {
    return bowl.totalGrams ?? bowl.fruits.reduce((s, f) => s + f.grams, 0);
  }

  paymentMethodLabel(m: number): string { return PAYMENT_METHODS[m] ?? 'Unknown'; }

  paymentStatusLabel(o: OrderDetail): string {
    if (o.paymentMethod === 1) {
      return o.paymentStatus === 2 ? 'Paid (Cash)' : 'Collect on Delivery';
    }
    switch (o.paymentStatus) {
      case 2:  return 'Paid';
      case 3:  return 'Payment Failed';
      case 4:  return 'Refunded';
      case 5:  return 'Cancelled';
      default: return 'Payment Pending';
    }
  }

  paymentStatusColor(o: OrderDetail): string {
    if (o.paymentMethod === 1) {
      return o.paymentStatus === 2 ? '#22c55e' : '#6b7280';
    }
    switch (o.paymentStatus) {
      case 2:  return '#22c55e';
      case 3:  return '#ef4444';
      case 4:  return '#8b5cf6';
      case 5:  return '#9ca3af';
      default: return '#f59e0b';
    }
  }

  paymentStatusClass(status: number): string {
    return { 1: 'pstatus-pending', 2: 'pstatus-completed', 3: 'pstatus-failed', 4: 'pstatus-refunded' }[status] ?? 'pstatus-pending';
  }

  orderStatusLabel(s: number): string  { return ORDER_STATUSES[s]?.label    ?? 'Unknown'; }
  orderStatusColor(s: number): string  { return ORDER_STATUSES[s]?.color    ?? '#6b7280'; }
  orderStatusBg(s: number):    string  { return (ORDER_STATUSES[s]?.color   ?? '#6b7280') + '1a'; }
  deliveryStatusColor(s: number): string { return DELIVERY_STATUSES[s]?.color ?? '#94a3b8'; }
  deliveryStatusIcon(s: number):  string { return DELIVERY_STATUSES[s]?.icon  ?? 'bi-truck'; }
}
