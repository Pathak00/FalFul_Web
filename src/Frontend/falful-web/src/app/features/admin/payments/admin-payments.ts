import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaymentService } from '../../../core/services/payment.service';
import { ToastService } from '../../../core/services/toast.service';
import { NepalDatePipe } from '../../../core/pipes/nepal-date.pipe';
import {
  PaymentDto, PaymentMethodDto, PaymentSettingsDto,
  PaymentMethodUpdateDto, PaymentReport,
} from '../../../core/models/payment.models';

type Tab = 'transactions' | 'methods' | 'settings';

@Component({
  selector: 'app-admin-payments',
  standalone: true,
  imports: [CommonModule, FormsModule, NepalDatePipe],
  styleUrl: '../admin-shared.scss',
  template: `
    <div class="admin-page" style="max-width:1200px">

      <!-- Page header -->
      <div class="page-header">
        <div>
          <h1>Payments</h1>
          <p class="page-sub">View transactions, manage payment methods, and configure advance payment settings.</p>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tab-bar">
        <button class="filter-btn" [class.active]="tab()==='transactions'" (click)="tab.set('transactions')">
          <i class="bi bi-list-ul"></i> Transactions
        </button>
        <button class="filter-btn" [class.active]="tab()==='methods'" (click)="switchToMethods()">
          <i class="bi bi-credit-card"></i> Payment Methods
        </button>
        <button class="filter-btn" [class.active]="tab()==='settings'" (click)="switchToSettings()">
          <i class="bi bi-gear"></i> Settings
        </button>
      </div>

      <!-- ══════════════════════ TRANSACTIONS TAB ══════════════════════ -->
      @if (tab() === 'transactions') {

        <!-- Filters -->
        <div class="filter-bar">
          <select [(ngModel)]="filterMethod" style="min-width:130px">
            <option [ngValue]="undefined">All Methods</option>
            @for (m of allMethods(); track m.id) {
              <option [ngValue]="m.id">{{ m.name }}</option>
            }
          </select>

          <select [(ngModel)]="filterStatus" style="min-width:130px">
            <option [ngValue]="undefined">All Statuses</option>
            <option [ngValue]="1">Pending</option>
            <option [ngValue]="2">Completed</option>
            <option [ngValue]="3">Failed</option>
            <option [ngValue]="4">Refunded</option>
          </select>

          <input type="date" [(ngModel)]="filterFrom" style="font-size:.875rem">
          <span style="color:#9ca3af;font-size:.875rem">–</span>
          <input type="date" [(ngModel)]="filterTo" style="font-size:.875rem">

          <button class="btn-primary btn-sm" [disabled]="txLoading()" (click)="loadTransactions()">
            @if (txLoading()) { <i class="bi bi-arrow-repeat spin"></i> } Load
          </button>
          @if (payments().length > 0) {
            <span style="font-size:.78rem;color:#9ca3af">{{ payments().length }} record(s)</span>
          }
        </div>

        <!-- KPI strip -->
        @if (report()) {
          <div class="kpi-strip">
            <div class="kpi-tile kpi-green">
              <div class="kpi-val">Rs {{ report()!.totalCollected | number:'1.0-0' }}</div>
              <div class="kpi-lbl">Collected</div>
            </div>
            <div class="kpi-tile kpi-orange">
              <div class="kpi-val">Rs {{ report()!.totalPending | number:'1.0-0' }}</div>
              <div class="kpi-lbl">Pending</div>
            </div>
            <div class="kpi-tile">
              <div class="kpi-val">{{ report()!.totalTransactions }}</div>
              <div class="kpi-lbl">Transactions</div>
            </div>
            <div class="kpi-tile kpi-blue">
              <div class="kpi-val">Rs {{ report()!.totalAdvance | number:'1.0-0' }}</div>
              <div class="kpi-lbl">Advance Collected</div>
            </div>
          </div>
        }

        <!-- Table -->
        @if (txLoading()) {
          <div class="loading-state"><div class="spinner"></div> Loading transactions…</div>
        } @else {
          <div class="data-table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Method</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Paid At</th>
                  <th style="text-align:right">Actions</th>
                </tr>
              </thead>
              <tbody>
                @if (payments().length === 0) {
                  <tr><td colspan="9" class="empty-cell">No payments found.</td></tr>
                }
                @for (p of payments(); track p.id) {
                  <tr>
                    <td class="id-cell">{{ p.id }}</td>
                    <td><span class="order-num">{{ p.orderNumber }}</span></td>
                    <td>{{ p.customerName }}</td>
                    <td>
                      <span class="method-badge method-{{ p.paymentMethodCode }}">
                        {{ p.paymentMethodName }}
                      </span>
                    </td>
                    <td><span class="badge badge-gray">{{ p.paymentTypeLabel }}</span></td>
                    <td style="font-weight:600">Rs {{ p.amount | number:'1.0-0' }}</td>
                    <td><span class="badge" [ngClass]="statusClass(p.status)">{{ p.statusLabel }}</span></td>
                    <td class="text-sm text-muted">
                      {{ p.paidAt ? (p.paidAt | nepalDate:'short') : '—' }}
                    </td>
                    <td class="actions-cell">
                      @if (p.paymentMethodCode === 'cod' && p.status === 1) {
                        <button class="btn-sm tbl-btn tbl-btn-action"
                                [disabled]="confirmingId() === p.id"
                                (click)="confirmCod(p.id)">
                          @if (confirmingId() === p.id) { <i class="bi bi-arrow-repeat spin"></i> }
                          @else { <i class="bi bi-check2-circle"></i> }
                          Confirm COD
                        </button>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      }

      <!-- ══════════════════════ METHODS TAB ══════════════════════ -->
      @if (tab() === 'methods') {
        @if (methodsLoading()) {
          <div class="loading-state"><div class="spinner"></div> Loading methods…</div>
        } @else {
          <div class="data-table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Code</th>
                  <th>Status</th>
                  <th>Order</th>
                  <th>Description</th>
                  <th style="text-align:right">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (m of allMethods(); track m.id) {
                  <tr>
                    <td class="id-cell">{{ m.id }}</td>
                    <td style="font-weight:600">{{ m.name }}</td>
                    <td><span class="slug-badge">{{ m.code }}</span></td>
                    <td>
                      <button class="toggle-btn" [class.enabled]="m.isEnabled"
                              [disabled]="togglingId() === m.id"
                              (click)="toggleMethod(m)">
                        <span class="toggle-dot"></span>
                        {{ m.isEnabled ? 'Enabled' : 'Disabled' }}
                      </button>
                    </td>
                    <td>{{ m.displayOrder }}</td>
                    <td class="text-muted text-sm">{{ m.description || '—' }}</td>
                    <td class="actions-cell">
                      <button class="btn-sm btn-edit" (click)="openEditMethod(m)">
                        <i class="bi bi-pencil"></i> Edit
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      }

      <!-- ══════════════════════ SETTINGS TAB ══════════════════════ -->
      @if (tab() === 'settings') {
        @if (settingsLoading()) {
          <div class="loading-state"><div class="spinner"></div> Loading settings…</div>
        } @else {
          <div class="settings-card card">
            <div class="card-header settings-group-header">
              <i class="bi bi-credit-card-2-front group-icon"></i>
              <h2>Advance Payment</h2>
            </div>

            <div style="padding:1.5rem;max-width:480px;display:flex;flex-direction:column;gap:1.25rem">

              <!-- Enable toggle -->
              <div class="form-toggle-row">
                <label class="toggle-label" (click)="settingsForm.advanceEnabled = !settingsForm.advanceEnabled">
                  <div class="toggle" [class.on]="settingsForm.advanceEnabled">
                    <div class="toggle-thumb"></div>
                  </div>
                  <div>
                    <strong>Enable Advance Payment</strong>
                    <span>Require customers to pay a percentage upfront before order confirmation.</span>
                  </div>
                </label>
              </div>

              <div class="form-group">
                <label>Advance Percentage <span class="required">*</span></label>
                <div style="display:flex;align-items:center;gap:.5rem">
                  <input type="number" min="1" max="100"
                         [(ngModel)]="settingsForm.advancePercent"
                         style="width:100px"
                         [disabled]="!settingsForm.advanceEnabled" />
                  <span style="font-size:.875rem;color:#64748b">% of order total</span>
                </div>
                <span class="field-hint">Between 1% and 100%. E.g. 30 = customer pays 30% upfront.</span>
              </div>

              <div class="form-group">
                <label>Minimum Order Amount for Advance <span class="required">*</span></label>
                <div style="display:flex;align-items:center;gap:.5rem">
                  <span style="font-size:.875rem;color:#64748b">Rs</span>
                  <input type="number" min="0"
                         [(ngModel)]="settingsForm.minAdvanceAmount"
                         style="width:120px"
                         [disabled]="!settingsForm.advanceEnabled" />
                </div>
                <span class="field-hint">Orders below this amount skip the advance requirement.</span>
              </div>

              @if (settingsError()) {
                <div class="form-error-box"><i class="bi bi-exclamation-circle"></i> {{ settingsError() }}</div>
              }

              <div>
                <button class="btn-primary" [disabled]="settingsSaving()" (click)="saveSettings()">
                  @if (settingsSaving()) { <i class="bi bi-arrow-repeat spin"></i> Saving… }
                  @else { <i class="bi bi-check-lg"></i> Save Settings }
                </button>
              </div>
            </div>
          </div>
        }
      }

    </div>

    <!-- ══ Edit Method Modal ══ -->
    @if (editTarget()) {
      <div class="modal-backdrop" (click)="closeEditMethod()">
        <div class="modal-box" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Edit Payment Method — {{ editTarget()!.name }}</h3>
            <button class="modal-close" (click)="closeEditMethod()"><i class="bi bi-x-lg"></i></button>
          </div>

          <div class="form-group">
            <label>Display Order</label>
            <input type="number" min="0" [(ngModel)]="editForm.displayOrder" />
          </div>

          <div class="form-group">
            <label>Icon URL</label>
            <input type="text" [(ngModel)]="editForm.iconUrl" placeholder="https://…" />
            <span class="field-hint">Optional image URL shown at checkout.</span>
          </div>

          <div class="form-group">
            <label>Description</label>
            <textarea rows="2" [(ngModel)]="editForm.description"
                      placeholder="Short note shown to customers at checkout."></textarea>
          </div>

          @if (methodSaveError()) {
            <div class="form-error-box"><i class="bi bi-exclamation-circle"></i> {{ methodSaveError() }}</div>
          }

          <div class="modal-footer" style="margin-top:1.25rem">
            <button class="btn-secondary btn-sm" (click)="closeEditMethod()">Cancel</button>
            <button class="btn-primary btn-sm" [disabled]="methodSaving()" (click)="saveEditMethod()">
              @if (methodSaving()) { <i class="bi bi-arrow-repeat spin"></i> Saving… }
              @else { Save }
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .tab-bar { display: flex; gap: .5rem; margin-bottom: 1.5rem; flex-wrap: wrap; }

    .kpi-strip {
      display: flex; gap: .875rem; flex-wrap: wrap; margin-bottom: 1.5rem;
    }
    .kpi-tile {
      flex: 1; min-width: 140px; background: #fff; border: 1px solid #e2e8f0;
      border-radius: 10px; padding: 1rem 1.25rem;
      .kpi-val { font-size: 1.35rem; font-weight: 800; color: #0f172a; }
      .kpi-lbl { font-size: .75rem; color: #64748b; margin-top: .1rem; }
      &.kpi-green { border-left: 3px solid #16a34a; .kpi-val { color: #16a34a; } }
      &.kpi-orange { border-left: 3px solid #ea580c; .kpi-val { color: #ea580c; } }
      &.kpi-blue  { border-left: 3px solid #1d4ed8; .kpi-val { color: #1d4ed8; } }
    }

    .method-badge {
      display: inline-block; padding: 2px 8px; border-radius: 6px;
      font-size: .72rem; font-weight: 700;
      &.method-cod    { background: #fef9c3; color: #854d0e; }
      &.method-esewa  { background: #dcfce7; color: #166534; }
      &.method-khalti { background: #f5f3ff; color: #6d28d9; }
    }

    .card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
    .card-header { display: flex; align-items: center; gap: .5rem; padding: .875rem 1.25rem;
      border-bottom: 1px solid #f1f5f9; background: #f8fafc;
      h2 { margin: 0; font-size: .875rem; font-weight: 700; color: #0f172a; }
    }
    .settings-group-header { display: flex; align-items: center; gap: .5rem; }
    .group-icon { color: #16a34a; font-size: 1rem; }

    .toggle-btn {
      display: inline-flex; align-items: center; gap: .4rem;
      padding: .25rem .625rem; border-radius: 20px; border: 1.5px solid;
      font-size: .72rem; font-weight: 700; cursor: pointer; transition: all .15s;
      background: #f1f5f9; border-color: #cbd5e1; color: #64748b;
      .toggle-dot { width: 8px; height: 8px; border-radius: 50%; background: #94a3b8; }
      &.enabled { background: #dcfce7; border-color: #86efac; color: #16a34a;
        .toggle-dot { background: #16a34a; }
      }
      &:disabled { opacity: .5; cursor: not-allowed; }
    }
  `]
})
export class AdminPaymentsComponent implements OnInit {
  private svc   = inject(PaymentService);
  private toast = inject(ToastService);

  tab = signal<Tab>('transactions');

  // ── Transactions ──────────────────────────────────────────────────────────────
  payments     = signal<PaymentDto[]>([]);
  report       = signal<PaymentReport | null>(null);
  txLoading    = signal(false);
  confirmingId = signal<number | null>(null);

  filterMethod = undefined as number | undefined;
  filterStatus = undefined as number | undefined;
  filterFrom   = '';
  filterTo     = '';

  // ── Methods ───────────────────────────────────────────────────────────────────
  allMethods     = signal<PaymentMethodDto[]>([]);
  methodsLoading = signal(false);
  togglingId     = signal<number | null>(null);

  editTarget      = signal<PaymentMethodDto | null>(null);
  editForm        = { displayOrder: 0, iconUrl: '', description: '' };
  methodSaving    = signal(false);
  methodSaveError = signal('');

  // ── Settings ──────────────────────────────────────────────────────────────────
  settingsLoading = signal(false);
  settingsSaving  = signal(false);
  settingsError   = signal('');
  settingsForm    = { advanceEnabled: false, advancePercent: 30, minAdvanceAmount: 100 };

  ngOnInit() {
    this.loadTransactions();
    this.loadMethods();
  }

  // ── Transactions ──────────────────────────────────────────────────────────────
  loadTransactions() {
    this.txLoading.set(true);
    this.svc.getAllPayments(this.filterMethod, this.filterStatus, this.filterFrom || undefined, this.filterTo || undefined)
      .subscribe({
        next: list => {
          this.payments.set(list);
          this.txLoading.set(false);
        },
        error: () => this.txLoading.set(false),
      });

    this.svc.getPaymentReport(this.filterFrom || undefined, this.filterTo || undefined)
      .subscribe({ next: r => this.report.set(r), error: () => {} });
  }

  confirmCod(paymentId: number) {
    this.confirmingId.set(paymentId);
    this.svc.confirmCod(paymentId).subscribe({
      next: () => {
        this.confirmingId.set(null);
        this.toast.success('COD payment confirmed.');
        this.payments.update(list =>
          list.map(p => p.id === paymentId ? { ...p, status: 2, statusLabel: 'Completed' } : p)
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
      next: list => { this.allMethods.set(list); this.methodsLoading.set(false); },
      error: ()   => this.methodsLoading.set(false),
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
        this.allMethods.update(list =>
          list.map(x => x.id === m.id ? { ...x, isEnabled: !m.isEnabled } : x)
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
      iconUrl:      m.iconUrl ?? '',
      description:  m.description ?? '',
    };
    this.methodSaveError.set('');
  }

  closeEditMethod() { this.editTarget.set(null); }

  saveEditMethod() {
    const m = this.editTarget();
    if (!m) return;
    this.methodSaving.set(true);
    this.methodSaveError.set('');
    const dto: PaymentMethodUpdateDto = {
      displayOrder: this.editForm.displayOrder,
      iconUrl:      this.editForm.iconUrl.trim() || undefined,
      description:  this.editForm.description.trim() || undefined,
    };
    this.svc.updateMethod(m.id, dto).subscribe({
      next: () => {
        this.methodSaving.set(false);
        this.allMethods.update(list =>
          list.map(x => x.id === m.id
            ? { ...x, displayOrder: dto.displayOrder ?? x.displayOrder, iconUrl: dto.iconUrl, description: dto.description }
            : x)
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
      next: s => {
        this.settingsForm = {
          advanceEnabled:   s.advanceEnabled,
          advancePercent:   s.advancePercent,
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
    return {
      1: 'badge-orange',
      2: 'badge-green',
      3: 'badge badge-red',
      4: 'badge-gray',
    }[status] ?? 'badge-gray';
  }
}
