import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RiderService } from '../../core/services/rider.service';
import { ReceiptService } from '../../core/services/receipt.service';
import { ToastService } from '../../core/services/toast.service';
import { ApiService } from '../../core/services/api.service';
import { ImageUrlService } from '../../core/services/image-url.service';

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

const PAYMENT_LABELS: Record<number, string> = {
  1: 'Cash on Delivery',
  2: 'Online Payment',
  3: 'Card on Delivery',
};

interface BowlDetails {
  container: string;
  totalGrams?: number;
  containerFee?: number;
  fruits: { productId: number; name: string; grams: number; price?: number }[];
}

@Component({
  selector: 'app-rider-deliveries',
  standalone: true,
  imports: [FormsModule, DatePipe, DecimalPipe],
  templateUrl: './rider-deliveries.html',
  styleUrl: './rider-deliveries.scss',
})
export class RiderDeliveriesComponent implements OnInit {
  private riderService = inject(RiderService);
  private receiptSvc   = inject(ReceiptService);
  private toast        = inject(ToastService);
  private api          = inject(ApiService);
  private imgSvc       = inject(ImageUrlService);

  readonly STATUS_LABELS = STATUS_LABELS;
  readonly STATUS_BADGE = STATUS_BADGE;
  readonly PAYMENT_LABELS = PAYMENT_LABELS;
  readonly failureReasons = FAILURE_REASONS;
  readonly nextActions = NEXT_ACTIONS;

  deliveries = signal<any[]>([]);
  loading = signal(true);

  detail = signal<any>(null);
  printingReceiptId = signal<number | null>(null);

  completeTarget = signal<any>(null);
  completeSaving = signal(false);
  completeError = signal('');
  uploadingProof = signal(false);
  completeForm = this.emptyCompleteForm();

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

  viewDetail(id: number) {
    this.riderService.getDeliveryDetail(id).subscribe({
      next: d => this.detail.set(d),
    });
  }

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

  openComplete(d: any) {
    this.completeTarget.set(d);
    this.completeForm = { collectedAmount: d.remainingBalance, proofPhotoUrl: '', collectionRemarks: '' };
    this.completeError.set('');
  }

  submitComplete() {
    const f = this.completeForm;
    if (f.collectedAmount < 0) {
      this.completeError.set('Collected amount cannot be negative.');
      return;
    }
    this.completeSaving.set(true);
    this.riderService
      .completeDelivery(this.completeTarget()!.id, {
        collectedAmount: f.collectedAmount,
        proofPhotoUrl: f.proofPhotoUrl || undefined,
        collectionRemarks: f.collectionRemarks || undefined,
      })
      .subscribe({
        next: () => {
          this.completeSaving.set(false);
          this.completeTarget.set(null);
          this.load();
        },
        error: (e: any) => {
          this.completeSaving.set(false);
          this.completeError.set(e.error?.message ?? 'Failed to complete delivery.');
        },
      });
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

  parseBowlDetails(json?: string): BowlDetails | null {
    if (!json) return null;
    try { return JSON.parse(json) as BowlDetails; }
    catch { return null; }
  }

  bowlTotalGrams(bowl: BowlDetails): number {
    return bowl.totalGrams ?? bowl.fruits.reduce((s, f) => s + f.grams, 0);
  }

  isPdfProof(url: string): boolean {
    return url.toLowerCase().endsWith('.pdf');
  }

  removeProof() {
    this.completeForm.proofPhotoUrl = '';
  }

  onProofSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    input.value = '';

    const form = new FormData();
    form.append('file', file);
    this.uploadingProof.set(true);
    this.api.upload<{ url: string }>('/api/upload', form).subscribe({
      next: r => {
        this.uploadingProof.set(false);
        this.completeForm.proofPhotoUrl = this.imgSvc.resolve(r.url);
      },
      error: () => {
        this.uploadingProof.set(false);
        this.toast.error('Upload failed. Please try again.');
      },
    });
  }

  private emptyCompleteForm() {
    return { collectedAmount: 0, proofPhotoUrl: '', collectionRemarks: '' };
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
