import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { Banner } from '../../../core/models/cms.models';
import { CmsService } from '../../../core/services/cms.service';
import { UploadService } from '../../../core/services/upload.service';
import { ImageUrlService } from '../../../core/services/image-url.service';

@Component({
  selector: 'app-admin-banners',
  standalone: true,
  imports: [FormsModule],
  styleUrl: '../admin-shared.scss',
  templateUrl: './admin-banners.html'
})
export class AdminBannersComponent implements OnInit {
  private cms       = inject(CmsService);
  private uploadSvc = inject(UploadService);
  protected imgSvc  = inject(ImageUrlService);

  banners      = signal<Banner[]>([]);
  loading      = signal(true);
  showForm     = signal(false);
  editing      = signal(false);
  saving       = signal(false);
  error        = signal('');
  uploading    = signal(false);
  uploadError  = signal('');
  deleteTarget = signal<Banner | null>(null);

  onImagePicked(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.uploading.set(true);
    this.uploadError.set('');
    this.uploadSvc.upload(file).subscribe({
      next: url  => { this.form.imageUrl = url; this.uploading.set(false); },
      error: (e: { error?: { message?: string } }) => {
        this.uploadError.set(e?.error?.message || 'Upload failed.');
        this.uploading.set(false);
      }
    });
  }

  form = this.emptyForm();

  positionLabel(p: string) {
    return p === 'home' ? 'Homepage' : p === 'products' ? 'Products' : p === 'sidebar' ? 'Sidebar' : p;
  }

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.cms.getBanners().subscribe({ next: b => { this.banners.set(b); this.loading.set(false); }, error: () => this.loading.set(false) });
  }

  openForm() {
    this.form = this.emptyForm();
    this.editing.set(false);
    this.error.set('');
    this.showForm.set(true);
  }

  edit(b: Banner) {
    this.form = {
      id: b.id, title: b.title, subtitle: b.subtitle ?? '', buttonText: b.buttonText ?? '',
      buttonLink: b.buttonLink ?? '', imageUrl: b.imageUrl ?? '', position: b.position,
      isActive: b.isActive, displayOrder: b.displayOrder,
      startDate: b.startDate ? b.startDate.substring(0, 10) : '',
      endDate: b.endDate ? b.endDate.substring(0, 10) : ''
    };
    this.editing.set(true);
    this.error.set('');
    this.showForm.set(true);
  }

  save() {
    if (!this.form.title.trim()) { this.error.set('Banner title is required.'); return; }
    this.saving.set(true);
    const dto = {
      title: this.form.title, subtitle: this.form.subtitle || undefined,
      buttonText: this.form.buttonText || undefined, buttonLink: this.form.buttonLink || undefined,
      imageUrl: this.form.imageUrl || undefined, position: this.form.position,
      isActive: this.form.isActive, displayOrder: this.form.displayOrder,
      startDate: this.form.startDate || undefined, endDate: this.form.endDate || undefined
    };
    const obs: Observable<unknown> = this.editing()
      ? this.cms.updateBanner({ ...dto, id: this.form.id! })
      : this.cms.createBanner(dto);
    obs.subscribe({
      next: () => { this.saving.set(false); this.closeForm(); this.load(); },
      error: (e: any) => { this.saving.set(false); this.error.set(e.error?.message ?? 'Failed to save banner.'); }
    });
  }

  confirmDelete() {
    if (!this.deleteTarget()) return;
    this.cms.deleteBanner(this.deleteTarget()!.id).subscribe({ next: () => { this.deleteTarget.set(null); this.load(); } });
  }

  closeForm() { this.showForm.set(false); this.uploadError.set(''); }

  private emptyForm() {
    return { id: undefined as number | undefined, title: '', subtitle: '', buttonText: '', buttonLink: '', imageUrl: '', position: 'home', isActive: true, displayOrder: 0, startDate: '', endDate: '' };
  }
}
