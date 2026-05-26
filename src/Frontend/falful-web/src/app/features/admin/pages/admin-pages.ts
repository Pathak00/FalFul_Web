import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { PageListItem } from '../../../core/models/cms.models';
import { CmsService } from '../../../core/services/cms.service';

@Component({
  selector: 'app-admin-pages',
  standalone: true,
  imports: [FormsModule, DatePipe],
  styleUrl: '../admin-shared.scss',
  template: `
    <div class="admin-page">
      <div class="page-header">
        <div>
          <h1>Pages</h1>
          <p class="page-sub">Create and manage custom content pages. Each page is accessible on your website at <code>/pages/[slug]</code>. Use this for About Us, Terms & Conditions, FAQs, etc.</p>
        </div>
        <button class="btn-primary" (click)="openForm()">+ New Page</button>
      </div>

      @if (loading()) {
        <div class="empty-state">
          <div class="spinner"></div>
          <p>Loading pages…</p>
        </div>
      } @else if (pages().length === 0) {
        <div class="empty-state">
          <span class="empty-icon">📄</span>
          <h3>No pages yet</h3>
          <p>Create your first page — like an About Us or Terms & Conditions page.</p>
          <button class="btn-primary" (click)="openForm()">+ Create First Page</button>
        </div>
      } @else {
        <div class="data-table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Page Title</th>
                <th>URL Path</th>
                <th>Status</th>
                <th>Last Updated</th>
                <th style="text-align:right">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (p of pages(); track p.id) {
                <tr>
                  <td><strong>{{ p.title }}</strong></td>
                  <td><code>/pages/{{ p.slug }}</code></td>
                  <td>
                    <span class="badge" [class.badge-green]="p.isPublished" [class.badge-gray]="!p.isPublished">
                      {{ p.isPublished ? 'Published' : 'Draft' }}
                    </span>
                  </td>
                  <td class="text-muted">{{ (p.updatedAt ?? p.createdAt) | date:'d MMM y' }}</td>
                  <td class="actions">
                    <button class="btn-sm btn-edit" (click)="edit(p.id)">Edit</button>
                    <button class="btn-sm btn-danger" (click)="delete(p)">Delete</button>
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
              <h2>{{ editing() ? 'Edit Page' : 'New Page' }}</h2>
              <p class="modal-sub">{{ editing() ? 'Update the content of this page.' : 'Fill in the details to create a new content page on your website.' }}</p>
            </div>
            <button class="btn-close" (click)="closeForm()">✕</button>
          </div>

          <div class="form-section">
            <div class="form-group">
              <label>Page Title <span class="required">*</span></label>
              <input [(ngModel)]="form.title" (input)="autoSlug()" placeholder="e.g. About Us, Privacy Policy, FAQ" />
              <span class="field-hint">This is the heading shown at the top of the page.</span>
            </div>

            <div class="form-group">
              <label>URL Slug <span class="required">*</span></label>
              <div class="input-prefix-wrap">
                <span class="input-prefix">/pages/</span>
                <input [(ngModel)]="form.slug" placeholder="about-us" class="input-with-prefix" />
              </div>
              <span class="field-hint">The URL-friendly identifier. Auto-generated from the title. Use lowercase letters and hyphens only.</span>
            </div>
          </div>

          <div class="form-section">
            <div class="form-group">
              <label>Page Content</label>
              <textarea [(ngModel)]="form.content" rows="8" placeholder="Write your page content here. You can use HTML tags like &lt;h2&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;strong&gt;, etc."></textarea>
              <span class="field-hint">Supports HTML. Leave blank if you plan to add content later.</span>
            </div>
          </div>

          <div class="form-section form-section-collapsible">
            <details>
              <summary class="collapsible-label">SEO Settings <span class="optional-tag">optional</span></summary>
              <div class="collapsible-body">
                <div class="form-group">
                  <label>Meta Title</label>
                  <input [(ngModel)]="form.metaTitle" placeholder="e.g. About FalFul — Fresh Fruits Delivered" />
                  <span class="field-hint">Shown in browser tabs and search engine results. Leave blank to use the page title.</span>
                </div>
                <div class="form-group">
                  <label>Meta Description</label>
                  <input [(ngModel)]="form.metaDescription" placeholder="A short description for search engines (under 160 characters)" />
                  <span class="field-hint">Shown under the page title in Google search results.</span>
                </div>
              </div>
            </details>
          </div>

          <div class="form-toggle-row">
            <label class="toggle-label">
              <div class="toggle" [class.on]="form.isPublished" (click)="form.isPublished = !form.isPublished">
                <div class="toggle-thumb"></div>
              </div>
              <div>
                <strong>{{ form.isPublished ? 'Published' : 'Draft' }}</strong>
                <span>{{ form.isPublished ? 'Visible to all visitors' : 'Only visible to admins' }}</span>
              </div>
            </label>
          </div>

          @if (error()) {
            <div class="form-error-box">⚠️ {{ error() }}</div>
          }

          <div class="modal-actions">
            <button class="btn-secondary" (click)="closeForm()">Cancel</button>
            <button class="btn-primary" (click)="save()" [disabled]="saving()">
              {{ saving() ? 'Saving…' : (editing() ? 'Save Changes' : 'Create Page') }}
            </button>
          </div>
        </div>
      </div>
    }

    @if (deleteTarget()) {
      <div class="modal-overlay" (click)="deleteTarget.set(null)">
        <div class="modal modal-sm" (click)="$event.stopPropagation()">
          <div class="confirm-icon">🗑️</div>
          <h2>Delete Page?</h2>
          <p>Are you sure you want to delete <strong>"{{ deleteTarget()!.title }}"</strong>? This cannot be undone.</p>
          <div class="modal-actions">
            <button class="btn-secondary" (click)="deleteTarget.set(null)">Cancel</button>
            <button class="btn-danger-solid" (click)="confirmDelete()">Yes, Delete</button>
          </div>
        </div>
      </div>
    }
  `
})
export class AdminPagesComponent implements OnInit {
  private cms = inject(CmsService);

  pages = signal<PageListItem[]>([]);
  loading = signal(true);
  showForm = signal(false);
  editing = signal(false);
  saving = signal(false);
  error = signal('');
  deleteTarget = signal<PageListItem | null>(null);

  form = this.emptyForm();

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.cms.getPages().subscribe({ next: p => { this.pages.set(p); this.loading.set(false); }, error: () => this.loading.set(false) });
  }

  openForm() {
    this.form = this.emptyForm();
    this.editing.set(false);
    this.error.set('');
    this.showForm.set(true);
  }

  edit(id: number) {
    this.cms.getPageById(id).subscribe(p => {
      this.form = { id: p.id, title: p.title, slug: p.slug, content: p.content ?? '', metaTitle: p.metaTitle ?? '', metaDescription: p.metaDescription ?? '', isPublished: p.isPublished };
      this.editing.set(true);
      this.error.set('');
      this.showForm.set(true);
    });
  }

  autoSlug() {
    if (!this.editing()) {
      this.form.slug = this.form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    }
  }

  save() {
    if (!this.form.title.trim() || !this.form.slug.trim()) {
      this.error.set('Title and slug are required.');
      return;
    }
    this.saving.set(true);
    const obs: Observable<unknown> = this.editing()
      ? this.cms.updatePage({ id: this.form.id!, title: this.form.title, slug: this.form.slug, content: this.form.content, metaTitle: this.form.metaTitle, metaDescription: this.form.metaDescription, isPublished: this.form.isPublished })
      : this.cms.createPage({ title: this.form.title, slug: this.form.slug, content: this.form.content, metaTitle: this.form.metaTitle, metaDescription: this.form.metaDescription, isPublished: this.form.isPublished });
    obs.subscribe({
      next: () => { this.saving.set(false); this.closeForm(); this.load(); },
      error: (e: any) => { this.saving.set(false); this.error.set(e.error?.message ?? 'Failed to save page.'); }
    });
  }

  delete(p: PageListItem) { this.deleteTarget.set(p); }

  confirmDelete() {
    if (!this.deleteTarget()) return;
    this.cms.deletePage(this.deleteTarget()!.id).subscribe({ next: () => { this.deleteTarget.set(null); this.load(); } });
  }

  closeForm() { this.showForm.set(false); }

  private emptyForm() {
    return { id: undefined as number | undefined, title: '', slug: '', content: '', metaTitle: '', metaDescription: '', isPublished: false };
  }
}
