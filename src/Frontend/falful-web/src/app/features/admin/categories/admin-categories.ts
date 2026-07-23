import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../../core/services/product.service';
import { ToastService } from '../../../core/services/toast.service';
import { Category, CreateCategoryRequest, UpdateCategoryRequest } from '../../../core/models/product.models';

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrl: '../admin-shared.scss',
  templateUrl: './admin-categories.html'
})
export class AdminCategoriesComponent implements OnInit {
  private svc   = inject(ProductService);
  private toast = inject(ToastService);

  categories  = signal<Category[]>([]);
  loading     = signal(true);
  showForm    = signal(false);
  saving      = signal(false);
  formError   = signal('');
  editTarget  = signal<Category | null>(null);
  deleteTarget = signal<Category | null>(null);

  form: CreateCategoryRequest = this.emptyForm();
  formActive = true;

  ngOnInit() { this.load(); }

  private load() {
    this.loading.set(true);
    this.svc.getAllCategories().subscribe({
      next: cats => { this.categories.set(cats); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  openCreate() {
    this.editTarget.set(null);
    this.form = this.emptyForm();
    this.formActive = true;
    this.formError.set('');
    this.showForm.set(true);
  }

  openEdit(cat: Category) {
    this.editTarget.set(cat);
    this.form = { name: cat.name, slug: cat.slug, description: cat.description, icon: cat.icon, imageUrl: cat.imageUrl, displayOrder: cat.displayOrder };
    this.formActive = cat.isActive;
    this.formError.set('');
    this.showForm.set(true);
  }

  closeForm() { this.showForm.set(false); }

  autoSlug() {
    if (!this.editTarget()) {
      this.form.slug = this.form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    }
  }

  submitForm() {
    this.formError.set('');
    const target = this.editTarget();
    this.saving.set(true);
    const done = () => { this.saving.set(false); this.closeForm(); this.load(); };
    const fail = (e: { error?: { message?: string } }) => { this.saving.set(false); this.formError.set(e?.error?.message || 'Save failed.'); };
    if (target) {
      const dto: UpdateCategoryRequest = { ...this.form, isActive: this.formActive };
      this.svc.updateCategory(target.id, dto).subscribe({ next: done, error: fail });
    } else {
      this.svc.createCategory(this.form).subscribe({ next: done, error: fail });
    }
  }

  confirmDelete(cat: Category) { this.deleteTarget.set(cat); }

  doDelete() {
    const t = this.deleteTarget();
    if (!t) return;
    this.saving.set(true);
    this.svc.deleteCategory(t.id).subscribe({
      next: () => { this.saving.set(false); this.deleteTarget.set(null); this.load(); },
      error: (e: { error?: { message?: string } }) => { this.saving.set(false); this.toast.error(e?.error?.message || 'Delete failed.'); }
    });
  }

  private emptyForm(): CreateCategoryRequest {
    return { name: '', slug: '', description: '', icon: '', imageUrl: '', displayOrder: 0 };
  }
}
