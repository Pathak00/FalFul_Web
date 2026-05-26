import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { Banner } from '../../../core/models/cms.models';
import { CmsService } from '../../../core/services/cms.service';

@Component({
  selector: 'app-admin-banners',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="admin-page">
      <div class="page-header">
        <h1>Banners</h1>
        <button class="btn-primary" (click)="openForm()">+ New Banner</button>
      </div>

      @if (loading()) {
        <p class="loading-text">Loading…</p>
      } @else {
        <div class="data-table-wrap">
          <table class="data-table">
            <thead>
              <tr><th>Title</th><th>Position</th><th>Status</th><th>Order</th><th></th></tr>
            </thead>
            <tbody>
              @for (b of banners(); track b.id) {
                <tr>
                  <td>{{ b.title }}</td>
                  <td><span class="badge badge-blue">{{ b.position }}</span></td>
                  <td>
                    <span class="badge" [class.badge-green]="b.isActive" [class.badge-gray]="!b.isActive">
                      {{ b.isActive ? 'Active' : 'Inactive' }}
                    </span>
                  </td>
                  <td>{{ b.displayOrder }}</td>
                  <td class="actions">
                    <button class="btn-sm btn-edit" (click)="edit(b)">Edit</button>
                    <button class="btn-sm btn-danger" (click)="delete(b.id)">Delete</button>
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="5" class="empty-cell">No banners yet.</td></tr>
              }
            </tbody>
          </table>
        </div>
      }

      @if (showForm()) {
        <div class="modal-overlay" (click)="closeForm()">
          <div class="modal" (click)="$event.stopPropagation()">
            <h2>{{ editing() ? 'Edit Banner' : 'New Banner' }}</h2>

            <div class="form-group">
              <label>Title</label>
              <input [(ngModel)]="form.title" />
            </div>
            <div class="form-group">
              <label>Subtitle</label>
              <input [(ngModel)]="form.subtitle" />
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Button Text</label>
                <input [(ngModel)]="form.buttonText" />
              </div>
              <div class="form-group">
                <label>Button Link</label>
                <input [(ngModel)]="form.buttonLink" />
              </div>
            </div>
            <div class="form-group">
              <label>Image URL</label>
              <input [(ngModel)]="form.imageUrl" />
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Position</label>
                <select [(ngModel)]="form.position">
                  <option value="home">Home</option>
                  <option value="products">Products</option>
                  <option value="sidebar">Sidebar</option>
                </select>
              </div>
              <div class="form-group">
                <label>Display Order</label>
                <input type="number" [(ngModel)]="form.displayOrder" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Start Date</label>
                <input type="date" [(ngModel)]="form.startDate" />
              </div>
              <div class="form-group">
                <label>End Date</label>
                <input type="date" [(ngModel)]="form.endDate" />
              </div>
            </div>
            <label class="checkbox-label">
              <input type="checkbox" [(ngModel)]="form.isActive" /> Active
            </label>

            @if (error()) {
              <p class="form-error">{{ error() }}</p>
            }

            <div class="modal-actions">
              <button class="btn-secondary" (click)="closeForm()">Cancel</button>
              <button class="btn-primary" (click)="save()" [disabled]="saving()">
                {{ saving() ? 'Saving…' : 'Save' }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styleUrl: '../admin-shared.scss'
})
export class AdminBannersComponent implements OnInit {
  private cms = inject(CmsService);

  banners = signal<Banner[]>([]);
  loading = signal(true);
  showForm = signal(false);
  editing = signal(false);
  saving = signal(false);
  error = signal('');

  form: { id?: number; title: string; subtitle: string; buttonText: string; buttonLink: string; imageUrl: string; position: string; isActive: boolean; displayOrder: number; startDate: string; endDate: string } = this.emptyForm();

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
      error: (e: any) => { this.saving.set(false); this.error.set(e.error?.message ?? 'Save failed.'); }
    });
  }

  delete(id: number) {
    if (!confirm('Delete this banner?')) return;
    this.cms.deleteBanner(id).subscribe({ next: () => this.load() });
  }

  closeForm() { this.showForm.set(false); }

  private emptyForm() {
    return { title: '', subtitle: '', buttonText: '', buttonLink: '', imageUrl: '', position: 'home', isActive: true, displayOrder: 0, startDate: '', endDate: '' };
  }
}
