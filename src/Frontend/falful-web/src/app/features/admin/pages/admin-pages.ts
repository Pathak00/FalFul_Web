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
  templateUrl: './admin-pages.html'
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
