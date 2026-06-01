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
  styleUrl: '../admin-shared.scss',
  template: `
    <div class="admin-page" style="max-width:1200px">

      <div class="page-header">
        <div>
          <h1>Receipt Templates</h1>
          <p class="page-sub">Manage HTML receipt templates printed for orders. Use <code>{{ eg1 }}</code> placeholders and <code>{{ eg2 }}</code> conditionals.</p>
        </div>
        <button class="btn-primary" (click)="openCreate()">
          <i class="bi bi-plus-lg"></i> New Template
        </button>
      </div>

      @if (loading()) {
        <div class="loading-state"><div class="spinner"></div> Loading…</div>
      } @else if (templates().length === 0) {
        <div class="empty-state">
          <i class="bi bi-receipt"></i>
          <p>No receipt templates yet. Create one to start printing receipts.</p>
        </div>
      } @else {
        <div class="templates-grid">
          @for (t of templates(); track t.id) {
            <div class="template-card" [class.is-default]="t.isDefault">
              <div class="tc-header">
                <span class="tc-name">{{ t.name }}</span>
                <div class="tc-badges">
                  @if (t.isDefault) { <span class="badge badge-green">Default</span> }
                  <span class="badge" [class.badge-green]="t.isActive" [class.badge-gray]="!t.isActive">
                    {{ t.isActive ? 'Active' : 'Inactive' }}
                  </span>
                </div>
              </div>
              <div class="tc-meta">
                <span><i class="bi bi-clock"></i> {{ t.updatedAt ?? t.createdAt | date:'dd MMM yyyy' }}</span>
                @if (t.publishedAt) {
                  <span><i class="bi bi-send-check"></i> Published {{ t.publishedAt | date:'dd MMM yyyy' }}</span>
                }
              </div>
              <div class="tc-actions">
                <button class="btn-icon" title="Edit" (click)="openEdit(t.id)"><i class="bi bi-pencil"></i></button>
                @if (!t.isDefault) {
                  <button class="btn-icon btn-danger" title="Delete" (click)="confirmDelete(t)"><i class="bi bi-trash"></i></button>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>

    <!-- ── Create / Edit modal ─────────────────────────────────────────────── -->
    @if (showModal()) {
      <div class="modal-overlay" (click)="closeModal()">
        <div class="modal-box" style="max-width:900px;width:95vw;max-height:92vh;overflow-y:auto" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>{{ editId() ? 'Edit Template' : 'New Template' }}</h3>
            <button class="modal-close" (click)="closeModal()"><i class="bi bi-x-lg"></i></button>
          </div>

          <div class="modal-body">
            <div class="form-grid">
              <div class="form-group" style="grid-column:1/2">
                <label>Template Name *</label>
                <input type="text" [(ngModel)]="form.name" placeholder="e.g. Standard Receipt" />
              </div>
              <div class="form-group" style="grid-column:2/3;display:flex;flex-direction:column;justify-content:flex-end;gap:.5rem">
                <label class="toggle-label">
                  <input type="checkbox" [(ngModel)]="form.isDefault" />
                  <span>Set as default template</span>
                </label>
                @if (editId()) {
                  <label class="toggle-label">
                    <input type="checkbox" [(ngModel)]="form.isActive" />
                    <span>Active</span>
                  </label>
                }
              </div>
            </div>

            @if (editId()) {
              <div class="form-group" style="margin-top:.25rem">
                <label>Version Label <span class="hint-inline">(optional note saved with this version snapshot)</span></label>
                <input type="text" [(ngModel)]="form.versionLabel" placeholder="e.g. Added refund policy section" />
              </div>
            }

            <!-- HTML Editor + Preview split -->
            <div class="editor-split">
              <div class="editor-pane">
                <div class="pane-label"><i class="bi bi-code-slash"></i> HTML Content *</div>
                <textarea class="html-editor" [(ngModel)]="form.htmlContent"
                          placeholder="Paste your receipt HTML here…" rows="22"
                          (input)="schedulePreviewRefresh()"></textarea>
              </div>
              <div class="preview-pane">
                <div class="pane-label"><i class="bi bi-eye"></i> Preview <span class="hint-inline">(placeholders shown as-is)</span></div>
                @if (form.htmlContent) {
                  <iframe class="preview-frame" [srcdoc]="form.htmlContent" sandbox="allow-same-origin"></iframe>
                } @else {
                  <div class="preview-empty"><i class="bi bi-file-earmark-code" style="font-size:2rem;color:#cbd5e1"></i><p>Start typing HTML to preview</p></div>
                }
              </div>
            </div>

            @if (formError()) {
              <div class="form-error"><i class="bi bi-exclamation-circle"></i> {{ formError() }}</div>
            }

            <!-- Version History (edit mode only) -->
            @if (editId() && versions().length > 0) {
              <div class="versions-section">
                <button class="versions-toggle" (click)="showVersions.update(v => !v)">
                  <i class="bi bi-clock-history"></i>
                  Version History ({{ versions().length }})
                  <i class="bi" [class.bi-chevron-down]="!showVersions()" [class.bi-chevron-up]="showVersions()"></i>
                </button>
                @if (showVersions()) {
                  <div class="versions-list">
                    @for (v of versions(); track v.id) {
                      <div class="version-row">
                        <div class="version-info">
                          <span class="v-num">v{{ v.versionNumber }}</span>
                          <span class="v-label">{{ v.label ?? 'Auto-saved' }}</span>
                          <span class="v-date">{{ v.createdAt | date:'dd MMM yyyy, HH:mm' }}</span>
                        </div>
                        <button class="btn-secondary btn-sm" (click)="restoreVersion(v)" [disabled]="restoring()">
                          @if (restoring() && restoringId() === v.id) { Restoring… }
                          @else { <i class="bi bi-arrow-counterclockwise"></i> Restore }
                        </button>
                      </div>
                    }
                  </div>
                }
              </div>
            }
          </div>

          <div class="modal-footer">
            <button class="btn-secondary" (click)="closeModal()">Cancel</button>
            <button class="btn-primary" (click)="save()" [disabled]="saving()">
              @if (saving()) { <span class="spinner-sm"></span> Saving… }
              @else { <i class="bi bi-check-lg"></i> {{ editId() ? 'Save Changes' : 'Create Template' }} }
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
            <h3>Delete Template</h3>
            <button class="modal-close" (click)="deleteTarget.set(null)"><i class="bi bi-x-lg"></i></button>
          </div>
          <div class="modal-body">
            <p>Delete template <strong>"{{ deleteTarget()!.name }}"</strong>? All version history will also be deleted. This cannot be undone.</p>
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
    .templates-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:1rem; }
    .template-card {
      background:#fff; border:1px solid #e2e8f0; border-radius:10px; padding:1rem 1.25rem;
      display:flex; flex-direction:column; gap:.5rem; transition:border-color .15s;
      &:hover { border-color:#93c5fd; }
      &.is-default { border-left:4px solid #22c55e; }
    }
    .tc-header { display:flex; align-items:flex-start; justify-content:space-between; gap:.5rem; }
    .tc-name { font-weight:700; font-size:.95rem; color:#0f172a; }
    .tc-badges { display:flex; gap:.35rem; flex-wrap:wrap; }
    .tc-meta { display:flex; flex-direction:column; gap:.2rem; font-size:.75rem; color:#94a3b8; i { margin-right:.3rem; } }
    .tc-actions { display:flex; gap:.35rem; margin-top:.25rem; }
    .badge { display:inline-block; padding:1px 8px; border-radius:999px; font-size:.72rem; font-weight:700; }
    .badge-green { background:#dcfce7; color:#15803d; }
    .badge-gray  { background:#f1f5f9; color:#94a3b8; }

    .editor-split { display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-top:.75rem; }
    @media (max-width:700px) { .editor-split { grid-template-columns:1fr; } }
    .pane-label { font-size:.72rem; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:#64748b; margin-bottom:.35rem; }
    .html-editor { width:100%; font-family:'Courier New',monospace; font-size:.8rem; line-height:1.5; resize:vertical; border:1px solid #e2e8f0; border-radius:8px; padding:.625rem .75rem; box-sizing:border-box; &:focus { outline:none; border-color:#22c55e; box-shadow:0 0 0 3px rgba(34,197,94,.15); } }
    .preview-frame { width:100%; height:450px; border:1px solid #e2e8f0; border-radius:8px; background:#fff; }
    .preview-empty { display:flex; flex-direction:column; align-items:center; justify-content:center; height:450px; gap:.5rem; color:#94a3b8; font-size:.85rem; border:1px solid #e2e8f0; border-radius:8px; }
    .editor-pane, .preview-pane { display:flex; flex-direction:column; }

    .versions-section { margin-top:1.25rem; border-top:1px solid #f1f5f9; padding-top:1rem; }
    .versions-toggle { background:none; border:none; cursor:pointer; display:flex; align-items:center; gap:.5rem; font-size:.85rem; font-weight:600; color:#475569; padding:.25rem 0; &:hover { color:#0f172a; } }
    .versions-list { margin-top:.5rem; display:flex; flex-direction:column; gap:.35rem; }
    .version-row { display:flex; align-items:center; justify-content:space-between; gap:.75rem; padding:.5rem .75rem; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; font-size:.8rem; }
    .version-info { display:flex; align-items:center; gap:.75rem; flex:1; flex-wrap:wrap; }
    .v-num  { font-weight:700; color:#3b82f6; font-size:.75rem; }
    .v-label { color:#374151; }
    .v-date  { color:#94a3b8; margin-left:auto; font-size:.72rem; }
    .btn-sm { padding:.25rem .625rem; font-size:.78rem; }
    .hint-inline { font-size:.75rem; color:#94a3b8; font-weight:400; }
    .form-grid { display:grid; grid-template-columns:1fr 1fr; gap:.75rem 1rem; }
    .toggle-label { display:flex; align-items:center; gap:.5rem; cursor:pointer; font-size:.85rem; input[type=checkbox] { width:15px; height:15px; cursor:pointer; } }
  `]
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
