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
  styleUrls: ['../admin-shared.scss', './admin-discounts.scss'],
  templateUrl: './admin-discounts.html'
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
