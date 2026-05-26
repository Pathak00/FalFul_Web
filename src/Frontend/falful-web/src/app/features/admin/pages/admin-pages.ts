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
  template: `
    <div class="admin-page">
      <div class="page-header">
        <h1>Pages</h1>
        <button class="btn-primary" (click)="openForm()">+ New Page</button>
      </div>

      @if (loading()) {
        <p class="loading-text">Loading…</p>
      } @else {
        <div class="data-table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Title</th><th>Slug</th><th>Status</th><th>Updated</th><th></th>
              </tr>
            </thead>
            <tbody>
              @for (p of pages(); track p.id) {
                <tr>
                  <td>{{ p.title }}</td>
                  <td><code>/{{ p.slug }}</code></td>
                  <td>
                    <span class="badge" [class.badge-green]="p.isPublished" [class.badge-gray]="!p.isPublished">
                      {{ p.isPublished ? 'Published' : 'Draft' }}
                    </span>
                  </td>
                  <td>{{ p.updatedAt ? (p.updatedAt | date:'mediumDate') : '—' }}</td>
                  <td class="actions">
                    <button class="btn-sm btn-edit" (click)="edit(p.id)">Edit</button>
                    <button class="btn-sm btn-danger" (click)="delete(p.id)">Delete</button>
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="5" class="empty-cell">No pages yet.</td></tr>
              }
            </tbody>
          </table>
        </div>
      }

      @if (showForm()) {
        <div class="modal-overlay" (click)="closeForm()">
          <div class="modal" (click)="$event.stopPropagation()">
            <h2>{{ editing() ? 'Edit Page' : 'New Page' }}</h2>

            <div class="form-group">
              <label>Title</label>
              <input [(ngModel)]="form.title" placeholder="Page title" />
            </div>
            <div class="form-group">
              <label>Slug</label>
              <input [(ngModel)]="form.slug" placeholder="url-friendly-slug" />
            </div>
            <div class="form-group">
              <label>Content (HTML)</label>
              <textarea [(ngModel)]="form.content" rows="6" placeholder="<h1>Hello</h1>"></textarea>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Meta Title</label>
                <input [(ngModel)]="form.metaTitle" />
              </div>
              <div class="form-group">
                <label>Meta Description</label>
                <input [(ngModel)]="form.metaDescription" />
              </div>
            </div>
            <label class="checkbox-label">
              <input type="checkbox" [(ngModel)]="form.isPublished" /> Published
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
export class AdminPagesComponent implements OnInit {
  private cms = inject(CmsService);

  pages = signal<PageListItem[]>([]);
  loading = signal(true);
  showForm = signal(false);
  editing = signal(false);
  saving = signal(false);
  error = signal('');

  form: { id?: number; title: string; slug: string; content: string; metaTitle: string; metaDescription: string; isPublished: boolean } = this.emptyForm();

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

  save() {
    this.saving.set(true);
    const obs: Observable<unknown> = this.editing()
      ? this.cms.updatePage({ id: this.form.id!, title: this.form.title, slug: this.form.slug, content: this.form.content, metaTitle: this.form.metaTitle, metaDescription: this.form.metaDescription, isPublished: this.form.isPublished })
      : this.cms.createPage({ title: this.form.title, slug: this.form.slug, content: this.form.content, metaTitle: this.form.metaTitle, metaDescription: this.form.metaDescription, isPublished: this.form.isPublished });
    obs.subscribe({
      next: () => { this.saving.set(false); this.closeForm(); this.load(); },
      error: (e: any) => { this.saving.set(false); this.error.set(e.error?.message ?? 'Save failed.'); }
    });
  }

  delete(id: number) {
    if (!confirm('Delete this page?')) return;
    this.cms.deletePage(id).subscribe({ next: () => this.load() });
  }

  closeForm() { this.showForm.set(false); }

  private emptyForm() {
    return { title: '', slug: '', content: '', metaTitle: '', metaDescription: '', isPublished: false };
  }
}
