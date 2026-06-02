import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { OrderService } from '../../../core/services/order.service';
import { PaymentService } from '../../../core/services/payment.service';
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

        <!-- Awaiting Payment banner -->
        @if (order()!.status === 7) {
          <div class="awaiting-payment-banner">
            <i class="bi bi-clock-history"></i>
            <div class="apb-body">
              <strong>Payment Required</strong>
              <p>Your order is on hold until the advance payment is completed.</p>
            </div>
            <button class="btn-pay-now" (click)="payNow()" [disabled]="payingNow()">
              @if (payingNow()) { <i class="bi bi-arrow-repeat spin"></i> } @else { <i class="bi bi-credit-card"></i> }
              {{ payingNow() ? 'Loading…' : 'Pay Now' }}
            </button>
          </div>
        }

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

            <!-- Print receipt button (once delivered) -->
            @if (order()!.delivery?.status === 5) {
              <div class="od-card" style="padding:.75rem 1rem">
                <button class="btn-print-receipt" (click)="openPrintReceipt()">
                  <i class="bi bi-printer"></i> Print Receipt
                </button>
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
                <label class="ack-label">
                  <input type="checkbox" [(ngModel)]="ratingForm.receiptAcknowledged" />
                  <span>I have received the delivery receipt</span>
                </label>
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
            @if ((order()!.advanceAmount ?? 0) > 0) {
              <div class="ps-row advance-row"><span><i class="bi bi-check-circle-fill" style="color:#22c55e;font-size:.75rem"></i> Advance Paid</span><span>Rs. {{ order()!.advanceAmount | number:'1.0-0' }}</span></div>
              <div class="ps-row remaining-row"><span><i class="bi bi-hourglass-split" style="color:#f59e0b;font-size:.75rem"></i> On Delivery</span><span>Rs. {{ (order()!.totalAmount - order()!.advanceAmount) | number:'1.0-0' }}</span></div>
            }

            <!-- Payment details (live from Payments table) -->
            @if (payments().length > 0) {
              <div class="ps-payment-section">
                <p class="ps-section-title">Payment</p>
                @for (p of payments(); track p.id) {
                  <div class="payment-row">
                    <div class="payment-row-left">
                      <span class="payment-method-name">{{ p.paymentMethodName }}</span>
                      @if (payments().length > 1) {
                        <span class="payment-type-tag">{{ p.paymentTypeLabel }}</span>
                      }
                    </div>
                    <div class="payment-row-right">
                      <span class="payment-amount">Rs. {{ p.amount | number:'1.0-0' }}</span>
                      <span class="pstatus-badge" [ngClass]="paymentStatusClass(p.status)">
                        {{ p.statusLabel }}
                      </span>
                    </div>
                  </div>
                  @if (p.paidAt) {
                    <div class="payment-paid-at">
                      Paid {{ p.paidAt | date:'dd MMM yyyy, h:mm a':'Asia/Kathmandu' }}
                    </div>
                  }
                }
              </div>
            } @else {
              <!-- Fallback for legacy orders without payment records -->
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
            }

            @if (canCancel()) {
              <button class="btn-cancel" (click)="cancelModalOpen.set(true)" [disabled]="cancelling()">
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

    <!-- Cancel order modal -->
    @if (cancelModalOpen()) {
      <div class="modal-backdrop" (click)="cancelModalOpen.set(false)">
        <div class="cancel-modal" (click)="$event.stopPropagation()">
          <div class="cm-header">
            <h3>Cancel Order</h3>
            <button class="cm-close" (click)="cancelModalOpen.set(false)"><i class="bi bi-x-lg"></i></button>
          </div>
          <div class="cm-body">
            <p>Please tell us why you're cancelling this order.</p>
            <textarea class="cm-textarea" [(ngModel)]="cancelReason" rows="3"
                      placeholder="e.g. Changed my mind, ordered by mistake…"></textarea>
          </div>
          <div class="cm-footer">
            <button class="cm-btn-ghost" (click)="cancelModalOpen.set(false)">Back</button>
            <button class="cm-btn-danger" (click)="executeCancelOrder()" [disabled]="cancelling() || !cancelReason.trim()">
              @if (cancelling()) { <i class="bi bi-arrow-repeat spin"></i> Cancelling… }
              @else { Confirm Cancel }
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .progress-section { margin-bottom: 1.5rem; }
    .ps-title { font-size: .72rem; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: #9ca3af; margin: 0 0 .75rem; }

    .awaiting-payment-banner { display: flex; align-items: center; gap: .75rem; background: #fff7ed; border: 1px solid #fed7aa; border-radius: 10px; padding: .875rem 1rem; margin-bottom: 1.5rem; }
    .awaiting-payment-banner > i { font-size: 1.4rem; color: #f97316; flex-shrink: 0; }
    .apb-body { flex: 1; strong { display: block; font-size: .875rem; color: #9a3412; } p { margin: .15rem 0 0; font-size: .8rem; color: #c2410c; } }
    .btn-pay-now { background: #f97316; color: #fff; border: none; border-radius: 8px; padding: .5rem 1rem; font-size: .85rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: .35rem; white-space: nowrap; &:hover:not(:disabled) { background: #ea580c; } &:disabled { opacity: .6; cursor: not-allowed; } }

    .advance-row { color: #16a34a; font-size: .8rem; gap: .35rem; }
    .remaining-row { color: #b45309; font-size: .8rem; gap: .35rem; border-top: 1px dashed #e2e8f0; padding-top: .3rem; margin-top: .15rem; }

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
    .ps-section-title { font-size: .68rem; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: #9ca3af; margin: 0 0 .5rem; }
    .pstatus-badge { display: inline-block; font-size: .68rem; font-weight: 700; padding: 1px 7px; border-radius: 10px; white-space: nowrap; }
    .pstatus-pending   { background: #fff7ed; color: #ea580c; }
    .pstatus-completed { background: #dcfce7; color: #16a34a; }
    .pstatus-failed    { background: #fef2f2; color: #dc2626; }
    .pstatus-refunded  { background: #f5f3ff; color: #7c3aed; }

    .payment-row { display: flex; align-items: flex-start; justify-content: space-between; gap: .5rem; padding: .3rem 0; }
    .payment-row-left { display: flex; flex-direction: column; gap: .15rem; }
    .payment-row-right { display: flex; flex-direction: column; align-items: flex-end; gap: .2rem; }
    .payment-method-name { font-size: .8rem; font-weight: 600; color: #0f172a; }
    .payment-type-tag { font-size: .65rem; background: #f1f5f9; color: #64748b; padding: 1px 6px; border-radius: 4px; width: fit-content; }
    .payment-amount { font-size: .82rem; font-weight: 700; color: #0f172a; }
    .payment-paid-at { font-size: .68rem; color: #9ca3af; padding-bottom: .35rem; text-align: right; }

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
    .btn-print-receipt { display:flex; align-items:center; gap:.5rem; background:#f0fdf4; border:1px solid #bbf7d0; border-radius:8px; padding:.5rem 1rem; font-size:.85rem; font-weight:600; color:#16a34a; cursor:pointer; width:100%; justify-content:center; &:hover { background:#dcfce7; } }
    .ack-label { display:flex; align-items:center; gap:.5rem; margin:.5rem 0; font-size:.82rem; color:#475569; cursor:pointer; input[type=checkbox] { width:15px; height:15px; cursor:pointer; } }

    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,.45); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 1rem; }
    .cancel-modal { background: #fff; border-radius: 12px; width: 100%; max-width: 420px; box-shadow: 0 20px 60px rgba(0,0,0,.2); }
    .cm-header { display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.25rem; border-bottom: 1px solid #f1f5f9; h3 { margin: 0; font-size: 1rem; font-weight: 700; } }
    .cm-close { background: none; border: none; cursor: pointer; color: #94a3b8; font-size: .9rem; padding: .25rem; border-radius: 4px; &:hover { background: #f1f5f9; } }
    .cm-body { padding: 1.25rem; p { margin: 0 0 .75rem; font-size: .875rem; color: #374151; } }
    .cm-textarea { width: 100%; border: 1px solid #e2e8f0; border-radius: 8px; padding: .625rem .75rem; font-size: .875rem; resize: vertical; box-sizing: border-box; &:focus { outline: none; border-color: #22c55e; box-shadow: 0 0 0 3px rgba(34,197,94,.15); } }
    .cm-footer { display: flex; gap: .75rem; justify-content: flex-end; padding: .875rem 1.25rem; border-top: 1px solid #f1f5f9; }
    .cm-btn-ghost { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: .5rem 1.25rem; font-size: .875rem; cursor: pointer; font-weight: 600; &:hover { background: #f1f5f9; } }
    .cm-btn-danger { background: #dc2626; color: #fff; border: none; border-radius: 8px; padding: .5rem 1.25rem; font-size: .875rem; cursor: pointer; font-weight: 600; &:hover:not(:disabled) { background: #b91c1c; } &:disabled { opacity: .5; cursor: not-allowed; } }
    @keyframes spin { to { transform: rotate(360deg); } }
    .spin { display: inline-block; animation: spin .7s linear infinite; }
  `],
  styleUrl: './order-detail.scss'
})
export class OrderDetailComponent implements OnInit {
  private svc        = inject(OrderService);
  private paySvc     = inject(PaymentService);
  private route      = inject(ActivatedRoute);
  private toast      = inject(ToastService);
  private receiptSvc = inject(ReceiptService);

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
