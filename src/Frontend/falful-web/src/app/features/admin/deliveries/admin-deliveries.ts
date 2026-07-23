import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../../core/services/order.service';
import { ReceiptService } from '../../../core/services/receipt.service';
import { ToastService } from '../../../core/services/toast.service';
import {
  DeliverySummary, DeliveryDetail, RiderUser,
  DELIVERY_STATUSES, DELIVERY_FAILURE_REASONS, DELIVERY_ISSUE_TYPES,
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

// Direct admin status transitions (no attempt log required)
const TRANSITIONS: Record<number, { status: number; label: string }[]> = {
  2: [ { status: 3, label: 'Mark Picked Up' },          { status: 1, label: 'Reset to Awaiting Rider' } ],
  3: [ { status: 4, label: 'Mark Out for Delivery' } ],
  6: [ { status: 8, label: 'Reschedule' },               { status: 9, label: 'Return to Warehouse' } ],
  7: [ { status: 4, label: 'Resume Delivery' },          { status: 8, label: 'Reschedule' }, { status: 9, label: 'Return to Warehouse' } ],
  8: [ { status: 1, label: 'Reset to Awaiting Rider' }, { status: 9, label: 'Return to Warehouse' } ],
};

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
  templateUrl: './admin-deliveries.html'
})
export class AdminDeliveriesComponent implements OnInit {
  private svc        = inject(OrderService);
  private receiptSvc = inject(ReceiptService);
  private toast      = inject(ToastService);

  deliveries    = signal<DeliverySummary[]>([]);
  loading       = signal(true);
  statusFilter  = signal(0);
  fromDate      = '';
  toDate        = '';

  detail              = signal<DeliveryDetail | null>(null);
  printingReceiptId   = signal<number | null>(null);
  assignModal      = signal<number | null>(null);
  isReassign       = signal(false);
  attemptModal     = signal<number | null>(null);
  issueModal       = signal<number | null>(null);
  transitionModal  = signal<{ id: number; from: number } | null>(null);

  resolvingIssueId = signal<number | null>(null);
  resolveNotes     = '';
  saving           = signal(false);

  riders        = signal<RiderUser[]>([]);
  ridersLoading = signal(false);
  ridersError   = signal('');
  ridersLoaded  = false;

  assignForm     = { riderId: 0 };
  attemptForm    = { wasSuccessful: true, failureReason: 0, failureNotes: '', nextAction: 0, rescheduledDate: '', rescheduledTimeSlot: '' };
  issueForm      = { issueType: 1, description: '' };
  transitionForm = { status: 0, trackingNotes: '', scheduledDate: '', scheduledTimeSlot: '' };

  readonly statusOpts     = STATUS_OPTS;
  readonly timeSlots      = signal<string[]>(['9:00 AM – 12:00 PM', '12:00 PM – 3:00 PM', '3:00 PM – 6:00 PM', '6:00 PM – 9:00 PM']);
  readonly failureReasons = FAILURE_REASONS_LIST;
  readonly issueTypes     = ISSUE_TYPES_LIST;
  readonly nextActions    = NEXT_ACTIONS;

  ngOnInit() {
    this.load();
    this.svc.getCheckoutConfig().subscribe({
      next: cfg => {
        const slots: string[] = [];
        let cur = cfg.slotStartHour * 60;
        const fmt = (m: number) => {
          const h = Math.floor(m / 60), mn = m % 60, ap = h < 12 ? 'AM' : 'PM';
          const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
          return mn === 0 ? `${h12}:00 ${ap}` : `${h12}:${String(mn).padStart(2,'0')} ${ap}`;
        };
        while (cur + cfg.slotIntervalMinutes <= cfg.slotEndHour * 60) {
          const end = cur + cfg.slotIntervalMinutes;
          slots.push(`${fmt(cur)} – ${fmt(end)}`);
          cur = end;
        }
        this.timeSlots.set(slots);
      },
      error: () => {}
    });
  }

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
  openAssign(id: number, status: number) {
    this.isReassign.set(status !== 1);
    this.assignForm = { riderId: 0 };
    this.assignModal.set(id);
    if (!this.ridersLoaded) {
      this.ridersLoading.set(true);
      this.ridersError.set('');
      this.svc.getRiders().subscribe({
        next: list => { this.riders.set(list); this.ridersLoading.set(false); this.ridersLoaded = true; },
        error: (err) => {
          this.ridersLoading.set(false);
          this.ridersLoaded = false;
          this.ridersError.set(err?.error?.message ?? `Failed to load riders (${err?.status ?? 'network error'})`);
        },
      });
    }
  }

  submitAssign() {
    const id = this.assignModal();
    if (!id || !this.assignForm.riderId) return;
    this.saving.set(true);
    this.svc.assignRider(id, this.assignForm.riderId).subscribe({
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

  // ── Transition ────────────────────────────────────────────────────────────────
  availableTransitions(from: number) { return TRANSITIONS[from] ?? []; }

  openTransition(id: number, from: number) {
    this.transitionForm = { status: 0, trackingNotes: '', scheduledDate: '', scheduledTimeSlot: '' };
    this.transitionModal.set({ id, from });
  }

  submitTransition() {
    const m = this.transitionModal();
    if (!m || !this.transitionForm.status) return;
    this.saving.set(true);
    const isReschedule      = this.transitionForm.status === 8;
    const scheduledDate     = isReschedule ? this.transitionForm.scheduledDate || undefined : undefined;
    const scheduledTimeSlot = isReschedule ? this.transitionForm.scheduledTimeSlot || undefined : undefined;
    this.svc.updateDeliveryStatus(m.id, this.transitionForm.status, this.transitionForm.trackingNotes || undefined, scheduledDate, scheduledTimeSlot).subscribe({
      next: () => { this.transitionModal.set(null); this.saving.set(false); this.load(); },
      error: () => this.saving.set(false),
    });
  }

  // ── Print Receipt ─────────────────────────────────────────────────────────────
  printReceipt(orderId: number) {
    const win = window.open('', '_blank');
    if (!win) { this.toast.warn('Allow popups to print receipts.'); return; }
    this.printingReceiptId.set(orderId);
    this.receiptSvc.adminGetReceipt(orderId).subscribe({
      next: r => {
        this.printingReceiptId.set(null);
        const html = r.html.replace(
          '</body>',
          `<script>window.addEventListener('load',function(){setTimeout(function(){window.print();},400);});</script></body>`
        );
        win.document.open();
        win.document.write(html);
        win.document.close();
      },
      error: () => {
        this.printingReceiptId.set(null);
        win.close();
        this.toast.error('Could not load receipt.');
      }
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

  // AwaitingRider(1), RiderAssigned(2), DeliveryFailed(6), CustomerUnavailable(7), Rescheduled(8)
  canAssign(s: number)     { return [1, 2, 6, 7, 8].includes(s); }
  // Active/failed states where a delivery attempt can be logged
  canLogAttempt(s: number) { return [2, 3, 4, 6, 7].includes(s); }
  // Terminal states Delivered(5) and Returned(9) no longer accept issues
  canReportIssue(s: number){ return ![5, 9].includes(s); }
}
