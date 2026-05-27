import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../../core/services/order.service';
import { OrderSummary, OrderDetail, ORDER_STATUSES, PAYMENT_METHODS } from '../../../core/models/order.models';

const STATUS_OPTS = [
  { value: 0,  label: 'All'              },
  { value: 1,  label: 'Pending'          },
  { value: 2,  label: 'Confirmed'        },
  { value: 3,  label: 'Processing'       },
  { value: 4,  label: 'Out for Delivery' },
  { value: 5,  label: 'Delivered'        },
  { value: 6,  label: 'Cancelled'        },
];

const NEXT_STATUS: Record<number, { value: number; label: string }[]> = {
  1: [{ value: 2, label: 'Confirm' }, { value: 6, label: 'Cancel' }],
  2: [{ value: 3, label: 'Mark Processing' }, { value: 6, label: 'Cancel' }],
  3: [{ value: 4, label: 'Out for Delivery' }],
  4: [{ value: 5, label: 'Mark Delivered' }],
};

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  styleUrl: '../admin-shared.scss',
  template: `
    <div class="admin-page">
      <div class="page-header">
        <div>
          <h1>Orders</h1>
          <p class="page-sub">Manage all customer orders. Update status, view details, and track deliveries.</p>
        </div>
      </div>

      <!-- Status filter -->
      <div class="filter-bar">
        @for (opt of statusOpts; track opt.value) {
          <button class="filter-btn" [class.active]="statusFilter() === opt.value"
                  (click)="setFilter(opt.value)">
            {{ opt.label }}
          </button>
        }
      </div>

      @if (loading()) {
        <div class="empty-state"><div class="skeleton-row" *ngFor="let i of [1,2,3,4,5]"></div></div>
      } @else if (orders().length === 0) {
        <div class="empty-state">
          <i class="bi bi-bag-x" style="font-size:2.5rem;color:#d1d5db"></i>
          <p style="color:#9ca3af;margin:.5rem 0">No orders found.</p>
        </div>
      } @else {
        <div class="data-table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Delivery</th>
                <th>Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (o of orders(); track o.id) {
                <tr>
                  <td><span class="order-num">{{ o.orderNumber }}</span></td>
                  <td>
                    <div style="font-size:.8rem;font-weight:600;color:#111">{{ o.city }}</div>
                    <div style="font-size:.72rem;color:#9ca3af">{{ o.itemCount }} item{{ o.itemCount > 1 ? 's' : '' }}</div>
                  </td>
                  <td style="font-size:.78rem;color:#6b7280">{{ o.createdAt | date:'dd MMM, h:mm a' }}</td>
                  <td style="font-size:.78rem;color:#6b7280">{{ o.deliveryDate | date:'dd MMM' }}<br>{{ o.deliveryTimeSlot }}</td>
                  <td style="font-weight:700;font-size:.875rem">Rs. {{ o.totalAmount | number:'1.0-0' }}</td>
                  <td>
                    <span class="status-badge" [style.background]="statusBg(o.status)" [style.color]="statusColor(o.status)">
                      {{ statusLabel(o.status) }}
                    </span>
                  </td>
                  <td>
                    <div style="display:flex;gap:.4rem;flex-wrap:wrap">
                      <button class="tbl-btn" (click)="viewDetail(o.id)">
                        <i class="bi bi-eye"></i>
                      </button>
                      @for (ns of nextActions(o.status); track ns.value) {
                        <button class="tbl-btn tbl-btn-action" (click)="updateStatus(o.id, ns.value)">
                          {{ ns.label }}
                        </button>
                      }
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>

    <!-- Detail modal -->
    @if (detail()) {
      <div class="modal-overlay" (click)="detail.set(null)">
        <div class="modal-box wide-modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>{{ detail()!.orderNumber }}</h3>
            <button class="modal-close" (click)="detail.set(null)"><i class="bi bi-x-lg"></i></button>
          </div>

          <div class="modal-body">
            <div class="detail-meta">
              <div><span class="dm-label">Customer</span><span>{{ detail()!.customerName }}</span></div>
              <div><span class="dm-label">Phone</span><span>{{ detail()!.deliveryPhone }}</span></div>
              <div><span class="dm-label">Address</span><span>{{ detail()!.fullAddress }}, {{ detail()!.city }}</span></div>
              <div><span class="dm-label">Delivery</span><span>{{ detail()!.deliveryDate | date:'dd MMM yyyy' }} · {{ detail()!.deliveryTimeSlot }}</span></div>
              <div><span class="dm-label">Payment</span><span>{{ paymentLabel(detail()!.paymentMethod) }}</span></div>
              @if (detail()!.notes) { <div><span class="dm-label">Notes</span><span>{{ detail()!.notes }}</span></div> }
              @if (detail()!.cancelReason) { <div><span class="dm-label">Cancel Reason</span><span style="color:#ef4444">{{ detail()!.cancelReason }}</span></div> }
            </div>

            <table class="data-table" style="margin-top:1rem">
              <thead><tr><th>Product</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead>
              <tbody>
                @for (item of detail()!.items; track item.id) {
                  <tr>
                    <td>{{ item.productName }} @if (item.isCustomBuild) { <span class="custom-tag">Custom</span> }</td>
                    <td>{{ item.quantity | number:'1.0-2' }} {{ item.unit }}</td>
                    <td>Rs. {{ item.unitPrice | number:'1.0-0' }}</td>
                    <td>Rs. {{ item.totalPrice | number:'1.0-0' }}</td>
                  </tr>
                }
              </tbody>
            </table>

            <div class="detail-totals">
              <span>Subtotal: Rs. {{ detail()!.subTotal | number:'1.0-0' }}</span>
              <span>Delivery: Rs. {{ detail()!.deliveryFee | number:'1.0-0' }}</span>
              <span>Service: Rs. {{ detail()!.serviceFee | number:'1.0-0' }}</span>
              <strong>Total: Rs. {{ detail()!.totalAmount | number:'1.0-0' }}</strong>
            </div>
          </div>
        </div>
      </div>
    }
  `
})
export class AdminOrdersComponent implements OnInit {
  private svc = inject(OrderService);

  orders        = signal<OrderSummary[]>([]);
  loading       = signal(true);
  statusFilter  = signal(0);
  detail        = signal<OrderDetail | null>(null);
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

  updateStatus(id: number, status: number) {
    this.svc.updateOrderStatus(id, status).subscribe({ next: () => this.load() });
  }

  nextActions(s: number): { value: number; label: string }[] {
    return NEXT_STATUS[s] ?? [];
  }

  statusLabel(s: number): string { return ORDER_STATUSES[s]?.label ?? 'Unknown'; }
  statusColor(s: number): string { return ORDER_STATUSES[s]?.color ?? '#6b7280'; }
  statusBg(s: number): string    { return (ORDER_STATUSES[s]?.color ?? '#6b7280') + '1a'; }
  paymentLabel(m: number): string { return PAYMENT_METHODS[m] ?? 'Unknown'; }
}
