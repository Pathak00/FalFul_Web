import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../../core/services/order.service';
import {
  DeliverySummary, DeliveryDetail,
  DELIVERY_STATUSES, DELIVERY_FAILURE_REASONS, DELIVERY_ISSUE_TYPES, DELIVERY_TIME_SLOTS,
  PAYMENT_METHODS,
} from '../../../core/models/order.models';

const STATUS_OPTS = [
  { value: 0, label: 'All'                },
  { value: 1, label: 'Awaiting Rider'     },
  { value: 2, label: 'Rider Assigned'     },
  { value: 3, label: 'Picked Up'          },
  { value: 4, label: 'Out for Delivery'   },
  { value: 5, label: 'Delivered'          },
  { value: 6, label: 'Delivery Failed'    },
  { value: 7, label: 'Customer Unavailable' },
  { value: 8, label: 'Rescheduled'        },
  { value: 9, label: 'Returned'           },
];

const NEXT_ACTIONS = [
  { value: 1, label: 'Reschedule' },
  { value: 2, label: 'Return to Warehouse' },
  { value: 3, label: 'Retry Next Attempt' },
  { value: 4, label: 'Customer Unavailable' },
];

const NEXT_ACTION_MAP: Record<number, string> = {
  1: 'Reschedule', 2: 'Return to Warehouse', 3: 'Retry Next Attempt', 4: 'Customer Unavailable',
};

const FAILURE_REASONS_LIST = Object.entries(DELIVERY_FAILURE_REASONS).map(([k, v]) => ({ value: +k, label: v }));
const ISSUE_TYPES_LIST      = Object.entries(DELIVERY_ISSUE_TYPES).map(([k, v]) => ({ value: +k, label: v }));

@Component({
  selector: 'app-admin-deliveries',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  styleUrl: '../admin-shared.scss',
  template: `
    <div class="admin-page" style="max-width:1200px">
      <div class="page-header">
        <div>
          <h1>Deliveries</h1>
          <p class="page-sub">Track and manage delivery status, assign riders, log attempts, and resolve issues.</p>
        </div>
      </div>

      <!-- Filter bar -->
      <div class="filter-bar" style="flex-wrap:wrap;gap:.4rem .5rem">
        @for (opt of statusOpts; track opt.value) {
          <button class="filter-btn" [class.active]="statusFilter() === opt.value" (click)="setFilter(opt.value)">
            {{ opt.label }}
          </button>
        }
        <div style="margin-left:auto;display:flex;gap:.5rem;align-items:center">
          <input type="date" [(ngModel)]="fromDate" (change)="load()" style="font-size:.8rem">
          <span style="color:#9ca3af;font-size:.8rem">–</span>
          <input type="date" [(ngModel)]="toDate" (change)="load()" style="font-size:.8rem">
        </div>
      </div>

      @if (loading()) {
        <div class="loading-state"><div class="spin"><i class="bi bi-arrow-clockwise"></i></div> Loading deliveries…</div>
      } @else if (deliveries().length === 0) {
        <div class="empty-state">
          <i class="bi bi-bicycle empty-icon"></i>
          <h3>No deliveries found</h3>
          <p>Try adjusting the status filter or date range.</p>
        </div>
      } @else {
        <div class="data-table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Scheduled</th>
                <th>Rider</th>
                <th>Status</th>
                <th style="text-align:center">Attempts</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (d of deliveries(); track d.id) {
                <tr>
                  <td><span class="order-num">{{ d.orderNumber }}</span></td>
                  <td>
                    <div style="font-weight:600;font-size:.82rem;color:#111">{{ d.customerName }}</div>
                    <div style="font-size:.72rem;color:#9ca3af">{{ d.city }}</div>
                  </td>
                  <td>
                    <div style="font-size:.78rem;color:#374151">{{ d.scheduledDate | date:'dd MMM':'Asia/Kathmandu' }}</div>
                    <div style="font-size:.7rem;color:#9ca3af">{{ d.scheduledTimeSlot }}</div>
                  </td>
                  <td style="font-size:.8rem" [style.color]="d.riderName ? '#374151' : '#9ca3af'">
                    {{ d.riderName || '—' }}
                  </td>
                  <td>
                    <span class="status-badge"
                          [style.background]="statusBg(d.status)"
                          [style.color]="statusColor(d.status)">
                      <i class="bi {{ statusIcon(d.status) }}" style="margin-right:.2rem"></i>{{ statusLabel(d.status) }}
                    </span>
                  </td>
                  <td style="text-align:center;font-size:.8rem"
                      [style.color]="d.attemptCount > 0 ? '#374151' : '#9ca3af'">
                    {{ d.attemptCount }}/{{ d.maxAttempts }}
                  </td>
                  <td>
                    <div style="display:flex;gap:.3rem;flex-wrap:wrap">
                      <button class="tbl-btn" title="View details" (click)="viewDetail(d.id)">
                        <i class="bi bi-eye"></i>
                      </button>
                      @if (canAssign(d.status)) {
                        <button class="tbl-btn tbl-btn-action" (click)="openAssign(d.id)">Assign</button>
                      }
                      @if (canLogAttempt(d.status)) {
                        <button class="tbl-btn tbl-btn-action" (click)="openAttempt(d.id)">Log Attempt</button>
                      }
                      @if (canReportIssue(d.status)) {
                        <button class="tbl-btn" style="color:#ef4444;border-color:#fca5a5;background:#fff5f5"
                                (click)="openIssue(d.id)">Issue</button>
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

    <!-- ─── Assign Rider Modal ─── -->
    @if (assignModal() !== null) {
      <div class="modal-overlay" (click)="assignModal.set(null)">
        <div class="modal-box" style="width:440px" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Assign Rider</h3>
            <button class="modal-close" (click)="assignModal.set(null)"><i class="bi bi-x-lg"></i></button>
          </div>
          <div class="form-group">
            <label>Rider Name <span class="required">*</span></label>
            <input type="text" [(ngModel)]="assignForm.riderName" placeholder="Full name">
          </div>
          <div class="form-group">
            <label>Rider Phone <span class="required">*</span></label>
            <input type="tel" [(ngModel)]="assignForm.riderPhone" placeholder="98XXXXXXXX">
          </div>
          <div class="modal-footer">
            <button class="btn-secondary btn-sm" (click)="assignModal.set(null)">Cancel</button>
            <button class="btn-primary btn-sm" [disabled]="saving() || !assignForm.riderName || !assignForm.riderPhone"
                    (click)="submitAssign()">
              @if (saving()) { <i class="bi bi-arrow-clockwise spin"></i> } Assign Rider
            </button>
          </div>
        </div>
      </div>
    }

    <!-- ─── Log Attempt Modal ─── -->
    @if (attemptModal() !== null) {
      <div class="modal-overlay" (click)="attemptModal.set(null)">
        <div class="modal-box" style="width:480px" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Log Delivery Attempt</h3>
            <button class="modal-close" (click)="attemptModal.set(null)"><i class="bi bi-x-lg"></i></button>
          </div>

          <div class="form-toggle-row">
            <label class="toggle-label" (click)="attemptForm.wasSuccessful = !attemptForm.wasSuccessful">
              <div class="toggle" [class.on]="attemptForm.wasSuccessful"><div class="toggle-thumb"></div></div>
              <div>
                <strong>{{ attemptForm.wasSuccessful ? 'Successful Delivery' : 'Failed Attempt' }}</strong>
                <span>{{ attemptForm.wasSuccessful ? 'Order delivered to customer.' : 'Delivery could not be completed.' }}</span>
              </div>
            </label>
          </div>

          @if (!attemptForm.wasSuccessful) {
            <div class="form-group" style="margin-top:.875rem">
              <label>Failure Reason</label>
              <select [(ngModel)]="attemptForm.failureReason">
                <option [ngValue]="0">Select a reason…</option>
                @for (r of failureReasons; track r.value) {
                  <option [ngValue]="r.value">{{ r.label }}</option>
                }
              </select>
            </div>
            <div class="form-group">
              <label>Failure Notes <span class="field-hint">(optional)</span></label>
              <textarea [(ngModel)]="attemptForm.failureNotes" rows="2" placeholder="Additional context…"></textarea>
            </div>
            <div class="form-group">
              <label>Next Action</label>
              <select [(ngModel)]="attemptForm.nextAction">
                <option [ngValue]="0">Select next action…</option>
                @for (a of nextActions; track a.value) {
                  <option [ngValue]="a.value">{{ a.label }}</option>
                }
              </select>
            </div>
            @if (attemptForm.nextAction === 1) {
              <div class="form-row">
                <div class="form-group">
                  <label>Reschedule Date</label>
                  <input type="date" [(ngModel)]="attemptForm.rescheduledDate">
                </div>
                <div class="form-group">
                  <label>Time Slot</label>
                  <select [(ngModel)]="attemptForm.rescheduledTimeSlot">
                    <option value="">Select slot…</option>
                    @for (s of timeSlots; track s) {
                      <option [value]="s">{{ s }}</option>
                    }
                  </select>
                </div>
              </div>
            }
          }

          <div class="modal-footer">
            <button class="btn-secondary btn-sm" (click)="attemptModal.set(null)">Cancel</button>
            <button class="btn-primary btn-sm" [disabled]="saving()" (click)="submitAttempt()">
              @if (saving()) { <i class="bi bi-arrow-clockwise spin"></i> } Log Attempt
            </button>
          </div>
        </div>
      </div>
    }

    <!-- ─── Report Issue Modal ─── -->
    @if (issueModal() !== null) {
      <div class="modal-overlay" (click)="issueModal.set(null)">
        <div class="modal-box" style="width:440px" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Report Issue</h3>
            <button class="modal-close" (click)="issueModal.set(null)"><i class="bi bi-x-lg"></i></button>
          </div>
          <div class="form-group">
            <label>Issue Type <span class="required">*</span></label>
            <select [(ngModel)]="issueForm.issueType">
              @for (t of issueTypes; track t.value) {
                <option [ngValue]="t.value">{{ t.label }}</option>
              }
            </select>
          </div>
          <div class="form-group">
            <label>Description <span class="required">*</span></label>
            <textarea [(ngModel)]="issueForm.description" rows="3" placeholder="Describe the issue in detail…"></textarea>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary btn-sm" (click)="issueModal.set(null)">Cancel</button>
            <button class="btn-primary btn-sm" [disabled]="saving() || !issueForm.description"
                    (click)="submitIssue()">
              @if (saving()) { <i class="bi bi-arrow-clockwise spin"></i> } Submit Issue
            </button>
          </div>
        </div>
      </div>
    }

    <!-- ─── Detail Modal ─── -->
    @if (detail()) {
      <div class="modal-overlay" (click)="closeDetail()">
        <div class="modal-box wide-modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3><i class="bi bi-bicycle" style="color:#06b6d4;margin-right:.4rem"></i>Delivery — {{ detail()!.orderNumber }}</h3>
            <button class="modal-close" (click)="closeDetail()"><i class="bi bi-x-lg"></i></button>
          </div>

          <!-- Info grid -->
          <div class="detail-meta" style="grid-template-columns:repeat(3,1fr);gap:.625rem 1rem">
            <div><span class="dm-label">Customer</span><span>{{ detail()!.customerName }}</span></div>
            <div><span class="dm-label">Phone</span><span>{{ detail()!.deliveryPhone }}</span></div>
            <div><span class="dm-label">Status</span>
              <span class="status-badge" [style.background]="statusBg(detail()!.status)" [style.color]="statusColor(detail()!.status)">
                <i class="bi {{ statusIcon(detail()!.status) }}" style="margin-right:.2rem"></i>{{ statusLabel(detail()!.status) }}
              </span>
            </div>
            <div style="grid-column:span 2"><span class="dm-label">Address</span><span>{{ detail()!.fullAddress }}, {{ detail()!.city }}{{ detail()!.landmark ? ' · ' + detail()!.landmark : '' }}</span></div>
            <div><span class="dm-label">Attempts</span><span>{{ detail()!.attemptCount }} / {{ detail()!.maxAttempts }}</span></div>
            <div><span class="dm-label">Scheduled</span><span>{{ detail()!.scheduledDate | date:'dd MMM yyyy':'Asia/Kathmandu' }} · {{ detail()!.scheduledTimeSlot }}</span></div>
            <div><span class="dm-label">Rider</span><span>{{ detail()!.riderName || '—' }}{{ detail()!.riderPhone ? ' · ' + detail()!.riderPhone : '' }}</span></div>
            <div><span class="dm-label">Payment</span><span>{{ paymentLabel(detail()!.paymentMethod) }} · Rs.{{ detail()!.totalAmount | number:'1.0-0' }}</span></div>
            @if (detail()!.trackingNotes) {
              <div style="grid-column:span 3"><span class="dm-label">Tracking Notes</span><span>{{ detail()!.trackingNotes }}</span></div>
            }
            @if (detail()!.orderNotes) {
              <div style="grid-column:span 3"><span class="dm-label">Order Notes</span><span>{{ detail()!.orderNotes }}</span></div>
            }
          </div>

          <!-- Attempts -->
          @if (detail()!.attempts?.length) {
            <div style="margin-top:1.25rem">
              <p style="font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#64748b;margin:0 0 .5rem">
                Delivery Attempts
              </p>
              <div style="display:flex;flex-direction:column;gap:.4rem">
                @for (a of detail()!.attempts; track a.id) {
                  <div style="border-radius:8px;padding:.625rem .875rem;font-size:.82rem"
                       [style.background]="a.wasSuccessful ? '#f0fdf4' : '#fffbeb'"
                       [style.border]="'1px solid ' + (a.wasSuccessful ? '#bbf7d0' : '#fde68a')">
                    <div style="display:flex;justify-content:space-between;align-items:center">
                      <div style="display:flex;align-items:center;gap:.5rem">
                        <span style="font-weight:700;color:#111">Attempt #{{ a.attemptNumber }}</span>
                        @if (a.wasSuccessful) {
                          <span style="color:#16a34a;font-weight:600;font-size:.78rem">
                            <i class="bi bi-check-circle-fill"></i> Delivered
                          </span>
                        } @else {
                          <span style="color:#b45309;font-weight:600;font-size:.78rem">
                            <i class="bi bi-x-circle-fill"></i> Failed
                          </span>
                          @if (a.failureReasonLabel || a.failureReason) {
                            <span style="color:#6b7280;font-size:.76rem">· {{ a.failureReasonLabel || failureLabel(a.failureReason) }}</span>
                          }
                        }
                      </div>
                      <span style="font-size:.72rem;color:#9ca3af">{{ a.attemptedAt | date:'dd MMM, h:mm a':'Asia/Kathmandu' }}</span>
                    </div>
                    @if (!a.wasSuccessful) {
                      @if (a.failureNotes) {
                        <p style="margin:.25rem 0 0;color:#6b7280;font-size:.78rem">{{ a.failureNotes }}</p>
                      }
                      @if (a.nextAction) {
                        <p style="margin:.25rem 0 0;color:#7c3aed;font-size:.76rem">
                          <i class="bi bi-arrow-right-circle"></i>
                          Next: {{ a.nextActionLabel || nextActionMap(a.nextAction) }}
                          @if (a.rescheduledDate) {
                            — {{ a.rescheduledDate | date:'dd MMM' }} {{ a.rescheduledTimeSlot ? '· ' + a.rescheduledTimeSlot : '' }}
                          }
                        </p>
                      }
                    }
                  </div>
                }
              </div>
            </div>
          } @else {
            <p style="margin-top:1rem;font-size:.82rem;color:#9ca3af;font-style:italic">No attempts recorded yet.</p>
          }

          <!-- Issues -->
          @if (detail()!.issues?.length) {
            <div style="margin-top:1.25rem">
              <p style="font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#64748b;margin:0 0 .5rem">
                Issues
              </p>
              <div style="display:flex;flex-direction:column;gap:.4rem">
                @for (issue of detail()!.issues; track issue.id) {
                  <div style="border-radius:8px;padding:.625rem .875rem;font-size:.82rem"
                       [style.background]="issue.isResolved ? '#f8fafc' : '#fef2f2'"
                       [style.border]="'1px solid ' + (issue.isResolved ? '#e2e8f0' : '#fecaca')">
                    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:.75rem">
                      <div style="flex:1">
                        <div style="display:flex;align-items:center;gap:.5rem;flex-wrap:wrap">
                          <strong style="color:#111">{{ issue.issueTypeLabel }}</strong>
                          @if (issue.isResolved) {
                            <span style="color:#16a34a;font-size:.72rem;font-weight:600">
                              <i class="bi bi-check-circle-fill"></i> Resolved
                            </span>
                          } @else {
                            <span style="color:#dc2626;font-size:.72rem;font-weight:600">
                              <i class="bi bi-exclamation-circle-fill"></i> Open
                            </span>
                          }
                          <span style="color:#9ca3af;font-size:.72rem;margin-left:auto">{{ issue.reportedAt | date:'dd MMM, h:mm a':'Asia/Kathmandu' }}</span>
                        </div>
                        <p style="margin:.3rem 0 0;color:#374151">{{ issue.description }}</p>
                        @if (issue.isResolved && issue.resolutionNotes) {
                          <p style="margin:.25rem 0 0;color:#6b7280;font-size:.78rem;font-style:italic">
                            Resolution: {{ issue.resolutionNotes }}
                          </p>
                        }
                        @if (resolvingIssueId() === issue.id) {
                          <div style="margin-top:.625rem">
                            <textarea [(ngModel)]="resolveNotes" rows="2"
                                      style="width:100%;border:1px solid #d1d5db;border-radius:6px;padding:.4rem .625rem;font-size:.82rem;font-family:inherit;resize:vertical;box-sizing:border-box"
                                      placeholder="Resolution notes (optional)…"></textarea>
                            <div style="display:flex;gap:.4rem;margin-top:.375rem">
                              <button class="btn-sm btn-primary" [disabled]="saving()" (click)="confirmResolve(issue.id)">
                                @if (saving()) { <i class="bi bi-arrow-clockwise spin"></i> } Confirm
                              </button>
                              <button class="btn-sm btn-secondary" (click)="resolvingIssueId.set(null)">Cancel</button>
                            </div>
                          </div>
                        }
                      </div>
                      @if (!issue.isResolved && resolvingIssueId() !== issue.id) {
                        <button class="btn-sm btn-edit" (click)="startResolve(issue.id)">
                          <i class="bi bi-check2"></i> Resolve
                        </button>
                      }
                    </div>
                  </div>
                }
              </div>
            </div>
          }
        </div>
      </div>
    }
  `
})
export class AdminDeliveriesComponent implements OnInit {
  private svc = inject(OrderService);

  deliveries    = signal<DeliverySummary[]>([]);
  loading       = signal(true);
  statusFilter  = signal(0);
  fromDate      = '';
  toDate        = '';

  detail        = signal<DeliveryDetail | null>(null);
  assignModal   = signal<number | null>(null);
  attemptModal  = signal<number | null>(null);
  issueModal    = signal<number | null>(null);

  resolvingIssueId = signal<number | null>(null);
  resolveNotes     = '';
  saving           = signal(false);

  assignForm  = { riderName: '', riderPhone: '' };
  attemptForm = { wasSuccessful: true, failureReason: 0, failureNotes: '', nextAction: 0, rescheduledDate: '', rescheduledTimeSlot: '' };
  issueForm   = { issueType: 1, description: '' };

  readonly statusOpts     = STATUS_OPTS;
  readonly timeSlots      = DELIVERY_TIME_SLOTS;
  readonly failureReasons = FAILURE_REASONS_LIST;
  readonly issueTypes     = ISSUE_TYPES_LIST;
  readonly nextActions    = NEXT_ACTIONS;

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    const s = this.statusFilter() || undefined;
    const f = this.fromDate || undefined;
    const t = this.toDate   || undefined;
    this.svc.getAllDeliveries(s, f, t).subscribe({
      next: list => { this.deliveries.set(list); this.loading.set(false); },
      error: ()  => this.loading.set(false),
    });
  }

  setFilter(v: number) { this.statusFilter.set(v); this.load(); }

  viewDetail(id: number) {
    this.resolvingIssueId.set(null);
    this.svc.getDeliveryById(id).subscribe({ next: d => this.detail.set(d) });
  }

  closeDetail() { this.detail.set(null); this.resolvingIssueId.set(null); }

  // ── Assign ───────────────────────────────────────────────────────────────────
  openAssign(id: number) {
    this.assignForm = { riderName: '', riderPhone: '' };
    this.assignModal.set(id);
  }

  submitAssign() {
    const id = this.assignModal();
    if (!id) return;
    this.saving.set(true);
    this.svc.assignRider(id, this.assignForm.riderName, this.assignForm.riderPhone).subscribe({
      next: () => { this.assignModal.set(null); this.saving.set(false); this.load(); },
      error: () => this.saving.set(false),
    });
  }

  // ── Log Attempt ───────────────────────────────────────────────────────────────
  openAttempt(id: number) {
    this.attemptForm = { wasSuccessful: true, failureReason: 0, failureNotes: '', nextAction: 0, rescheduledDate: '', rescheduledTimeSlot: '' };
    this.attemptModal.set(id);
  }

  submitAttempt() {
    const id = this.attemptModal();
    if (!id) return;
    this.saving.set(true);
    const dto: Record<string, unknown> = { wasSuccessful: this.attemptForm.wasSuccessful };
    if (!this.attemptForm.wasSuccessful) {
      if (this.attemptForm.failureReason)  dto['failureReason']  = this.attemptForm.failureReason;
      if (this.attemptForm.failureNotes)   dto['failureNotes']   = this.attemptForm.failureNotes;
      if (this.attemptForm.nextAction)     dto['nextAction']     = this.attemptForm.nextAction;
      if (this.attemptForm.nextAction === 1) {
        if (this.attemptForm.rescheduledDate)     dto['rescheduledDate']     = this.attemptForm.rescheduledDate;
        if (this.attemptForm.rescheduledTimeSlot) dto['rescheduledTimeSlot'] = this.attemptForm.rescheduledTimeSlot;
      }
    }
    this.svc.logDeliveryAttempt(id, dto).subscribe({
      next: () => { this.attemptModal.set(null); this.saving.set(false); this.load(); },
      error: () => this.saving.set(false),
    });
  }

  // ── Report Issue ──────────────────────────────────────────────────────────────
  openIssue(id: number) {
    this.issueForm = { issueType: 1, description: '' };
    this.issueModal.set(id);
  }

  submitIssue() {
    const id = this.issueModal();
    if (!id) return;
    this.saving.set(true);
    this.svc.reportDeliveryIssue(id, { issueType: this.issueForm.issueType, description: this.issueForm.description }).subscribe({
      next: () => {
        this.issueModal.set(null); this.saving.set(false);
        const d = this.detail();
        if (d) this.viewDetail(d.id);
        else this.load();
      },
      error: () => this.saving.set(false),
    });
  }

  // ── Resolve Issue ─────────────────────────────────────────────────────────────
  startResolve(issueId: number) {
    this.resolveNotes = '';
    this.resolvingIssueId.set(issueId);
  }

  confirmResolve(issueId: number) {
    this.saving.set(true);
    this.svc.resolveDeliveryIssue(issueId, this.resolveNotes || undefined).subscribe({
      next: () => {
        this.resolvingIssueId.set(null);
        this.saving.set(false);
        const d = this.detail();
        if (d) this.viewDetail(d.id);
      },
      error: () => this.saving.set(false),
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────────
  statusLabel(s: number)   { return DELIVERY_STATUSES[s]?.label ?? 'Unknown'; }
  statusColor(s: number)   { return DELIVERY_STATUSES[s]?.color ?? '#6b7280'; }
  statusBg(s: number)      { return (DELIVERY_STATUSES[s]?.color ?? '#6b7280') + '1a'; }
  statusIcon(s: number)    { return DELIVERY_STATUSES[s]?.icon  ?? 'bi-question'; }
  failureLabel(n?: number) { return n ? (DELIVERY_FAILURE_REASONS[n] ?? 'Unknown') : '—'; }
  nextActionMap(n?: number){ return n ? (NEXT_ACTION_MAP[n] ?? 'Unknown') : '—'; }
  paymentLabel(n: number)  { return PAYMENT_METHODS[n] ?? 'Unknown'; }

  // AwaitingRider(1) or Rescheduled(8): rider needs to be assigned
  canAssign(s: number)     { return s === 1 || s === 8; }
  // Active/failed states where a delivery attempt can be logged
  canLogAttempt(s: number) { return [2, 3, 4, 6, 7].includes(s); }
  // Terminal states Delivered(5) and Returned(9) no longer accept issues
  canReportIssue(s: number){ return ![5, 9].includes(s); }
}
