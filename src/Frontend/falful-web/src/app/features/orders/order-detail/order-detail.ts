import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { OrderService } from '../../../core/services/order.service';
import { OrderDetail, ORDER_STATUSES, DELIVERY_STATUSES, DELIVERY_FAILURE_REASONS, PAYMENT_METHODS } from '../../../core/models/order.models';

const ORDER_STEPS = [
  { status: 1, label: 'Order Placed',       icon: 'bi-bag-check'  },
  { status: 2, label: 'Paid',               icon: 'bi-check-circle' },
  { status: 3, label: 'Preparing',          icon: 'bi-gear'       },
  { status: 4, label: 'Ready for Dispatch', icon: 'bi-box-seam'   },
];

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
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
            <span class="od-date">{{ order()!.createdAt | date:'dd MMM yyyy, h:mm a':'Asia/Kathmandu' }}</span>
          </div>
          <span class="od-status" [style.background]="orderStatusBg(order()!.status)" [style.color]="orderStatusColor(order()!.status)">
            {{ orderStatusLabel(order()!.status) }}
          </span>
        </div>

        <!-- Order progress timeline -->
        @if (order()!.status < 5) {
          <div class="tracking-timeline">
            @for (step of orderSteps; track step.status) {
              <div class="track-step" [class.done]="order()!.status >= step.status" [class.current]="order()!.status === step.status">
                <div class="step-icon"><i class="bi {{ step.icon }}"></i></div>
                <span class="step-label">{{ step.label }}</span>
              </div>
              @if (!$last) { <div class="track-line" [class.done]="order()!.status > step.status"></div> }
            }
          </div>
        }

        @if (order()!.cancelReason) {
          <div class="cancel-note"><i class="bi bi-x-circle-fill"></i> Cancelled: {{ order()!.cancelReason }}</div>
        }

        <div class="od-layout">
          <!-- Left col -->
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

            <!-- Delivery address -->
            <div class="od-card">
              <h4><i class="bi bi-geo-alt"></i> Delivery Details</h4>
              <div class="detail-grid">
                <span class="dt-label">Address</span>
                <span>{{ order()!.fullAddress }}, {{ order()!.city }}</span>
                @if (order()!.landmark) {
                  <span class="dt-label">Landmark</span><span>{{ order()!.landmark }}</span>
                }
                <span class="dt-label">Phone</span><span>{{ order()!.deliveryPhone }}</span>
                <span class="dt-label">Date</span>
                <span>{{ order()!.deliveryDate | date:'dd MMM yyyy':'Asia/Kathmandu' }} · {{ order()!.deliveryTimeSlot }}</span>
              </div>
            </div>

            <!-- Delivery tracking -->
            @if (order()!.delivery) {
              <div class="od-card">
                <h4><i class="bi bi-bicycle"></i> Delivery Tracking</h4>
                <div class="delivery-status-bar">
                  <span class="ds-badge"
                        [style.background]="deliveryStatusColor(order()!.delivery!.status) + '20'"
                        [style.color]="deliveryStatusColor(order()!.delivery!.status)">
                    <i class="bi {{ deliveryStatusIcon(order()!.delivery!.status) }}"></i>
                    {{ order()!.delivery!.statusLabel }}
                  </span>
                  @if (order()!.delivery!.attemptCount > 0) {
                    <span class="attempt-chip">
                      {{ order()!.delivery!.attemptCount }} / {{ order()!.delivery!.maxAttempts }} attempts
                    </span>
                  }
                </div>

                @if (order()!.delivery!.riderName || order()!.delivery!.riderPhone) {
                  <div class="detail-grid" style="margin-top:.75rem">
                    @if (order()!.delivery!.riderName) {
                      <span class="dt-label">Rider</span><span>{{ order()!.delivery!.riderName }}</span>
                    }
                    @if (order()!.delivery!.riderPhone) {
                      <span class="dt-label">Phone</span><span>{{ order()!.delivery!.riderPhone }}</span>
                    }
                    @if (order()!.delivery!.deliveredAt) {
                      <span class="dt-label">Delivered</span>
                      <span>{{ order()!.delivery!.deliveredAt | date:'dd MMM yyyy, h:mm a':'Asia/Kathmandu' }}</span>
                    }
                  </div>
                }

                <!-- Attempt history -->
                @if (order()!.delivery!.attempts?.length) {
                  <div class="attempts-list">
                    <p class="attempts-title">Delivery Attempts</p>
                    @for (a of order()!.delivery!.attempts; track a.id) {
                      <div class="attempt-card" [class.success]="a.wasSuccessful" [class.fail]="!a.wasSuccessful">
                        <div class="attempt-header">
                          <span class="attempt-num">#{{ a.attemptNumber }}</span>
                          <span class="attempt-time">{{ a.attemptedAt | date:'dd MMM, h:mm a':'Asia/Kathmandu' }}</span>
                          <span class="attempt-result">
                            @if (a.wasSuccessful) { <i class="bi bi-check-circle-fill" style="color:#22c55e"></i> Delivered }
                            @else { <i class="bi bi-x-circle-fill" style="color:#ef4444"></i> Failed }
                          </span>
                        </div>
                        @if (!a.wasSuccessful && a.failureReasonLabel) {
                          <div class="attempt-reason">
                            <i class="bi bi-exclamation-triangle"></i> {{ a.failureReasonLabel }}
                            @if (a.failureNotes) { — {{ a.failureNotes }} }
                          </div>
                        }
                        @if (a.nextActionLabel) {
                          <div class="attempt-next">
                            <i class="bi bi-arrow-right"></i> {{ a.nextActionLabel }}
                            @if (a.rescheduledDate) { on {{ a.rescheduledDate | date:'dd MMM' }} }
                            @if (a.rescheduledTimeSlot) { {{ a.rescheduledTimeSlot }} }
                          </div>
                        }
                      </div>
                    }
                  </div>
                }
              </div>
            }

            <!-- Rating section (delivered, not yet rated) -->
            @if (order()!.delivery?.status === 5 && !order()!.rating && !ratingSubmitted()) {
              <div class="od-card rating-card">
                <h4><i class="bi bi-star"></i> Rate Your Order</h4>
                <div class="rating-row">
                  <label>Overall</label>
                  <div class="stars">
                    @for (s of [1,2,3,4,5]; track s) {
                      <button class="star-btn" [class.filled]="ratingForm.overallRating >= s"
                              (click)="ratingForm.overallRating = s">
                        <i class="bi bi-star-fill"></i>
                      </button>
                    }
                  </div>
                </div>
                <div class="rating-row">
                  <label>Delivery</label>
                  <div class="stars">
                    @for (s of [1,2,3,4,5]; track s) {
                      <button class="star-btn" [class.filled]="(ratingForm.deliveryRating ?? 0) >= s"
                              (click)="ratingForm.deliveryRating = s">
                        <i class="bi bi-star-fill"></i>
                      </button>
                    }
                  </div>
                </div>
                <div class="rating-row">
                  <label>Product Quality</label>
                  <div class="stars">
                    @for (s of [1,2,3,4,5]; track s) {
                      <button class="star-btn" [class.filled]="(ratingForm.productQualityRating ?? 0) >= s"
                              (click)="ratingForm.productQualityRating = s">
                        <i class="bi bi-star-fill"></i>
                      </button>
                    }
                  </div>
                </div>
                <textarea [(ngModel)]="ratingForm.comment" placeholder="Leave a comment (optional)" rows="2" style="width:100%;margin-top:.5rem;padding:.5rem;border:1px solid #e2e8f0;border-radius:6px;font-size:.85rem"></textarea>
                <button class="btn-submit-rating" (click)="submitRating()" [disabled]="ratingForm.overallRating === 0 || submittingRating()">
                  @if (submittingRating()) { Submitting... } @else { Submit Rating }
                </button>
              </div>
            }

            <!-- Existing rating display -->
            @if (order()!.rating) {
              <div class="od-card">
                <h4><i class="bi bi-star-fill" style="color:#f59e0b"></i> Your Rating</h4>
                <div class="existing-rating">
                  <div class="rating-display">
                    <span>Overall</span>
                    <span class="stars-display">{{ '★'.repeat(order()!.rating!.overallRating) }}{{ '☆'.repeat(5 - order()!.rating!.overallRating) }}</span>
                  </div>
                  @if (order()!.rating!.comment) {
                    <p style="color:#6b7280;font-size:.85rem;margin:.5rem 0 0">"{{ order()!.rating!.comment }}"</p>
                  }
                </div>
              </div>
            }

          </div>

          <!-- Right: payment summary -->
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
  styles: [`
    .attempts-list { margin-top: 1rem; }
    .attempts-title { font-size: .75rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: .06em; margin: 0 0 .5rem; }
    .attempt-card { border: 1px solid #e2e8f0; border-radius: 8px; padding: .625rem .75rem; margin-bottom: .5rem; font-size: .8rem; }
    .attempt-card.success { border-color: #dcfce7; background: #f0fdf4; }
    .attempt-card.fail    { border-color: #fee2e2; background: #fff5f5; }
    .attempt-header { display: flex; align-items: center; gap: .5rem; }
    .attempt-num  { font-weight: 700; color: #374151; }
    .attempt-time { color: #9ca3af; margin-left: auto; font-size: .75rem; }
    .attempt-result { display: flex; align-items: center; gap: .25rem; font-weight: 600; font-size: .78rem; }
    .attempt-reason { margin-top: .3rem; color: #ef4444; font-size: .78rem; }
    .attempt-next   { margin-top: .25rem; color: #6b7280; font-size: .75rem; }
    .delivery-status-bar { display: flex; align-items: center; gap: .5rem; flex-wrap: wrap; }
    .ds-badge { display: inline-flex; align-items: center; gap: .3rem; padding: .3rem .7rem; border-radius: 20px; font-size: .8rem; font-weight: 600; }
    .attempt-chip { font-size: .73rem; color: #6b7280; background: #f3f4f6; padding: .2rem .5rem; border-radius: 10px; }
    .rating-card { background: #fffbeb; border: 1px solid #fde68a; }
    .rating-row { display: flex; align-items: center; gap: .75rem; margin: .4rem 0; font-size: .85rem; color: #374151; }
    .rating-row label { width: 110px; font-weight: 600; }
    .stars { display: flex; gap: .15rem; }
    .star-btn { background: none; border: none; padding: 0; cursor: pointer; color: #d1d5db; font-size: 1.1rem; }
    .star-btn.filled { color: #f59e0b; }
    .btn-submit-rating { width: 100%; margin-top: .75rem; padding: .5rem; background: #22c55e; color: #fff; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; }
    .btn-submit-rating:disabled { opacity: .6; cursor: not-allowed; }
    .existing-rating { font-size: .85rem; }
    .rating-display { display: flex; justify-content: space-between; align-items: center; }
    .stars-display { color: #f59e0b; font-size: 1rem; letter-spacing: .1em; }
  `],
  styleUrl: './order-detail.scss'
})
export class OrderDetailComponent implements OnInit {
  private svc   = inject(OrderService);
  private route = inject(ActivatedRoute);

  order          = signal<OrderDetail | null>(null);
  loading        = signal(true);
  cancelling     = signal(false);
  submittingRating = signal(false);
  ratingSubmitted  = signal(false);
  readonly orderSteps = ORDER_STEPS;

  ratingForm = { overallRating: 0, deliveryRating: undefined as number | undefined, productQualityRating: undefined as number | undefined, comment: '' };

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
      next: () => { this.order.update(o => o ? { ...o, status: 5, cancelReason: reason } : o); this.cancelling.set(false); },
      error: e  => { alert(e.error?.message ?? 'Failed to cancel order.'); this.cancelling.set(false); }
    });
  }

  submitRating(): void {
    const id = this.order()?.id;
    if (!id || this.ratingForm.overallRating === 0) return;
    this.submittingRating.set(true);
    this.svc.submitRating(id, {
      overallRating:        this.ratingForm.overallRating,
      deliveryRating:       this.ratingForm.deliveryRating,
      productQualityRating: this.ratingForm.productQualityRating,
      comment:              this.ratingForm.comment || undefined
    }).subscribe({
      next: () => { this.ratingSubmitted.set(true); this.submittingRating.set(false); },
      error: () => this.submittingRating.set(false)
    });
  }

  orderStatusLabel(s: number): string { return ORDER_STATUSES[s]?.label ?? 'Unknown'; }
  orderStatusColor(s: number): string { return ORDER_STATUSES[s]?.color ?? '#6b7280'; }
  orderStatusBg(s: number):    string { return (ORDER_STATUSES[s]?.color ?? '#6b7280') + '1a'; }
  deliveryStatusColor(s: number): string { return DELIVERY_STATUSES[s]?.color ?? '#94a3b8'; }
  deliveryStatusIcon(s: number):  string { return DELIVERY_STATUSES[s]?.icon  ?? 'bi-truck'; }
  paymentLabel(m: number): string { return PAYMENT_METHODS[m] ?? 'Unknown'; }
}
