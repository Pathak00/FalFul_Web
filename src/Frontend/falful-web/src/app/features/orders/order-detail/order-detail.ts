import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { OrderService } from '../../../core/services/order.service';
import { OrderDetail, ORDER_STATUSES, PAYMENT_METHODS } from '../../../core/models/order.models';

const DELIVERY_STEPS = [
  { status: 1, label: 'Order Placed',       icon: 'bi-bag-check' },
  { status: 2, label: 'Confirmed',          icon: 'bi-check-circle' },
  { status: 3, label: 'Processing',         icon: 'bi-gear' },
  { status: 4, label: 'Out for Delivery',   icon: 'bi-bicycle' },
  { status: 5, label: 'Delivered',          icon: 'bi-house-check' },
];

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="od-page">
      <a routerLink="/orders" class="back-link"><i class="bi bi-arrow-left"></i> My Orders</a>

      @if (loading()) {
        <div class="od-skeleton"></div>
      } @else if (!order()) {
        <div class="od-not-found">
          <i class="bi bi-exclamation-circle"></i>
          <p>Order not found.</p>
        </div>
      } @else {
        <div class="od-header">
          <div class="od-title">
            <h2>{{ order()!.orderNumber }}</h2>
            <span class="od-date">{{ order()!.createdAt | date:'dd MMM yyyy, h:mm a' }}</span>
          </div>
          <span class="od-status" [style.background]="statusBg(order()!.status)" [style.color]="statusColor(order()!.status)">
            {{ statusLabel(order()!.status) }}
          </span>
        </div>

        <!-- Tracking timeline (only if not cancelled/refunded) -->
        @if (order()!.status < 6) {
          <div class="tracking-timeline">
            @for (step of steps; track step.status) {
              <div class="track-step" [class.done]="order()!.status >= step.status" [class.current]="order()!.status === step.status">
                <div class="step-icon"><i class="bi {{ step.icon }}"></i></div>
                <span class="step-label">{{ step.label }}</span>
              </div>
              @if (!$last) { <div class="track-line" [class.done]="order()!.status > step.status"></div> }
            }
          </div>
        }

        @if (order()!.cancelReason) {
          <div class="cancel-note">
            <i class="bi bi-x-circle-fill"></i> Cancelled: {{ order()!.cancelReason }}
          </div>
        }

        <div class="od-layout">
          <!-- Left -->
          <div class="od-left">
            <!-- Items -->
            <div class="od-card">
              <h4>Items Ordered</h4>
              @for (item of order()!.items; track item.id) {
                <div class="od-item">
                  <div class="oi-img">
                    @if (item.imageUrl) { <img [src]="item.imageUrl" [alt]="item.productName" /> }
                    @else { <div class="oi-no-img"><i class="bi bi-image"></i></div> }
                  </div>
                  <div class="oi-info">
                    <span class="oi-name">{{ item.productName }}
                      @if (item.isCustomBuild) { <span class="custom-tag">Custom Build</span> }
                    </span>
                    <span class="oi-qty">{{ item.quantity | number:'1.0-2' }} {{ item.unit }} × Rs. {{ item.unitPrice | number:'1.0-0' }}</span>
                  </div>
                  <span class="oi-price">Rs. {{ item.totalPrice | number:'1.0-0' }}</span>
                </div>
              }
            </div>

            <!-- Delivery info -->
            <div class="od-card">
              <h4><i class="bi bi-geo-alt"></i> Delivery Details</h4>
              <div class="detail-grid">
                <span class="dt-label">Address</span>
                <span>{{ order()!.fullAddress }}, {{ order()!.city }}</span>
                @if (order()!.landmark) {
                  <span class="dt-label">Landmark</span>
                  <span>{{ order()!.landmark }}</span>
                }
                <span class="dt-label">Phone</span>
                <span>{{ order()!.deliveryPhone }}</span>
                <span class="dt-label">Date</span>
                <span>{{ order()!.deliveryDate | date:'dd MMM yyyy' }} · {{ order()!.deliveryTimeSlot }}</span>
              </div>
            </div>

            @if (order()!.delivery) {
              <div class="od-card">
                <h4><i class="bi bi-bicycle"></i> Rider Info</h4>
                <div class="detail-grid">
                  <span class="dt-label">Status</span>
                  <span>{{ order()!.delivery!.statusLabel }}</span>
                  @if (order()!.delivery!.riderName) {
                    <span class="dt-label">Rider</span>
                    <span>{{ order()!.delivery!.riderName }}</span>
                  }
                  @if (order()!.delivery!.riderPhone) {
                    <span class="dt-label">Phone</span>
                    <span>{{ order()!.delivery!.riderPhone }}</span>
                  }
                  @if (order()!.delivery!.trackingNotes) {
                    <span class="dt-label">Notes</span>
                    <span>{{ order()!.delivery!.trackingNotes }}</span>
                  }
                  @if (order()!.delivery!.deliveredAt) {
                    <span class="dt-label">Delivered</span>
                    <span>{{ order()!.delivery!.deliveredAt | date:'dd MMM yyyy, h:mm a' }}</span>
                  }
                </div>
              </div>
            }
          </div>

          <!-- Right: summary -->
          <div class="od-summary-card">
            <h4>Payment Summary</h4>
            <div class="ps-row"><span>Subtotal</span><span>Rs. {{ order()!.subTotal | number:'1.0-0' }}</span></div>
            <div class="ps-row"><span>Delivery</span><span>Rs. {{ order()!.deliveryFee | number:'1.0-0' }}</span></div>
            <div class="ps-row"><span>Service Fee</span><span>Rs. {{ order()!.serviceFee | number:'1.0-0' }}</span></div>
            <div class="ps-row total"><span>Total</span><span>Rs. {{ order()!.totalAmount | number:'1.0-0' }}</span></div>
            <div class="ps-row"><span>Payment</span><span>{{ paymentLabel(order()!.paymentMethod) }}</span></div>

            @if (canCancel()) {
              <button class="btn-cancel" (click)="cancelOrder()" [disabled]="cancelling()">
                @if (cancelling()) { Cancelling... }
                @else { <i class="bi bi-x-circle"></i> Cancel Order }
              </button>
            }
          </div>
        </div>
      }
    </div>
  `,
  styleUrl: './order-detail.scss'
})
export class OrderDetailComponent implements OnInit {
  private svc   = inject(OrderService);
  private route = inject(ActivatedRoute);

  order     = signal<OrderDetail | null>(null);
  loading   = signal(true);
  cancelling = signal(false);
  steps     = DELIVERY_STEPS;

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.svc.getOrderById(id).subscribe({
      next: o  => { this.order.set(o); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  canCancel(): boolean {
    const s = this.order()?.status;
    return s === 1 || s === 2;
  }

  cancelOrder(): void {
    const id = this.order()?.id;
    if (!id) return;
    const reason = prompt('Please enter a reason for cancellation:');
    if (!reason?.trim()) return;
    this.cancelling.set(true);
    this.svc.cancelOrder(id, reason.trim()).subscribe({
      next: () => {
        this.order.update(o => o ? { ...o, status: 6, cancelReason: reason } : o);
        this.cancelling.set(false);
      },
      error: e => {
        alert(e.error?.message ?? 'Failed to cancel order.');
        this.cancelling.set(false);
      }
    });
  }

  statusLabel(s: number): string { return ORDER_STATUSES[s]?.label ?? 'Unknown'; }
  statusColor(s: number): string { return ORDER_STATUSES[s]?.color ?? '#6b7280'; }
  statusBg(s: number): string    { return (ORDER_STATUSES[s]?.color ?? '#6b7280') + '1a'; }
  paymentLabel(m: number): string { return PAYMENT_METHODS[m] ?? 'Unknown'; }
}
