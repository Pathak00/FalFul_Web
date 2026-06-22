import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaymentService } from '../../../core/services/payment.service';
import { ToastService } from '../../../core/services/toast.service';
import { NepalDatePipe } from '../../../core/pipes/nepal-date.pipe';
import {
  PaymentDto,
  PaymentMethodDto,
  PaymentSettingsDto,
  PaymentMethodUpdateDto,
  PaymentReport,
} from '../../../core/models/payment.models';

type Tab = 'transactions' | 'methods' | 'settings';

@Component({
  selector: 'app-admin-payments',
  standalone: true,
  imports: [CommonModule, FormsModule, NepalDatePipe],
  templateUrl: './admin-payments.html',
  styleUrl: './admin-payments.scss',
})
export class AdminPaymentsComponent implements OnInit {
  private svc = inject(PaymentService);
  private toast = inject(ToastService);

  tab = signal<Tab>('transactions');

  // ── Transactions ──────────────────────────────────────────────────────────────
  payments = signal<PaymentDto[]>([]);
  report = signal<PaymentReport | null>(null);
  txLoading = signal(false);
  confirmingId = signal<number | null>(null);

  filterMethod = undefined as number | undefined;
  filterStatus = undefined as number | undefined;
  filterFrom = '';
  filterTo = '';

  // ── Methods ───────────────────────────────────────────────────────────────────
  allMethods = signal<PaymentMethodDto[]>([]);
  methodsLoading = signal(false);
  togglingId = signal<number | null>(null);

  editTarget = signal<PaymentMethodDto | null>(null);
  editForm = { displayOrder: 0, iconUrl: '', description: '' };
  methodSaving = signal(false);
  methodSaveError = signal('');

  // ── Settings ──────────────────────────────────────────────────────────────────
  settingsLoading = signal(false);
  settingsSaving = signal(false);
  settingsError = signal('');
  settingsForm = { advanceEnabled: false, advancePercent: 30, minAdvanceAmount: 100 };

  ngOnInit() {
    this.loadTransactions();
    this.loadMethods();
  }

  // ── Transactions ──────────────────────────────────────────────────────────────
  loadTransactions() {
    this.txLoading.set(true);
    this.svc
      .getAllPayments(
        this.filterMethod,
        this.filterStatus,
        this.filterFrom || undefined,
        this.filterTo || undefined,
      )
      .subscribe({
        next: (list) => {
          this.payments.set(list);
          this.txLoading.set(false);
        },
        error: () => this.txLoading.set(false),
      });

    this.svc
      .getPaymentReport(this.filterFrom || undefined, this.filterTo || undefined)
      .subscribe({ next: (r) => this.report.set(r), error: () => {} });
  }

  confirmCod(paymentId: number) {
    this.confirmingId.set(paymentId);
    this.svc.confirmCod(paymentId).subscribe({
      next: () => {
        this.confirmingId.set(null);
        this.toast.success('COD payment confirmed.');
        this.payments.update((list) =>
          list.map((p) => (p.id === paymentId ? { ...p, status: 2, statusLabel: 'Completed' } : p)),
        );
      },
      error: (e: { error?: { message?: string } }) => {
        this.confirmingId.set(null);
        this.toast.error(e?.error?.message ?? 'Failed to confirm COD.');
      },
    });
  }

  // ── Methods ───────────────────────────────────────────────────────────────────
  loadMethods() {
    this.methodsLoading.set(true);
    this.svc.getAllMethods().subscribe({
      next: (list) => {
        this.allMethods.set(list);
        this.methodsLoading.set(false);
      },
      error: () => this.methodsLoading.set(false),
    });
  }

  switchToMethods() {
    this.tab.set('methods');
    if (this.allMethods().length === 0) this.loadMethods();
  }

  toggleMethod(m: PaymentMethodDto) {
    this.togglingId.set(m.id);
    this.svc.updateMethod(m.id, { isEnabled: !m.isEnabled }).subscribe({
      next: () => {
        this.togglingId.set(null);
        this.allMethods.update((list) =>
          list.map((x) => (x.id === m.id ? { ...x, isEnabled: !m.isEnabled } : x)),
        );
        this.toast.success(`${m.name} ${m.isEnabled ? 'disabled' : 'enabled'}.`);
      },
      error: (e: { error?: { message?: string } }) => {
        this.togglingId.set(null);
        this.toast.error(e?.error?.message ?? 'Failed to update method.');
      },
    });
  }

  openEditMethod(m: PaymentMethodDto) {
    this.editTarget.set(m);
    this.editForm = {
      displayOrder: m.displayOrder,
      iconUrl: m.iconUrl ?? '',
      description: m.description ?? '',
    };
    this.methodSaveError.set('');
  }

  closeEditMethod() {
    this.editTarget.set(null);
  }

  saveEditMethod() {
    const m = this.editTarget();
    if (!m) return;
    this.methodSaving.set(true);
    this.methodSaveError.set('');
    const dto: PaymentMethodUpdateDto = {
      displayOrder: this.editForm.displayOrder,
      iconUrl: this.editForm.iconUrl.trim() || undefined,
      description: this.editForm.description.trim() || undefined,
    };
    this.svc.updateMethod(m.id, dto).subscribe({
      next: () => {
        this.methodSaving.set(false);
        this.allMethods.update((list) =>
          list.map((x) =>
            x.id === m.id
              ? {
                  ...x,
                  displayOrder: dto.displayOrder ?? x.displayOrder,
                  iconUrl: dto.iconUrl,
                  description: dto.description,
                }
              : x,
          ),
        );
        this.closeEditMethod();
        this.toast.success('Method updated.');
      },
      error: (e: { error?: { message?: string } }) => {
        this.methodSaving.set(false);
        this.methodSaveError.set(e?.error?.message ?? 'Failed to save.');
      },
    });
  }

  // ── Settings ──────────────────────────────────────────────────────────────────
  switchToSettings() {
    this.tab.set('settings');
    this.loadSettings();
  }

  loadSettings() {
    this.settingsLoading.set(true);
    this.svc.getPaymentSettings().subscribe({
      next: (s) => {
        this.settingsForm = {
          advanceEnabled: s.advanceEnabled,
          advancePercent: s.advancePercent,
          minAdvanceAmount: s.minAdvanceAmount,
        };
        this.settingsLoading.set(false);
      },
      error: () => this.settingsLoading.set(false),
    });
  }

  saveSettings() {
    const { advancePercent, minAdvanceAmount } = this.settingsForm;
    if (advancePercent < 1 || advancePercent > 100) {
      this.settingsError.set('Advance percent must be between 1 and 100.');
      return;
    }
    if (minAdvanceAmount < 0) {
      this.settingsError.set('Minimum amount cannot be negative.');
      return;
    }
    this.settingsSaving.set(true);
    this.settingsError.set('');
    this.svc.updatePaymentSettings({ ...this.settingsForm }).subscribe({
      next: () => {
        this.settingsSaving.set(false);
        this.toast.success('Payment settings saved.');
      },
      error: (e: { error?: { message?: string } }) => {
        this.settingsSaving.set(false);
        this.settingsError.set(e?.error?.message ?? 'Failed to save settings.');
      },
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────────
  statusClass(status: number): string {
    return (
      {
        1: 'badge-orange',
        2: 'badge-green',
        3: 'badge badge-red',
        4: 'badge-gray',
      }[status] ?? 'badge-gray'
    );
  }
}
