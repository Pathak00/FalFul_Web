import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DiscountService } from '../../../core/services/discount.service';
import { ToastService } from '../../../core/services/toast.service';
import { NoticeDto, CreateNoticeDto } from '../../../core/models/discount.models';
import { ImageUrlService } from '../../../core/services/image-url.service';

const TYPE_LABELS: Record<number, string> = { 1: 'Info', 2: 'Warning', 3: 'Success', 4: 'Error' };
const TARGET_LABELS: Record<number, string> = { 1: 'All Users', 2: 'Customers', 3: 'Organizations' };

@Component({
  selector: 'app-admin-notices',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['../admin-shared.scss', './admin-notices.scss'],
  templateUrl: './admin-notices.html'
})
export class AdminNoticesComponent implements OnInit {
  private discountSvc = inject(DiscountService);
  private toast       = inject(ToastService);
  protected imgSvc    = inject(ImageUrlService);

  notices      = signal<NoticeDto[]>([]);
  loading      = signal(true);
  showModal    = signal(false);
  saving       = signal(false);
  uploading    = signal(false);
  formError    = signal('');
  editId       = signal<number | null>(null);
  deleteTarget = signal<NoticeDto | null>(null);

  form: CreateNoticeDto = this.blankForm();

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
