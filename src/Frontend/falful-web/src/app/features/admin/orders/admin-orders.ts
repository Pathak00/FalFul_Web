import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../../core/services/order.service';
import { OrderSummary, OrderDetail, ORDER_STATUSES, PAYMENT_METHODS } from '../../../core/models/order.models';

interface BowlDetails {
  container: string;
  totalGrams?: number;
  containerFee?: number;
  fruits: { productId: number; name: string; grams: number; price?: number }[];
}

const STATUS_OPTS = [
  { value: 0, label: 'All'                },
  { value: 1, label: 'Pending'            },
  { value: 2, label: 'Confirmed'          },
  { value: 3, label: 'Preparing'          },
  { value: 4, label: 'Ready for Delivery' },
  { value: 5, label: 'Cancelled'          },
  { value: 6, label: 'Rejected'           },
];

// Actions available per status — Cancel(5) and Reject(6) require a reason modal.
const NEXT_STATUS: Record<number, { value: number; label: string; needsReason: boolean }[]> = {
  1: [
    { value: 2, label: 'Confirm',            needsReason: false },
    { value: 6, label: 'Reject',             needsReason: true  },
    { value: 5, label: 'Cancel',             needsReason: true  },
  ],
  2: [
    { value: 3, label: 'Start Preparing',    needsReason: false },
    { value: 5, label: 'Cancel',             needsReason: true  },
  ],
  3: [
    { value: 4, label: 'Ready for Delivery', needsReason: false },
  ],
  // 4=ReadyForDelivery: order is now in the Deliveries module — no order actions
};

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  styleUrl: '../admin-shared.scss',
  templateUrl: './admin-orders.html'
})
export class AdminOrdersComponent implements OnInit {
  private svc = inject(OrderService);

  orders       = signal<OrderSummary[]>([]);
  loading      = signal(true);
  saving       = signal(false);
  statusFilter = signal(0);
  detail       = signal<OrderDetail | null>(null);

  pendingAction = signal<{ orderId: number; value: number; label: string } | null>(null);
  actionReason  = '';

  readonly statusOpts = STATUS_OPTS;

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    const s = this.statusFilter() || undefined;
    this.svc.getAllOrders(s).subscribe({
      next: list => { this.orders.set(list); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  setFilter(v: number) { this.statusFilter.set(v); this.load(); }

  viewDetail(id: number) {
    this.svc.adminGetOrderById(id).subscribe({ next: d => this.detail.set(d) });
  }

  nextActions(s: number): { value: number; label: string; needsReason: boolean }[] {
    return NEXT_STATUS[s] ?? [];
  }

  initiateAction(orderId: number, statusValue: number, label: string, needsReason: boolean) {
    if (needsReason) {
      this.actionReason = '';
      this.pendingAction.set({ orderId, value: statusValue, label });
    } else {
      this.doUpdate(orderId, statusValue);
    }
  }

  confirmAction() {
    const a = this.pendingAction();
    if (!a || !this.actionReason.trim()) return;
    this.saving.set(true);
    this.svc.updateOrderStatus(a.orderId, a.value, this.actionReason.trim()).subscribe({
      next: () => {
        this.pendingAction.set(null);
        this.saving.set(false);
        this.load();
        // Close detail modal if open for this order
        if (this.detail()?.id === a.orderId) this.detail.set(null);
      },
      error: () => this.saving.set(false),
    });
  }

  private doUpdate(orderId: number, statusValue: number) {
    this.svc.updateOrderStatus(orderId, statusValue).subscribe({ next: () => this.load() });
  }

  parseBowlDetails(json?: string): BowlDetails | null {
    if (!json) return null;
    try { return JSON.parse(json) as BowlDetails; }
    catch { return null; }
  }

  bowlTotalGrams(bowl: BowlDetails): number {
    return bowl.totalGrams ?? bowl.fruits.reduce((s, f) => s + f.grams, 0);
  }

  statusLabel(s: number): string { return ORDER_STATUSES[s]?.label ?? 'Unknown'; }
  statusColor(s: number): string { return ORDER_STATUSES[s]?.color ?? '#6b7280'; }
  statusBg(s: number): string    { return (ORDER_STATUSES[s]?.color ?? '#6b7280') + '1a'; }
  paymentLabel(m: number): string { return PAYMENT_METHODS[m] ?? 'Unknown'; }
}
