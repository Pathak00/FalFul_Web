import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { OrderService } from '../../../core/services/order.service';
import { OrderDetail, ORDER_STATUSES, DELIVERY_STATUSES, PAYMENT_METHODS } from '../../../core/models/order.models';

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

        <!-- Order Progress Timeline (active orders only) -->
        @if (order()!.status >= 1 && order()!.status <= 4) {
          <div class="progress-section">
            <p class="ps-title">Order Progress</p>
            <div class="tracking-timeline">
              @for (step of orderSteps; track step.status) {
                <div class="track-step"
                     [class.done]="order()!.status > step.status"
                     [class.current]="order()!.status === step.status">
                  <div class="step-icon"><i class="bi {{ step.icon }}"></i></div>
                  <span class="step-label">{{ step.label }}</span>
                </div>
                @if (!$last) {
                  <div class="track-line" [class.done]="order()!.status > step.status"></div>
                }
              }
            </div>
          </div>
        }

        <!-- Terminal state note -->
        @if (order()!.status === 5 || order()!.status === 6) {
          <div class="terminal-note" [class.rejected]="order()!.status === 6">
            <i class="bi" [class.bi-x-circle-fill]="order()!.status === 5" [class.bi-slash-circle]="order()!.status === 6"></i>
            <span>
              {{ order()!.status === 6 ? 'Order Rejected' : 'Order Cancelled' }}
              @if (order()!.cancelReason) { — {{ order()!.cancelReason }} }
            </span>
          </div>
        }

        <!-- Delivery Progress Timeline (delivery statuses 1–5) -->
        @if (order()!.delivery && order()!.delivery!.status >= 1 && order()!.delivery!.status <= 5) {
          <div class="progress-section">
            <p class="ps-title">Delivery Progress</p>
            <div class="tracking-timeline">
              @for (step of deliverySteps; track step.status) {
                <div class="track-step"
                     [class.done]="order()!.delivery!.status > step.status"
                     [class.current]="order()!.delivery!.status === step.status">
                  <div class="step-icon"><i class="bi {{ step.icon }}"></i></div>
                  <span class="step-label">{{ step.label }}</span>
                </div>
                @if (!$last) {
                  <div class="track-line" [class.done]="order()!.delivery!.status > step.status"></div>
                }
              }
            </div>
          </div>
        }

        <!-- Delivery issue banner (failed / rescheduled / returned states 6–9) -->
        @if (order()!.delivery && order()!.delivery!.status >= 6) {
          <div class="delivery-issue-note"
               [style.border-color]="deliveryStatusColor(order()!.delivery!.status) + '80'"
               [style.background]="deliveryStatusColor(order()!.delivery!.status) + '15'">
            <i class="bi {{ deliveryStatusIcon(order()!.delivery!.status) }}"
               [style.color]="deliveryStatusColor(order()!.delivery!.status)"></i>
            <div>
              <strong [style.color]="deliveryStatusColor(order()!.delivery!.status)">
                {{ order()!.delivery!.statusLabel }}
              </strong>
              @if (order()!.delivery!.trackingNotes) {
                <p class="issue-note-sub">{{ order()!.delivery!.trackingNotes }}</p>
              }
            </div>
          </div>
        }

        <div class="od-layout">
          <!-- Left col -->
          <div class="od-left">

            <!-- Items -->
            <div class="od-card">
              <h4>Items Ordered</h4>
              @for (item of order()!.items; track item.id) {
                <div class="od-item-group">
                  <div class="od-item">
                    <div class="oi-img">
                      @if (item.imageUrl) { <img [src]="item.imageUrl" [alt]="item.productName" /> }
                      @else { <div class="oi-no-img"><i class="bi bi-image"></i></div> }
                    </div>
                    <div class="oi-info">
                      <span class="oi-name">
                        {{ item.productName }}
                        @if (item.isCustomBuild) { <span class="custom-tag">Custom Bowl</span> }
                      </span>
                      @if (!item.isCustomBuild) {
                        <span class="oi-qty">{{ item.quantity | number:'1.0-2' }} {{ item.unit }} × Rs. {{ item.unitPrice | number:'1.0-0' }}</span>
                      } @else {
                        <span class="oi-qty">{{ item.quantity }} {{ item.unit }}</span>
                      }
                    </div>
                    <span class="oi-price">Rs. {{ item.totalPrice | number:'1.0-0' }}</span>
                  </div>

                  <!-- BYB Composition Breakdown -->
                  @if (item.isCustomBuild && item.customBuildDetails) {
                    @let bowl = parseBowlDetails(item.customBuildDetails);
                    @if (bowl) {
                      <div class="bowl-composition">
                        <div class="bc-header">
                          <i class="bi bi-scissors"></i>
                          {{ bowl.container === 'bowl' ? 'Bowl' : 'Box' }} Contents
                          <span class="bc-total-g">{{ bowlTotalGrams(bowl) }}g total</span>
                        </div>
                        <div class="bc-grid">
                          <span class="bc-col-head">Fruit</span>
                          <span class="bc-col-head center">Weight</span>
                          <span class="bc-col-head right">Price</span>
                        </div>
                        @for (fruit of bowl.fruits; track fruit.productId) {
                          <div class="bc-row">
                            <span class="bc-name">{{ fruit.name }}</span>
                            <span class="bc-grams">{{ fruit.grams }}g</span>
                            @if (fruit.price != null) {
                              <span class="bc-price">Rs. {{ fruit.price | number:'1.0-0' }}</span>
                            } @else {
                              <span class="bc-price bc-na">—</span>
                            }
                          </div>
                        }
                        @if (bowl.containerFee != null && bowl.containerFee > 0) {
                          <div class="bc-row bc-fee-row">
                            <span class="bc-name">Container</span>
                            <span class="bc-grams">—</span>
                            <span class="bc-price">Rs. {{ bowl.containerFee | number:'1.0-0' }}</span>
                          </div>
                        }
                      </div>
                    }
                  }
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
                @if (order()!.notes) {
                  <span class="dt-label">Notes</span><span>{{ order()!.notes }}</span>
                }
              </div>
            </div>

            <!-- Delivery rider info & attempt history -->
            @if (order()!.delivery) {
              <div class="od-card">
                <h4><i class="bi bi-bicycle"></i> Delivery Tracking</h4>

                @if (order()!.delivery!.riderName || order()!.delivery!.deliveredAt) {
                  <div class="detail-grid" style="margin-bottom:.75rem">
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
                <textarea [(ngModel)]="ratingForm.comment" placeholder="Leave a comment (optional)" rows="2"
                          style="width:100%;margin-top:.5rem;padding:.5rem;border:1px solid #e2e8f0;border-radius:6px;font-size:.85rem"></textarea>
                <button class="btn-submit-rating" (click)="submitRating()"
                        [disabled]="ratingForm.overallRating === 0 || submittingRating()">
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

          <!-- Right: order summary + payment -->
          <div class="od-summary-card">
            <h4>Order Summary</h4>
            <div class="ps-row"><span>Subtotal</span><span>Rs. {{ order()!.subTotal | number:'1.0-0' }}</span></div>
            <div class="ps-row"><span>Delivery Fee</span><span>Rs. {{ order()!.deliveryFee | number:'1.0-0' }}</span></div>
            <div class="ps-row"><span>Service Fee</span><span>Rs. {{ order()!.serviceFee | number:'1.0-0' }}</span></div>
            <div class="ps-row total"><span>Total</span><span>Rs. {{ order()!.totalAmount | number:'1.0-0' }}</span></div>

            <div class="ps-payment-section">
              <div class="ps-row">
                <span>Method</span>
                <span>{{ paymentMethodLabel(order()!.paymentMethod) }}</span>
              </div>
              <div class="ps-row">
                <span>Payment</span>
                <span class="pstatus-badge"
                      [style.background]="paymentStatusColor(order()!) + '20'"
                      [style.color]="paymentStatusColor(order()!)">
                  {{ paymentStatusLabel(order()!) }}
                </span>
              </div>
            </div>

            @if (canCancel()) {
              <button class="btn-cancel" (click)="cancelOrder()" [disabled]="cancelling()">
                @if (cancelling()) { Cancelling... }
                @else { <i class="bi bi-x-circle"></i> Cancel Order }
              </button>
              @if (cancelPolicy()) {
                <p class="cancel-policy-text">{{ cancelPolicy() }}</p>
              }
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .progress-section { margin-bottom: 1.5rem; }
    .ps-title { font-size: .72rem; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: #9ca3af; margin: 0 0 .75rem; }

    .terminal-note { display: flex; align-items: center; gap: .5rem; background: #fef2f2; border: 1px solid #fca5a5; border-radius: 8px; padding: .75rem 1rem; margin-bottom: 1.5rem; font-size: .875rem; color: #dc2626; }
    .terminal-note.rejected { background: #fff1f2; border-color: #fecdd3; color: #be123c; }

    .delivery-issue-note { display: flex; align-items: flex-start; gap: .75rem; border: 1px solid; border-radius: 10px; padding: .875rem 1rem; margin-bottom: 1.5rem; font-size: .875rem; }
    .delivery-issue-note i { font-size: 1.25rem; flex-shrink: 0; margin-top: .1rem; }
    .issue-note-sub { margin: .25rem 0 0; font-size: .8rem; color: #6b7280; }

    .od-item-group { border-bottom: 1px solid #f0f0f0; }
    .od-item-group:last-child { border-bottom: none; }
    .od-item-group:last-child .od-item { padding-bottom: 0; }

    .bowl-composition { background: #faf5ff; border: 1px solid #e9d5ff; border-radius: 8px; padding: .6rem .75rem; margin: 0 0 .625rem 60px; font-size: .78rem; }
    .bc-header { display: flex; align-items: center; gap: .4rem; font-size: .72rem; font-weight: 700; color: #7c3aed; margin-bottom: .4rem; }
    .bc-total-g { margin-left: auto; background: #ede9fe; color: #7c3aed; padding: 1px 7px; border-radius: 10px; font-size: .68rem; font-weight: 700; }
    .bc-grid, .bc-row { display: grid; grid-template-columns: 1fr 60px 70px; gap: .25rem; }
    .bc-col-head { font-size: .68rem; font-weight: 700; color: #a78bfa; text-transform: uppercase; letter-spacing: .04em; padding-bottom: .2rem; }
    .bc-col-head.center { text-align: center; }
    .bc-col-head.right  { text-align: right; }
    .bc-row { padding: .2rem 0; border-top: 1px solid #f3e8ff; color: #374151; }
    .bc-name  { color: #374151; }
    .bc-grams { color: #9ca3af; text-align: center; }
    .bc-price { text-align: right; font-weight: 600; }
    .bc-na    { color: #d1d5db; font-weight: 400; }
    .bc-fee-row .bc-name { color: #6b7280; font-style: italic; }

    .ps-payment-section { border-top: 1px solid #f1f5f9; margin-top: .5rem; padding-top: .5rem; }
    .pstatus-badge { display: inline-block; font-size: .72rem; font-weight: 700; padding: 2px 8px; border-radius: 10px; white-space: nowrap; }

    .attempts-list { }
    .attempts-title { font-size: .72rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: .06em; margin: 0 0 .5rem; }
    .attempt-card { border: 1px solid #e2e8f0; border-radius: 8px; padding: .625rem .75rem; margin-bottom: .5rem; font-size: .8rem; }
    .attempt-card.success { border-color: #dcfce7; background: #f0fdf4; }
    .attempt-card.fail    { border-color: #fee2e2; background: #fff5f5; }
    .attempt-header { display: flex; align-items: center; gap: .5rem; }
    .attempt-num    { font-weight: 700; color: #374151; }
    .attempt-time   { color: #9ca3af; margin-left: auto; font-size: .75rem; }
    .attempt-result { display: flex; align-items: center; gap: .25rem; font-weight: 600; font-size: .78rem; }
    .attempt-reason { margin-top: .3rem; color: #ef4444; font-size: .78rem; }
    .attempt-next   { margin-top: .25rem; color: #6b7280; font-size: .75rem; }

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
    .cancel-policy-text { font-size: .72rem; color: #9ca3af; margin: .5rem 0 0; line-height: 1.4; }
  `],
  styleUrl: './order-detail.scss'
})
export class OrderDetailComponent implements OnInit {
  private svc   = inject(OrderService);
  private route = inject(ActivatedRoute);

  order            = signal<OrderDetail | null>(null);
  loading          = signal(true);
  cancelling       = signal(false);
  submittingRating = signal(false);
  ratingSubmitted  = signal(false);
  cancelPolicy     = signal<string>('');

  readonly orderSteps    = ORDER_STEPS;
  readonly deliverySteps = DELIVERY_STEPS;

  ratingForm = {
    overallRating:        0,
    deliveryRating:       undefined as number | undefined,
    productQualityRating: undefined as number | undefined,
    comment:              ''
  };

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.svc.getOrderById(id).subscribe({
      next: o  => { this.order.set(o); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
    this.svc.getSetting('cancellation_policy_text').subscribe({
      next: s => this.cancelPolicy.set(s.value),
      error: () => {}
    });
  }

  canCancel(): boolean {
    return this.order()?.status === 1;
  }

  cancelOrder(): void {
    const id = this.order()?.id;
    if (!id) return;
    const reason = prompt('Please enter a reason for cancellation:');
    if (!reason?.trim()) return;
    this.cancelling.set(true);
    this.svc.cancelOrder(id, reason.trim()).subscribe({
      next: () => {
        this.order.update(o => o ? { ...o, status: 5, cancelReason: reason } : o);
        this.cancelling.set(false);
      },
      error: e => { alert(e.error?.message ?? 'Failed to cancel order.'); this.cancelling.set(false); }
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

  orderStatusLabel(s: number): string  { return ORDER_STATUSES[s]?.label    ?? 'Unknown'; }
  orderStatusColor(s: number): string  { return ORDER_STATUSES[s]?.color    ?? '#6b7280'; }
  orderStatusBg(s: number):    string  { return (ORDER_STATUSES[s]?.color   ?? '#6b7280') + '1a'; }
  deliveryStatusColor(s: number): string { return DELIVERY_STATUSES[s]?.color ?? '#94a3b8'; }
  deliveryStatusIcon(s: number):  string { return DELIVERY_STATUSES[s]?.icon  ?? 'bi-truck'; }
}
