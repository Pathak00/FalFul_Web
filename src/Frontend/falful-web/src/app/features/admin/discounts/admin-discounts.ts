import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DiscountService } from '../../../core/services/discount.service';
import { ToastService } from '../../../core/services/toast.service';
import { NepalDatePipe } from '../../../core/pipes/nepal-date.pipe';
import { DiscountDto, CreateDiscountDto } from '../../../core/models/discount.models';

@Component({
  selector: 'app-admin-discounts',
  standalone: true,
  imports: [CommonModule, FormsModule, NepalDatePipe],
  styleUrl: '../admin-shared.scss',
  template: `
    <div class="admin-page" style="max-width:1100px">

      <div class="page-header">
        <div>
          <h1>Discount Codes</h1>
          <p class="page-sub">Create and manage discount codes for customers at checkout.</p>
        </div>
        <button class="btn-primary" (click)="openCreate()">
          <i class="bi bi-plus-lg"></i> New Discount
        </button>
      </div>

      <!-- Summary chips -->
      <div class="chip-row">
        <span class="chip chip-blue">Total: {{ discounts().length }}</span>
        <span class="chip chip-green">Active: {{ activeCount() }}</span>
        <span class="chip chip-slate">Inactive: {{ discounts().length - activeCount() }}</span>
      </div>

      <!-- Table -->
      @if (loading()) {
        <div class="loading-state"><div class="spinner"></div> Loading…</div>
      } @else if (discounts().length === 0) {
        <div class="empty-state">
          <i class="bi bi-tag"></i>
          <p>No discount codes yet. Create one to offer promotions at checkout.</p>
        </div>
      } @else {
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Type</th>
                <th>Value</th>
                <th>Min Order</th>
                <th>Uses</th>
                <th>Validity</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (d of discounts(); track d.id) {
                <tr>
                  <td><span class="code-badge">{{ d.code }}</span></td>
                  <td>{{ d.typeLabel }}</td>
                  <td>
                    @if (d.discountType === 1) { {{ d.value }}% }
                    @else { Rs. {{ d.value | number:'1.0-0' }} }
                  </td>
                  <td>{{ d.minOrderAmount > 0 ? ('Rs. ' + (d.minOrderAmount | number:'1.0-0')) : '—' }}</td>
                  <td>{{ d.usesCount }}{{ d.maxUses ? ' / ' + d.maxUses : '' }}</td>
                  <td class="validity-cell">
                    @if (d.startDate || d.endDate) {
                      {{ d.startDate ?? '—' }} → {{ d.endDate ?? '∞' }}
                    } @else { Always }
                  </td>
                  <td>
                    <span class="status-badge" [class.active]="d.isActive" [class.inactive]="!d.isActive">
                      {{ d.isActive ? 'Active' : 'Inactive' }}
                    </span>
                  </td>
                  <td>
                    <div class="action-btns">
                      <button class="btn-icon" title="Edit" (click)="openEdit(d)"><i class="bi bi-pencil"></i></button>
                      <button class="btn-icon btn-danger" title="Delete" (click)="confirmDelete(d)"><i class="bi bi-trash"></i></button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>

    <!-- ── Create / Edit modal ─────────────────────────────────────────────── -->
    @if (showModal()) {
      <div class="modal-overlay" (click)="closeModal()">
        <div class="modal-box" style="max-width:520px" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>{{ editId() ? 'Edit Discount' : 'New Discount Code' }}</h3>
            <button class="modal-close" (click)="closeModal()"><i class="bi bi-x-lg"></i></button>
          </div>

          <div class="modal-body">
            <div class="form-grid">

              <div class="form-group full-span">
                <label>Code *</label>
                <input type="text" [(ngModel)]="form.code" placeholder="SUMMER20" style="text-transform:uppercase" />
                <span class="hint">Code is case-insensitive. Customers enter this at checkout.</span>
              </div>

              <div class="form-group full-span">
                <label>Description</label>
                <input type="text" [(ngModel)]="form.description" placeholder="Summer sale — 20% off" />
              </div>

              <div class="form-group">
                <label>Type *</label>
                <select [(ngModel)]="form.discountType">
                  <option [ngValue]="1">Percent (%)</option>
                  <option [ngValue]="2">Flat Amount (Rs.)</option>
                </select>
              </div>

              <div class="form-group">
                <label>Value *</label>
                <div class="input-prefix-wrap">
                  <span class="input-prefix">{{ form.discountType === 1 ? '%' : 'Rs.' }}</span>
                  <input type="number" [(ngModel)]="form.value" min="0" [max]="form.discountType === 1 ? 100 : null" />
                </div>
              </div>

              <div class="form-group">
                <label>Minimum Order (Rs.)</label>
                <input type="number" [(ngModel)]="form.minOrderAmount" min="0" placeholder="0" />
              </div>

              <div class="form-group">
                <label>Max Uses <span class="hint-inline">(blank = unlimited)</span></label>
                <input type="number" [(ngModel)]="form.maxUses" min="1" placeholder="Unlimited" />
              </div>

              <div class="form-group">
                <label>Start Date</label>
                <input type="date" [(ngModel)]="form.startDate" />
              </div>

              <div class="form-group">
                <label>End Date</label>
                <input type="date" [(ngModel)]="form.endDate" />
              </div>

              <div class="form-group full-span">
                <label class="toggle-label">
                  <input type="checkbox" [(ngModel)]="form.isActive" />
                  <span>Active (customers can use this code)</span>
                </label>
              </div>

            </div>

            @if (formError()) {
              <div class="form-error"><i class="bi bi-exclamation-circle"></i> {{ formError() }}</div>
            }
          </div>

          <div class="modal-footer">
            <button class="btn-secondary" (click)="closeModal()">Cancel</button>
            <button class="btn-primary" (click)="save()" [disabled]="saving()">
              @if (saving()) { <span class="spinner-sm"></span> Saving… }
              @else { <i class="bi bi-check-lg"></i> {{ editId() ? 'Save Changes' : 'Create Discount' }} }
            </button>
          </div>
        </div>
      </div>
    }

    <!-- ── Delete confirm ─────────────────────────────────────────────────── -->
    @if (deleteTarget()) {
      <div class="modal-overlay" (click)="deleteTarget.set(null)">
        <div class="modal-box modal-sm" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Delete Discount</h3>
            <button class="modal-close" (click)="deleteTarget.set(null)"><i class="bi bi-x-lg"></i></button>
          </div>
          <div class="modal-body">
            <p>Delete discount code <strong>{{ deleteTarget()!.code }}</strong>? This cannot be undone.</p>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" (click)="deleteTarget.set(null)">Cancel</button>
            <button class="btn-danger" (click)="doDelete()" [disabled]="saving()">
              @if (saving()) { <span class="spinner-sm"></span> } @else { Delete }
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .chip-row { display:flex; gap:.5rem; margin-bottom:1.5rem; flex-wrap:wrap; }
    .chip { padding:.25rem .75rem; border-radius:999px; font-size:.78rem; font-weight:600; }
    .chip-blue  { background:#dbeafe; color:#1d4ed8; }
    .chip-green { background:#dcfce7; color:#15803d; }
    .chip-slate { background:#f1f5f9; color:#475569; }
    .code-badge { font-family:monospace; background:#f1f5f9; padding:.15rem .5rem; border-radius:4px;
      font-size:.82rem; font-weight:700; color:#0f172a; letter-spacing:.03em; }
    .validity-cell { font-size:.8rem; color:#64748b; }
    .hint { display:block; font-size:.75rem; color:#64748b; margin-top:.2rem; }
    .hint-inline { font-size:.75rem; color:#94a3b8; font-weight:400; }
    .input-prefix-wrap { display:flex; }
    .input-prefix { background:#f1f5f9; border:1px solid #cbd5e1; border-right:none;
      padding:0 .6rem; display:flex; align-items:center; border-radius:6px 0 0 6px;
      font-size:.85rem; color:#475569; font-weight:600; white-space:nowrap; }
    .input-prefix + input { border-radius:0 6px 6px 0; }
    .form-grid { display:grid; grid-template-columns:1fr 1fr; gap:.75rem 1rem; }
    .full-span { grid-column:1/-1; }
    .toggle-label { display:flex; align-items:center; gap:.5rem; cursor:pointer;
      input[type=checkbox] { width:16px; height:16px; cursor:pointer; }
    }
    .status-badge { padding:.2rem .6rem; border-radius:999px; font-size:.75rem; font-weight:600; }
    .status-badge.active   { background:#dcfce7; color:#15803d; }
    .status-badge.inactive { background:#f1f5f9; color:#94a3b8; }
  `]
})
export class AdminDiscountsComponent implements OnInit {
  private discountSvc = inject(DiscountService);
  private toast       = inject(ToastService);

  discounts  = signal<DiscountDto[]>([]);
  loading    = signal(true);
  showModal  = signal(false);
  saving     = signal(false);
  formError  = signal('');
  editId     = signal<number | null>(null);
  deleteTarget = signal<DiscountDto | null>(null);

  readonly activeCount = computed(() => this.discounts().filter(d => d.isActive).length);

  form: CreateDiscountDto = this.blankForm();

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.discountSvc.getAllDiscounts().subscribe({
      next: list => { this.discounts.set(list); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  openCreate() {
    this.form = this.blankForm();
    this.editId.set(null);
    this.formError.set('');
    this.showModal.set(true);
  }

  openEdit(d: DiscountDto) {
    this.form = {
      code: d.code, description: d.description, discountType: d.discountType,
      value: d.value, minOrderAmount: d.minOrderAmount, maxUses: d.maxUses ?? undefined,
      startDate: d.startDate, endDate: d.endDate, isActive: d.isActive
    };
    this.editId.set(d.id);
    this.formError.set('');
    this.showModal.set(true);
  }

  closeModal() { this.showModal.set(false); }

  save() {
    const f = this.form;
    if (!f.code?.trim())  { this.formError.set('Code is required.'); return; }
    if (!f.value || f.value <= 0) { this.formError.set('Value must be greater than 0.'); return; }
    if (f.discountType === 1 && f.value > 100) { this.formError.set('Percent discount cannot exceed 100.'); return; }

    const payload: CreateDiscountDto = {
      ...f,
      code: f.code.trim().toUpperCase(),
      maxUses: f.maxUses || undefined
    };

    this.saving.set(true);
    const req = this.editId()
      ? this.discountSvc.updateDiscount(this.editId()!, payload)
      : this.discountSvc.createDiscount(payload);

    req.subscribe({
      next: () => {
        this.toast.success(this.editId() ? 'Discount updated.' : 'Discount created.');
        this.saving.set(false);
        this.closeModal();
        this.load();
      },
      error: (e: { error?: { message?: string } }) => {
        this.formError.set(e.error?.message ?? 'Failed to save discount.');
        this.saving.set(false);
      }
    });
  }

  confirmDelete(d: DiscountDto) { this.deleteTarget.set(d); }

  doDelete() {
    const d = this.deleteTarget();
    if (!d) return;
    this.saving.set(true);
    this.discountSvc.deleteDiscount(d.id).subscribe({
      next: () => {
        this.toast.success('Discount deleted.');
        this.saving.set(false);
        this.deleteTarget.set(null);
        this.load();
      },
      error: () => { this.toast.error('Failed to delete discount.'); this.saving.set(false); }
    });
  }

  private blankForm(): CreateDiscountDto {
    return { code: '', description: undefined, discountType: 1, value: 0,
             minOrderAmount: 0, maxUses: undefined, startDate: undefined, endDate: undefined, isActive: true };
  }
}
