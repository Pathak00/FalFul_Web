import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReceiptService } from '../../../core/services/receipt.service';
import { ToastService } from '../../../core/services/toast.service';
import {
  ReceiptTemplateSummary, ReceiptTemplate, ReceiptTemplateVersionSummary,
  CreateReceiptTemplateRequest, UpdateReceiptTemplateRequest,
} from '../../../core/models/receipt.models';

@Component({
  selector: 'app-admin-receipt-templates',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['../admin-shared.scss', './admin-receipt-templates.scss'],
  templateUrl: './admin-receipt-templates.html'
})
export class AdminReceiptTemplatesComponent implements OnInit {
  private receiptSvc = inject(ReceiptService);
  private toast      = inject(ToastService);

  readonly eg1 = '{{variable}}';
  readonly eg2 = '{{#if variable}}…{{/if}}';

  templates    = signal<ReceiptTemplateSummary[]>([]);
  versions     = signal<ReceiptTemplateVersionSummary[]>([]);
  loading      = signal(true);
  saving       = signal(false);
  restoring    = signal(false);
  restoringId  = signal<number | null>(null);
  showModal    = signal(false);
  showVersions = signal(false);
  formError    = signal('');
  editId       = signal<number | null>(null);
  deleteTarget = signal<ReceiptTemplateSummary | null>(null);

  form: CreateReceiptTemplateRequest & { isActive?: boolean; versionLabel?: string } = this.blankForm();

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.receiptSvc.getTemplates().subscribe({
      next: list => { this.templates.set(list); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  openCreate() {
    this.form = this.blankForm();
    this.editId.set(null);
    this.versions.set([]);
    this.showVersions.set(false);
    this.formError.set('');
    this.showModal.set(true);
  }

  openEdit(id: number) {
    this.formError.set('');
    this.showVersions.set(false);
    this.receiptSvc.getTemplateById(id).subscribe({
      next: t => {
        this.form = {
          name: t.name, htmlContent: t.htmlContent,
          isDefault: t.isDefault, isActive: t.isActive, versionLabel: ''
        };
        this.editId.set(id);
        this.showModal.set(true);
        this.loadVersions(id);
      },
      error: () => this.toast.error('Could not load template.')
    });
  }

  closeModal() { this.showModal.set(false); }

  schedulePreviewRefresh() { /* preview auto-updates via srcdoc binding */ }

  save() {
    if (!this.form.name?.trim())        { this.formError.set('Name is required.');         return; }
    if (!this.form.htmlContent?.trim()) { this.formError.set('HTML content is required.'); return; }

    this.saving.set(true);
    const id = this.editId();

    const onSuccess = (label: string) => {
      this.toast.success(label);
      this.saving.set(false);
      this.closeModal();
      this.load();
    };
    const onError = (e: { error?: { message?: string } }) => {
      this.formError.set(e?.error?.message ?? 'Failed to save template.');
      this.saving.set(false);
    };

    if (id) {
      this.receiptSvc.updateTemplate(id, {
        name: this.form.name.trim(),
        htmlContent: this.form.htmlContent,
        isDefault: this.form.isDefault,
        isActive: this.form.isActive ?? true,
        versionLabel: this.form.versionLabel || undefined,
      } as UpdateReceiptTemplateRequest).subscribe({ next: () => onSuccess('Template saved.'), error: onError });
    } else {
      this.receiptSvc.createTemplate({
        name: this.form.name.trim(),
        htmlContent: this.form.htmlContent,
        isDefault: this.form.isDefault,
      }).subscribe({ next: () => onSuccess('Template created.'), error: onError });
    }
  }

  private loadVersions(templateId: number) {
    this.receiptSvc.getVersions(templateId).subscribe({
      next: list => this.versions.set(list),
      error: () => {}
    });
  }

  restoreVersion(v: ReceiptTemplateVersionSummary) {
    const id = this.editId();
    if (!id) return;
    this.restoring.set(true);
    this.restoringId.set(v.id);
    this.receiptSvc.restoreVersion(id, v.id).subscribe({
      next: () => {
        this.toast.success(`Restored to v${v.versionNumber}.`);
        this.restoring.set(false);
        this.restoringId.set(null);
        this.openEdit(id); // Reload the editor with restored content
      },
      error: (e: { error?: { message?: string } }) => {
        this.toast.error(e?.error?.message ?? 'Restore failed.');
        this.restoring.set(false);
        this.restoringId.set(null);
      }
    });
  }

  confirmDelete(t: ReceiptTemplateSummary) { this.deleteTarget.set(t); }

  doDelete() {
    const t = this.deleteTarget();
    if (!t) return;
    this.saving.set(true);
    this.receiptSvc.deleteTemplate(t.id).subscribe({
      next: () => {
        this.toast.success('Template deleted.');
        this.saving.set(false);
        this.deleteTarget.set(null);
        this.load();
      },
      error: (e: { error?: { message?: string } }) => {
        this.toast.error(e?.error?.message ?? 'Failed to delete template.');
        this.saving.set(false);
      }
    });
  }

  private blankForm() {
    return { name: '', htmlContent: '', isDefault: false, isActive: true, versionLabel: '' };
  }
}
