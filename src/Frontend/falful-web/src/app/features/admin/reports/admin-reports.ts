import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../../core/services/order.service';
import {
  DeliveryReport, OrderReport,
  DELIVERY_FAILURE_REASONS, DELIVERY_STATUSES, PAYMENT_METHODS, ORDER_STATUSES,
} from '../../../core/models/order.models';

@Component({
  selector: 'app-admin-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['../admin-shared.scss', './admin-reports.scss'],
  templateUrl: './admin-reports.html'
})
export class AdminReportsComponent implements OnInit {
  private svc = inject(OrderService);

  delivery = signal<DeliveryReport | null>(null);
  orders   = signal<OrderReport | null>(null);
  loading  = signal(false);

  fromDate = '';
  toDate   = '';

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    const f = this.fromDate || undefined;
    const t = this.toDate   || undefined;
    let done = 0;
    const finish = () => { if (++done === 2) this.loading.set(false); };

    this.svc.getDeliveryReport(f, t).subscribe({ next: r => { this.delivery.set(r); finish(); }, error: () => finish() });
    this.svc.getOrderReport(f, t).subscribe({ next: r => { this.orders.set(r);   finish(); }, error: () => finish() });
  }

  failureReasonLabel(n: number) { return DELIVERY_FAILURE_REASONS[n] ?? 'Unknown'; }
  dStatusLabel(n: number)       { return DELIVERY_STATUSES[n]?.label ?? 'Unknown'; }
  dStatusColor(n: number)       { return DELIVERY_STATUSES[n]?.color ?? '#6b7280'; }
  dStatusBg(n: number)          { return (DELIVERY_STATUSES[n]?.color ?? '#6b7280') + '1a'; }
  oStatusLabel(n: number)       { return ORDER_STATUSES[n]?.label ?? 'Unknown'; }
  oStatusColor(n: number)       { return ORDER_STATUSES[n]?.color ?? '#6b7280'; }
  oStatusBg(n: number)          { return (ORDER_STATUSES[n]?.color ?? '#6b7280') + '1a'; }
  paymentLabel(n: number)       { return PAYMENT_METHODS[n] ?? 'Unknown'; }
}
