import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { Banner } from '../../../core/models/cms.models';
import { CmsService } from '../../../core/services/cms.service';

@Component({
  selector: 'app-admin-banners',
  standalone: true,
  imports: [FormsModule],
  styleUrl: '../admin-shared.scss',
  template: `
    <div class="admin-page">
      <div class="page-header">
        <div>
          <h1>Banners</h1>
          <p class="page-sub">Promotional banners appear as eye-catching strips or cards on your website. You can schedule them to show only between certain dates and choose where they appear.</p>
        </div>
        <button class="btn-primary" (click)="openForm()">+ New Banner</button>
      </div>

      @if (loading()) {
        <div class="empty-state">
          <div class="spinner"></div>
          <p>Loading banners…</p>
        </div>
      } @else if (banners().length === 0) {
        <div class="empty-state">
          <span class="empty-icon">🖼️</span>
          <h3>No banners yet</h3>
          <p>Create a promotional banner to show on your homepage — like a sale announcement or seasonal offer.</p>
          <button class="btn-primary" (click)="openForm()">+ Create First Banner</button>
        </div>
      } @else {
        <div class="data-table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Banner Title</th>
                <th>Appears On</th>
                <th>Status</th>
                <th>Order</th>
                <th>Schedule</th>
                <th style="text-align:right">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (b of banners(); track b.id) {
                <tr>
                  <td>
                    <strong>{{ b.title }}</strong>
                    @if (b.subtitle) { <br><span class="text-muted text-sm">{{ b.subtitle }}</span> }
                  </td>
                  <td><span class="badge badge-blue">{{ positionLabel(b.position) }}</span></td>
                  <td>
                    <span class="badge" [class.badge-green]="b.isActive" [class.badge-gray]="!b.isActive">
                      {{ b.isActive ? 'Active' : 'Inactive' }}
                    </span>
                  </td>
                  <td class="text-muted">#{{ b.displayOrder }}</td>
                  <td class="text-muted text-sm">
                    @if (b.startDate || b.endDate) {
                      {{ b.startDate ? b.startDate.substring(0,10) : '∞' }} → {{ b.endDate ? b.endDate.substring(0,10) : '∞' }}
                    } @else {
                      Always
                    }
                  </td>
                  <td class="actions">
                    <button class="btn-sm btn-edit" (click)="edit(b)">Edit</button>
                    <button class="btn-sm btn-danger" (click)="deleteTarget.set(b)">Delete</button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>

    @if (showForm()) {
      <div class="modal-overlay" (click)="closeForm()">
        <div class="modal modal-lg" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div>
              <h2>{{ editing() ? 'Edit Banner' : 'New Banner' }}</h2>
              <p class="modal-sub">{{ editing() ? 'Update this banner\'s content and settings.' : 'Create a new promotional banner for your website.' }}</p>
            </div>
            <button class="btn-close" (click)="closeForm()">✕</button>
          </div>

          <div class="form-section">
            <div class="form-group">
              <label>Banner Title <span class="required">*</span></label>
              <input [(ngModel)]="form.title" placeholder="e.g. Summer Sale — 20% Off All Fruits!" />
              <span class="field-hint">The main heading shown on the banner.</span>
            </div>
            <div class="form-group">
              <label>Subtitle</label>
              <input [(ngModel)]="form.subtitle" placeholder="e.g. Limited time offer. Free delivery on orders over ₹500." />
              <span class="field-hint">A short supporting line below the title.</span>
            </div>
          </div>

          <div class="form-section">
            <div class="form-row">
              <div class="form-group">
                <label>Button Text</label>
                <input [(ngModel)]="form.buttonText" placeholder="e.g. Shop Now" />
                <span class="field-hint">Leave blank if you don't need a button.</span>
              </div>
              <div class="form-group">
                <label>Button Link</label>
                <input [(ngModel)]="form.buttonLink" placeholder="e.g. /products or https://..." />
                <span class="field-hint">Where the button takes the visitor.</span>
              </div>
            </div>
            <div class="form-group">
              <label>Image URL</label>
              <input [(ngModel)]="form.imageUrl" placeholder="https://example.com/banner-image.jpg" />
              <span class="field-hint">Full URL to the banner background image. Leave blank for a text-only banner.</span>
            </div>
          </div>

          <div class="form-section">
            <div class="form-row">
              <div class="form-group">
                <label>Where to Show (Position)</label>
                <select [(ngModel)]="form.position">
                  <option value="home">🏠 Homepage</option>
                  <option value="products">🛒 Products Page</option>
                  <option value="sidebar">📌 Sidebar</option>
                </select>
                <span class="field-hint">Which page this banner will appear on.</span>
              </div>
              <div class="form-group">
                <label>Display Order</label>
                <input type="number" [(ngModel)]="form.displayOrder" min="0" />
                <span class="field-hint">Lower number = shown first. Use 0, 1, 2… to control order.</span>
              </div>
            </div>
          </div>

          <div class="form-section">
            <p class="section-label-sm">Schedule (optional — leave blank to always show)</p>
            <div class="form-row">
              <div class="form-group">
                <label>Start Date</label>
                <input type="date" [(ngModel)]="form.startDate" />
                <span class="field-hint">Banner won't show before this date.</span>
              </div>
              <div class="form-group">
                <label>End Date</label>
                <input type="date" [(ngModel)]="form.endDate" />
                <span class="field-hint">Banner automatically hides after this date.</span>
              </div>
            </div>
          </div>

          <div class="form-toggle-row">
            <label class="toggle-label">
              <div class="toggle" [class.on]="form.isActive" (click)="form.isActive = !form.isActive">
                <div class="toggle-thumb"></div>
              </div>
              <div>
                <strong>{{ form.isActive ? 'Active' : 'Inactive' }}</strong>
                <span>{{ form.isActive ? 'Banner is live on the website' : 'Banner is hidden from visitors' }}</span>
              </div>
            </label>
          </div>

          @if (error()) {
            <div class="form-error-box">⚠️ {{ error() }}</div>
          }

          <div class="modal-actions">
            <button class="btn-secondary" (click)="closeForm()">Cancel</button>
            <button class="btn-primary" (click)="save()" [disabled]="saving()">
              {{ saving() ? 'Saving…' : (editing() ? 'Save Changes' : 'Create Banner') }}
            </button>
          </div>
        </div>
      </div>
    }

    @if (deleteTarget()) {
      <div class="modal-overlay" (click)="deleteTarget.set(null)">
        <div class="modal modal-sm" (click)="$event.stopPropagation()">
          <div class="confirm-icon">🗑️</div>
          <h2>Delete Banner?</h2>
          <p>Are you sure you want to delete <strong>"{{ deleteTarget()!.title }}"</strong>?</p>
          <div class="modal-actions">
            <button class="btn-secondary" (click)="deleteTarget.set(null)">Cancel</button>
            <button class="btn-danger-solid" (click)="confirmDelete()">Yes, Delete</button>
          </div>
        </div>
      </div>
    }
  `
})
export class AdminBannersComponent implements OnInit {
  private cms = inject(CmsService);

  banners = signal<Banner[]>([]);
  loading = signal(true);
  showForm = signal(false);
  editing = signal(false);
  saving = signal(false);
  error = signal('');
  deleteTarget = signal<Banner | null>(null);

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

  closeForm() { this.showForm.set(false); }

  private emptyForm() {
    return { id: undefined as number | undefined, title: '', subtitle: '', buttonText: '', buttonLink: '', imageUrl: '', position: 'home', isActive: true, displayOrder: 0, startDate: '', endDate: '' };
  }
}
