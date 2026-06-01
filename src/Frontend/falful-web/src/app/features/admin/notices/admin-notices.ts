import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DiscountService } from '../../../core/services/discount.service';
import { ToastService } from '../../../core/services/toast.service';
import { NoticeDto, CreateNoticeDto } from '../../../core/models/discount.models';
import { environment } from '../../../../environments/environment';

const TYPE_LABELS: Record<number, string> = { 1: 'Info', 2: 'Warning', 3: 'Success', 4: 'Error' };
const TARGET_LABELS: Record<number, string> = { 1: 'All Users', 2: 'Customers', 3: 'Organizations' };

@Component({
  selector: 'app-admin-notices',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrl: '../admin-shared.scss',
  template: `
    <div class="admin-page" style="max-width:1100px">

      <div class="page-header">
        <div>
          <h1>Notices & Announcements</h1>
          <p class="page-sub">Create notices that appear as banners on the site. Add an image to show a popup banner (e.g. flash sales).</p>
        </div>
        <button class="btn-primary" (click)="openCreate()">
          <i class="bi bi-plus-lg"></i> New Notice
        </button>
      </div>

      @if (loading()) {
        <div class="loading-state"><div class="spinner"></div> Loading…</div>
      } @else if (notices().length === 0) {
        <div class="empty-state">
          <i class="bi bi-megaphone"></i>
          <p>No notices yet. Create one to show announcements on the site.</p>
        </div>
      } @else {
        <div class="notices-list">
          @for (n of notices(); track n.id) {
            <div class="notice-card" [class]="'notice-card--' + typeClass(n.noticeType)">
              @if (n.imageUrl) {
                <div class="notice-thumb">
                  <img [src]="resolveUrl(n.imageUrl)" alt="notice image" />
                  <span class="img-badge"><i class="bi bi-image"></i> Image Banner</span>
                </div>
              }
              <div class="notice-meta">
                <span class="notice-type-badge" [class]="'ntb--' + typeClass(n.noticeType)">
                  <i class="bi {{ typeIcon(n.noticeType) }}"></i> {{ n.noticeTypeLabel }}
                </span>
                <span class="notice-target"><i class="bi bi-people"></i> {{ n.targetLabel }}</span>
                @if (n.startDate || n.endDate) {
                  <span class="notice-dates"><i class="bi bi-calendar3"></i>
                    {{ n.startDate ?? '—' }} → {{ n.endDate ?? '∞' }}
                  </span>
                }
                <span class="status-badge" [class.active]="n.isActive" [class.inactive]="!n.isActive">
                  {{ n.isActive ? 'Active' : 'Inactive' }}
                </span>
              </div>
              <div class="notice-content">
                <h4>{{ n.title }}</h4>
                <p>{{ n.message }}</p>
              </div>
              <div class="notice-actions">
                <button class="btn-icon" title="Edit" (click)="openEdit(n)"><i class="bi bi-pencil"></i></button>
                <button class="btn-icon btn-danger" title="Delete" (click)="confirmDelete(n)"><i class="bi bi-trash"></i></button>
              </div>
            </div>
          }
        </div>
      }
    </div>

    <!-- ── Create / Edit modal ─────────────────────────────────────────────── -->
    @if (showModal()) {
      <div class="modal-overlay" (click)="closeModal()">
        <div class="modal-box" style="max-width:600px" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>{{ editId() ? 'Edit Notice' : 'New Notice' }}</h3>
            <button class="modal-close" (click)="closeModal()"><i class="bi bi-x-lg"></i></button>
          </div>

          <div class="modal-body">
            <div class="form-grid">

              <div class="form-group full-span">
                <label>Title *</label>
                <input type="text" [(ngModel)]="form.title" placeholder="Flash Sale — 20% off all fruit baskets!" />
              </div>

              <div class="form-group full-span">
                <label>Message *</label>
                <textarea [(ngModel)]="form.message" rows="2" placeholder="Use code FLASH20 at checkout. Valid today only!"></textarea>
              </div>

              <!-- Image / PDF upload -->
              <div class="form-group full-span">
                <label>Banner Image or PDF <span class="hint-inline">(optional — shows as popup on page load and on the Promotions page)</span></label>

                @if (form.imageUrl) {
                  <div class="img-preview-wrap">
                    @if (isPdf(form.imageUrl)) {
                      <div class="pdf-preview-thumb">
                        <i class="bi bi-file-earmark-pdf-fill"></i>
                        <span>{{ pdfName(form.imageUrl) }}</span>
                      </div>
                    } @else {
                      <img [src]="resolveUrl(form.imageUrl)" class="img-preview" alt="preview" />
                    }
                    <button type="button" class="btn-remove-img" (click)="removeImage()" title="Remove file">
                      <i class="bi bi-x-circle-fill"></i>
                    </button>
                  </div>
                } @else {
                  <div class="img-upload-zone" (click)="fileInput.click()" (dragover)="$event.preventDefault()" (drop)="onDrop($event)">
                    @if (uploading()) {
                      <div class="spinner-sm"></div> <span>Uploading…</span>
                    } @else {
                      <i class="bi bi-cloud-upload fs-2"></i>
                      <span>Click or drag & drop an image or PDF here</span>
                      <span class="hint-inline">JPG, PNG, WebP, PDF — max 10 MB</span>
                    }
                  </div>
                  <input #fileInput type="file" accept="image/*,.pdf" class="d-none" (change)="onFileChange($event)" />
                }
              </div>

              <div class="form-group">
                <label>Type *</label>
                <select [(ngModel)]="form.noticeType">
                  <option [ngValue]="1">ℹ️ Info</option>
                  <option [ngValue]="2">⚠️ Warning</option>
                  <option [ngValue]="3">✅ Success</option>
                  <option [ngValue]="4">❌ Error</option>
                </select>
              </div>

              <div class="form-group">
                <label>Target Audience *</label>
                <select [(ngModel)]="form.target">
                  <option [ngValue]="1">All Users</option>
                  <option [ngValue]="2">Customers Only</option>
                  <option [ngValue]="3">Organizations Only</option>
                </select>
              </div>

              <div class="form-group">
                <label>Start Date <span class="hint-inline">(blank = immediate)</span></label>
                <input type="date" [(ngModel)]="form.startDate" />
              </div>

              <div class="form-group">
                <label>End Date <span class="hint-inline">(blank = no expiry)</span></label>
                <input type="date" [(ngModel)]="form.endDate" />
              </div>

              <div class="form-group full-span">
                <label class="toggle-label">
                  <input type="checkbox" [(ngModel)]="form.isActive" />
                  <span>Active (show this notice on the site)</span>
                </label>
              </div>

            </div>

            @if (formError()) {
              <div class="form-error"><i class="bi bi-exclamation-circle"></i> {{ formError() }}</div>
            }
          </div>

          <div class="modal-footer">
            <button class="btn-secondary" (click)="closeModal()">Cancel</button>
            <button class="btn-primary" (click)="save()" [disabled]="saving() || uploading()">
              @if (saving()) { <span class="spinner-sm"></span> Saving… }
              @else { <i class="bi bi-check-lg"></i> {{ editId() ? 'Save Changes' : 'Create Notice' }} }
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
            <h3>Delete Notice</h3>
            <button class="modal-close" (click)="deleteTarget.set(null)"><i class="bi bi-x-lg"></i></button>
          </div>
          <div class="modal-body">
            <p>Delete notice <strong>"{{ deleteTarget()!.title }}"</strong>? This cannot be undone.</p>
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
    .notices-list { display:flex; flex-direction:column; gap:1rem; }
    .notice-card {
      background:#fff; border:1px solid #e2e8f0; border-left:4px solid #94a3b8;
      border-radius:10px; padding:1rem 1.25rem; display:grid;
      grid-template-columns:1fr auto; grid-template-rows:auto auto auto; gap:.5rem .75rem;
    }
    .notice-card--info    { border-left-color:#3b82f6; }
    .notice-card--warning { border-left-color:#f59e0b; }
    .notice-card--success { border-left-color:#22c55e; }
    .notice-card--error   { border-left-color:#ef4444; }
    .notice-thumb { grid-column:1/-1; position:relative; display:inline-flex; align-items:flex-start; gap:.75rem;
      img { height:80px; border-radius:6px; object-fit:cover; border:1px solid #e2e8f0; }
    }
    .img-badge { background:#0f172a; color:#fff; font-size:.7rem; padding:.2rem .5rem; border-radius:999px;
      display:flex; align-items:center; gap:.25rem; align-self:flex-end; }
    .notice-meta { display:flex; flex-wrap:wrap; align-items:center; gap:.5rem; grid-column:1; }
    .notice-content { grid-column:1;
      h4 { margin:0 0 .2rem; font-size:.95rem; font-weight:700; color:#0f172a; }
      p  { margin:0; font-size:.875rem; color:#475569; }
    }
    .notice-actions { grid-column:2; grid-row:2/4; display:flex; gap:.35rem; align-items:flex-start; }
    .notice-type-badge { display:flex; align-items:center; gap:.3rem; padding:.2rem .6rem;
      border-radius:999px; font-size:.75rem; font-weight:600; }
    .ntb--info    { background:#dbeafe; color:#1d4ed8; }
    .ntb--warning { background:#fef3c7; color:#b45309; }
    .ntb--success { background:#dcfce7; color:#15803d; }
    .ntb--error   { background:#fee2e2; color:#b91c1c; }
    .notice-target { font-size:.78rem; color:#64748b; }
    .notice-dates  { font-size:.78rem; color:#94a3b8; }
    .status-badge { padding:.2rem .6rem; border-radius:999px; font-size:.75rem; font-weight:600; }
    .status-badge.active   { background:#dcfce7; color:#15803d; }
    .status-badge.inactive { background:#f1f5f9; color:#94a3b8; }
    .hint-inline { font-size:.75rem; color:#94a3b8; font-weight:400; }
    .form-grid { display:grid; grid-template-columns:1fr 1fr; gap:.75rem 1rem; }
    .full-span { grid-column:1/-1; }
    .toggle-label { display:flex; align-items:center; gap:.5rem; cursor:pointer;
      input[type=checkbox] { width:16px; height:16px; cursor:pointer; }
    }
    /* image upload */
    .d-none { display:none; }
    .img-upload-zone {
      border:2px dashed #cbd5e1; border-radius:10px; padding:2rem 1rem;
      display:flex; flex-direction:column; align-items:center; gap:.4rem;
      cursor:pointer; color:#64748b; transition:border-color .2s, background .2s;
      &:hover { border-color:#3b82f6; background:#f0f7ff; }
      .fs-2 { font-size:1.75rem; }
    }
    .img-preview-wrap { position:relative; display:inline-block;
      img.img-preview { max-height:160px; border-radius:8px; border:1px solid #e2e8f0; display:block; }
      .btn-remove-img { position:absolute; top:-8px; right:-8px; background:none; border:none;
        cursor:pointer; color:#ef4444; font-size:1.25rem; line-height:1;
        &:hover { color:#b91c1c; }
      }
    }
    .pdf-preview-thumb {
      display:flex; align-items:center; gap:.65rem; padding:.85rem 1.1rem;
      background:#fff5f5; border:1px solid #fecaca; border-radius:8px; color:#b91c1c;
      i { font-size:1.75rem; flex-shrink:0; }
      span { font-size:.85rem; font-weight:600; word-break:break-all; }
    }
  `]
})
export class AdminNoticesComponent implements OnInit {
  private discountSvc = inject(DiscountService);
  private toast       = inject(ToastService);

  notices      = signal<NoticeDto[]>([]);
  loading      = signal(true);
  showModal    = signal(false);
  saving       = signal(false);
  uploading    = signal(false);
  formError    = signal('');
  editId       = signal<number | null>(null);
  deleteTarget = signal<NoticeDto | null>(null);

  form: CreateNoticeDto = this.blankForm();

  readonly apiBase = environment.apiUrl;

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.discountSvc.getAllNotices().subscribe({
      next: list => { this.notices.set(list); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  openCreate() {
    this.form = this.blankForm();
    this.editId.set(null);
    this.formError.set('');
    this.showModal.set(true);
  }

  openEdit(n: NoticeDto) {
    this.form = {
      title: n.title, message: n.message, noticeType: n.noticeType,
      target: n.target, startDate: n.startDate, endDate: n.endDate,
      isActive: n.isActive, imageUrl: n.imageUrl
    };
    this.editId.set(n.id);
    this.formError.set('');
    this.showModal.set(true);
  }

  closeModal() { this.showModal.set(false); }

  onFileChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.uploadFile(file);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (file) this.uploadFile(file);
  }

  private uploadFile(file: File) {
    this.uploading.set(true);
    this.discountSvc.uploadImage(file).subscribe({
      next: res => { this.form = { ...this.form, imageUrl: res.url }; this.uploading.set(false); },
      error: () => { this.toast.error('Image upload failed.'); this.uploading.set(false); }
    });
  }

  removeImage() { this.form = { ...this.form, imageUrl: undefined }; }

  isPdf(url: string) { return url?.toLowerCase().endsWith('.pdf'); }
  pdfName(url: string) { return url.split('/').pop() ?? 'document.pdf'; }

  resolveUrl(url: string): string {
    return url.startsWith('http') ? url : `${this.apiBase}${url}`;
  }

  save() {
    if (!this.form.title?.trim())   { this.formError.set('Title is required.'); return; }
    if (!this.form.message?.trim()) { this.formError.set('Message is required.'); return; }

    this.saving.set(true);
    const req = this.editId()
      ? this.discountSvc.updateNotice(this.editId()!, this.form)
      : this.discountSvc.createNotice(this.form);

    req.subscribe({
      next: () => {
        this.toast.success(this.editId() ? 'Notice updated.' : 'Notice created.');
        this.saving.set(false);
        this.closeModal();
        this.load();
      },
      error: (e: { error?: { message?: string } }) => {
        this.formError.set(e.error?.message ?? 'Failed to save notice.');
        this.saving.set(false);
      }
    });
  }

  confirmDelete(n: NoticeDto) { this.deleteTarget.set(n); }

  doDelete() {
    const n = this.deleteTarget();
    if (!n) return;
    this.saving.set(true);
    this.discountSvc.deleteNotice(n.id).subscribe({
      next: () => {
        this.toast.success('Notice deleted.');
        this.saving.set(false);
        this.deleteTarget.set(null);
        this.load();
      },
      error: () => { this.toast.error('Failed to delete notice.'); this.saving.set(false); }
    });
  }

  typeClass(t: number) { return { 1: 'info', 2: 'warning', 3: 'success', 4: 'error' }[t] ?? 'info'; }
  typeIcon(t: number)  { return { 1: 'bi-info-circle', 2: 'bi-exclamation-triangle', 3: 'bi-check-circle', 4: 'bi-x-circle' }[t] ?? 'bi-info-circle'; }

  private blankForm(): CreateNoticeDto {
    return { title: '', message: '', noticeType: 1, target: 1, startDate: undefined, endDate: undefined, isActive: true, imageUrl: undefined };
  }
}
