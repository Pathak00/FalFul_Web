import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RiderService } from '../../core/services/rider.service';

const STATUS_LABELS: Record<number, string> = {
  1: 'Awaiting Rider',
  2: 'Rider Assigned',
  3: 'Picked Up',
  4: 'Out for Delivery',
  5: 'Delivered',
  6: 'Delivery Failed',
  7: 'Customer Unavailable',
  8: 'Rescheduled',
  9: 'Returned',
};

const STATUS_BADGE: Record<number, string> = {
  1: 'badge-yellow',
  2: 'badge-blue',
  3: 'badge-blue',
  4: 'badge-blue',
  5: 'badge-green',
  6: 'badge-red',
  7: 'badge-orange',
  8: 'badge-purple',
  9: 'badge-gray',
};

const FAILURE_REASONS = [
  { value: 1, label: 'Customer Not Home' },
  { value: 2, label: 'Wrong Address' },
  { value: 3, label: 'Customer Refused' },
  { value: 4, label: 'Payment Refused' },
  { value: 5, label: 'Product Damaged' },
  { value: 6, label: 'Weather Conditions' },
  { value: 7, label: 'Vehicle Breakdown' },
  { value: 8, label: 'Contact Not Reachable' },
  { value: 9, label: 'Address Not Found' },
  { value: 10, label: 'Other' },
];

const NEXT_ACTIONS = [
  { value: 1, label: 'Reschedule' },
  { value: 2, label: 'Return to Warehouse' },
  { value: 3, label: 'Retry Today' },
  { value: 4, label: 'Customer Unavailable' },
];

@Component({
  selector: 'app-rider-deliveries',
  standalone: true,
  imports: [FormsModule, DatePipe, DecimalPipe],
  template: `
    <div class="rd-page">
      <div class="page-header">
        <div>
          <h1>My Deliveries</h1>
          <p class="page-sub">Your assigned deliveries for today and upcoming days.</p>
        </div>
        <button class="btn-refresh" (click)="load()"><i class="bi bi-arrow-clockwise"></i></button>
      </div>

      @if (loading()) {
        <div class="empty-state">
          <div class="spinner"></div>
          <p>Loading…</p>
        </div>
      } @else if (deliveries().length === 0) {
        <div class="empty-state">
          <i class="bi bi-bicycle" style="font-size:2.5rem;color:#94a3b8"></i>
          <h3>No deliveries assigned</h3>
          <p>Check back later or contact your admin.</p>
        </div>
      } @else {
        <div class="delivery-list">
          @for (d of deliveries(); track d.id) {
            <div class="delivery-card">
              <div class="card-top">
                <div>
                  <span class="order-num">#{{ d.orderNumber }}</span>
                  <span class="badge {{ STATUS_BADGE[d.status] ?? 'badge-gray' }}">{{
                    STATUS_LABELS[d.status] ?? d.statusLabel
                  }}</span>
                </div>
                <div class="card-actions">
                  @if (d.status === 2) {
                    <button class="btn-action btn-pickup" (click)="quickStatus(d.id, 3)">
                      Picked Up
                    </button>
                  }
                  @if (d.status === 3) {
                    <button class="btn-action btn-out" (click)="quickStatus(d.id, 4)">
                      Out for Delivery
                    </button>
                  }
                  @if (d.status === 4) {
                    <button class="btn-action btn-delivered" (click)="quickStatus(d.id, 5)">
                      Mark Delivered
                    </button>
                    <button class="btn-action btn-attempt" (click)="openAttempt(d)">
                      Log Attempt
                    </button>
                  }
                </div>
              </div>

              <div class="card-body">
                <div class="info-row"><i class="bi bi-person"></i> {{ d.customerName }}</div>
                <div class="info-row"><i class="bi bi-telephone"></i> {{ d.deliveryPhone }}</div>
                <div class="info-row">
                  <i class="bi bi-geo-alt"></i> {{ d.fullAddress }}{{ d.city ? ', ' + d.city : '' }}
                </div>
                <div class="info-row">
                  <i class="bi bi-calendar3"></i> {{ d.scheduledDate
                  }}{{ d.scheduledTimeSlot ? ' · ' + d.scheduledTimeSlot : '' }}
                </div>
                @if (d.attemptCount > 0) {
                  <div class="info-row text-warn">
                    <i class="bi bi-exclamation-circle"></i> {{ d.attemptCount }}/{{
                      d.maxAttempts
                    }}
                    attempts
                  </div>
                }
              </div>

              <div class="card-footer">
                <span class="amount">Rs {{ d.totalAmount | number }}</span>
                <span class="payment">{{ d.paymentMethod ?? 'Cash on Delivery' }}</span>
              </div>
            </div>
          }
        </div>
      }
    </div>

    <!-- Log Attempt Modal -->
    @if (attemptTarget()) {
      <div class="modal-overlay" (click)="attemptTarget.set(null)">
        <div class="modal modal-sm" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div>
              <h2>Log Attempt</h2>
              <p class="modal-sub">
                Record delivery attempt for #{{ attemptTarget()!.orderNumber }}
              </p>
            </div>
            <button class="btn-close" (click)="attemptTarget.set(null)">✕</button>
          </div>

          <div class="form-group">
            <label>Outcome</label>
            <div class="radio-row">
              <label class="radio-opt" [class.selected]="attemptForm.wasSuccessful === true">
                <input type="radio" [value]="true" [(ngModel)]="attemptForm.wasSuccessful" />
                Successful
              </label>
              <label class="radio-opt" [class.selected]="attemptForm.wasSuccessful === false">
                <input type="radio" [value]="false" [(ngModel)]="attemptForm.wasSuccessful" />
                Failed
              </label>
            </div>
          </div>

          @if (!attemptForm.wasSuccessful) {
            <div class="form-group">
              <label>Failure Reason</label>
              <select [(ngModel)]="attemptForm.failureReason">
                <option [value]="undefined">Select reason…</option>
                @for (r of failureReasons; track r.value) {
                  <option [value]="r.value">{{ r.label }}</option>
                }
              </select>
            </div>
            <div class="form-group">
              <label>Next Action</label>
              <select [(ngModel)]="attemptForm.nextAction">
                <option [value]="undefined">Select action…</option>
                @for (a of nextActions; track a.value) {
                  <option [value]="a.value">{{ a.label }}</option>
                }
              </select>
            </div>
          }

          <div class="form-group">
            <label>Notes (optional)</label>
            <textarea
              [(ngModel)]="attemptForm.failureNotes"
              rows="2"
              placeholder="Any additional notes…"
            ></textarea>
          </div>

          @if (attemptError()) {
            <div class="form-error">{{ attemptError() }}</div>
          }

          <div class="modal-actions">
            <button class="btn-secondary" (click)="attemptTarget.set(null)">Cancel</button>
            <button class="btn-primary" (click)="submitAttempt()" [disabled]="attemptSaving()">
              {{ attemptSaving() ? 'Saving…' : 'Submit' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .rd-page {
        max-width: 800px;
      }
      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 1.5rem;
      }
      h1 {
        font-size: 1.5rem;
        font-weight: 700;
        color: #0f172a;
        margin: 0;
      }
      .page-sub {
        color: #64748b;
        margin: 0.25rem 0 0;
        font-size: 0.875rem;
      }
      .btn-refresh {
        background: #f1f5f9;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 0.5rem 0.75rem;
        cursor: pointer;
        font-size: 1rem;
      }

      .empty-state {
        text-align: center;
        padding: 3rem 1rem;
        color: #64748b;
        h3 {
          font-size: 1rem;
          margin: 0.75rem 0 0.25rem;
          color: #374151;
        }
        .spinner {
          width: 32px;
          height: 32px;
          border: 3px solid #e2e8f0;
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          margin: 0 auto 0.75rem;
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      }

      .delivery-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .delivery-card {
        background: #fff;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        overflow: hidden;
      }

      .card-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.75rem 1rem;
        background: #f8fafc;
        border-bottom: 1px solid #e2e8f0;
        gap: 0.5rem;
        flex-wrap: wrap;
        .order-num {
          font-weight: 700;
          font-size: 0.9rem;
          color: #0f172a;
          margin-right: 0.5rem;
        }
      }

      .card-actions {
        display: flex;
        gap: 0.375rem;
        flex-wrap: wrap;
      }

      .btn-action {
        padding: 0.3rem 0.75rem;
        border-radius: 6px;
        font-size: 0.775rem;
        font-weight: 600;
        border: 1.5px solid;
        cursor: pointer;
        transition: all 0.15s;
      }
      .btn-pickup {
        background: #eff6ff;
        border-color: #bfdbfe;
        color: #2563eb;
      }
      .btn-out {
        background: #fff7ed;
        border-color: #fed7aa;
        color: #ea580c;
      }
      .btn-delivered {
        background: #f0fdf4;
        border-color: #bbf7d0;
        color: #16a34a;
      }
      .btn-attempt {
        background: #f0f9ff;
        border-color: #7dd3fc;
        color: #0284c7;
      }

      .card-body {
        padding: 0.875rem 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
      }

      .info-row {
        display: flex;
        align-items: flex-start;
        gap: 0.5rem;
        font-size: 0.825rem;
        color: #475569;
        i {
          flex-shrink: 0;
          margin-top: 1px;
          color: #94a3b8;
        }
      }
      .text-warn {
        color: #ea580c;
        i {
          color: #ea580c;
        }
      }

      .card-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.5rem 1rem;
        border-top: 1px solid #f1f5f9;
        .amount {
          font-weight: 700;
          font-size: 0.95rem;
          color: #0f172a;
        }
        .payment {
          font-size: 0.75rem;
          color: #64748b;
        }
      }

      .badge {
        display: inline-flex;
        align-items: center;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 0.7rem;
        font-weight: 600;
      }
      .badge-blue {
        background: #eff6ff;
        color: #2563eb;
      }
      .badge-green {
        background: #f0fdf4;
        color: #16a34a;
      }
      .badge-yellow {
        background: #fefce8;
        color: #ca8a04;
      }
      .badge-red {
        background: #fef2f2;
        color: #dc2626;
      }
      .badge-orange {
        background: #fff7ed;
        color: #ea580c;
      }
      .badge-purple {
        background: #faf5ff;
        color: #9333ea;
      }
      .badge-gray {
        background: #f8fafc;
        color: #64748b;
      }

      /* Modal */
      .modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 100;
      }
      .modal {
        background: #fff;
        border-radius: 12px;
        padding: 1.5rem;
        width: 100%;
        max-width: 440px;
        max-height: 90vh;
        overflow-y: auto;
      }
      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 1.25rem;
        h2 {
          font-size: 1.1rem;
          font-weight: 700;
          margin: 0;
        }
        .modal-sub {
          font-size: 0.8rem;
          color: #64748b;
          margin: 0.2rem 0 0;
        }
      }
      .btn-close {
        background: none;
        border: none;
        font-size: 1rem;
        cursor: pointer;
        color: #94a3b8;
        padding: 0;
      }
      .form-group {
        margin-bottom: 1rem;
        label {
          display: block;
          font-size: 0.8rem;
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.35rem;
        }
        select,
        textarea {
          width: 100%;
          border: 1.5px solid #e2e8f0;
          border-radius: 8px;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          outline: none;
        }
      }
      .radio-row {
        display: flex;
        gap: 0.75rem;
      }
      .radio-opt {
        display: flex;
        align-items: center;
        gap: 0.35rem;
        padding: 0.4rem 0.75rem;
        border: 1.5px solid #e2e8f0;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.85rem;
        &.selected {
          border-color: #3b82f6;
          background: #eff6ff;
          color: #2563eb;
        }
      }
      .modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.5rem;
        margin-top: 1.25rem;
      }
      .btn-primary {
        background: #2563eb;
        color: #fff;
        border: none;
        padding: 0.5rem 1.25rem;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        font-size: 0.875rem;
      }
      .btn-secondary {
        background: #f1f5f9;
        color: #374151;
        border: 1px solid #e2e8f0;
        padding: 0.5rem 1.25rem;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        font-size: 0.875rem;
      }
      .form-error {
        color: #dc2626;
        font-size: 0.8rem;
        margin-top: 0.5rem;
      }
      .modal-sm {
        max-width: 440px;
      }
    `,
  ],
})
export class RiderDeliveriesComponent implements OnInit {
  private riderService = inject(RiderService);

  readonly STATUS_LABELS = STATUS_LABELS;
  readonly STATUS_BADGE = STATUS_BADGE;
  readonly failureReasons = FAILURE_REASONS;
  readonly nextActions = NEXT_ACTIONS;

  deliveries = signal<any[]>([]);
  loading = signal(true);

  attemptTarget = signal<any>(null);
  attemptSaving = signal(false);
  attemptError = signal('');
  attemptForm = this.emptyAttemptForm();

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.riderService.getMyDeliveries().subscribe({
      next: (d) => {
        this.deliveries.set(d);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  quickStatus(id: number, status: number) {
    this.riderService.updateStatus(id, status).subscribe({ next: () => this.load() });
  }

  openAttempt(d: any) {
    this.attemptTarget.set(d);
    this.attemptForm = this.emptyAttemptForm();
    this.attemptError.set('');
  }

  submitAttempt() {
    const f = this.attemptForm;
    if (!f.wasSuccessful && !f.nextAction) {
      this.attemptError.set('Select a next action for failed attempts.');
      return;
    }
    this.attemptSaving.set(true);
    this.riderService
      .logAttempt(this.attemptTarget()!.id, {
        wasSuccessful: f.wasSuccessful,
        failureReason: f.wasSuccessful ? undefined : f.failureReason,
        failureNotes: f.failureNotes || undefined,
        nextAction: f.wasSuccessful ? undefined : f.nextAction,
      })
      .subscribe({
        next: () => {
          this.attemptSaving.set(false);
          this.attemptTarget.set(null);
          this.load();
        },
        error: (e: any) => {
          this.attemptSaving.set(false);
          this.attemptError.set(e.error?.message ?? 'Failed to submit.');
        },
      });
  }

  private emptyAttemptForm() {
    return {
      wasSuccessful: true as boolean,
      failureReason: undefined as number | undefined,
      failureNotes: '',
      nextAction: undefined as number | undefined,
    };
  }
}
