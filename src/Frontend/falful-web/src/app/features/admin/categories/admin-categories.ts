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
  template: `
    <div class="admin-page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Categories</h1>
          <p class="page-subtitle">Manage product categories</p>
        </div>
        <button class="btn-primary" (click)="openCreate()">
          <i class="bi bi-plus-lg"></i> Add Category
        </button>
      </div>

      @if (loading()) {
        <div class="loading-state"><i class="bi bi-arrow-repeat spin"></i> Loading categories…</div>
      } @else if (categories().length === 0) {
        <div class="empty-state">
          <i class="bi bi-tag empty-icon"></i>
          <p>No categories yet. Add your first category.</p>
        </div>
      } @else {
        <div class="data-table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Slug</th>
                <th>Icon</th>
                <th>Order</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (cat of categories(); track cat.id) {
                <tr>
                  <td class="id-cell">{{ cat.id }}</td>
                  <td><strong>{{ cat.name }}</strong></td>
                  <td><code class="slug-badge">{{ cat.slug }}</code></td>
                  <td>
                    @if (cat.icon) {
                      @if (cat.icon.startsWith('bi-')) {
                        <i class="bi {{ cat.icon }}"></i>
                      } @else {
                        <span>{{ cat.icon }}</span>
                      }
                    }
                  </td>
                  <td>{{ cat.displayOrder }}</td>
                  <td>
                    <span class="status-badge" [class.active]="cat.isActive" [class.inactive]="!cat.isActive">
                      {{ cat.isActive ? 'Active' : 'Inactive' }}
                    </span>
                  </td>
                  <td class="actions-cell">
                    <button class="btn-sm btn-ghost" (click)="openEdit(cat)" title="Edit">
                      <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn-sm btn-danger-ghost" (click)="confirmDelete(cat)" title="Delete">
                      <i class="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>

    <!-- Create / Edit Modal -->
    @if (showForm()) {
      <div class="modal-backdrop" (click)="closeForm()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>{{ editTarget() ? 'Edit Category' : 'Add Category' }}</h2>
            <button class="modal-close" (click)="closeForm()"><i class="bi bi-x-lg"></i></button>
          </div>
          <div class="modal-body">
            @if (formError()) {
              <div class="form-error-box">
                <i class="bi bi-exclamation-circle-fill" style="color:#dc2626"></i>
                {{ formError() }}
              </div>
            }
            <div class="form-group">
              <label>Name <span class="required">*</span></label>
              <input [(ngModel)]="form.name" (ngModelChange)="autoSlug()" placeholder="e.g. Fresh Fruits" />
            </div>
            <div class="form-group">
              <label>Slug <span class="required">*</span></label>
              <input [(ngModel)]="form.slug" placeholder="e.g. fresh-fruits" />
            </div>
            <div class="form-group">
              <label>Description</label>
              <textarea [(ngModel)]="form.description" rows="2" placeholder="Short description"></textarea>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Icon (Bootstrap Icon class)</label>
                <input [(ngModel)]="form.icon" placeholder="e.g. bi-basket2-fill" />
              </div>
              <div class="form-group">
                <label>Display Order</label>
                <input type="number" [(ngModel)]="form.displayOrder" min="0" />
              </div>
            </div>
            <div class="form-group">
              <label>Image URL</label>
              <input [(ngModel)]="form.imageUrl" placeholder="https://..." />
            </div>
            @if (editTarget()) {
              <div class="form-group">
                <label class="checkbox-label">
                  <input type="checkbox" [(ngModel)]="formActive" />
                  <span>Active</span>
                </label>
              </div>
            }
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" (click)="closeForm()">Cancel</button>
            <button class="btn-primary" (click)="submitForm()" [disabled]="saving()">
              @if (saving()) { <i class="bi bi-arrow-repeat spin"></i> Saving… }
              @else { <i class="bi bi-check-lg"></i> {{ editTarget() ? 'Update' : 'Create' }} }
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Delete Confirm -->
    @if (deleteTarget()) {
      <div class="modal-backdrop" (click)="deleteTarget.set(null)">
        <div class="modal modal-sm" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Delete Category</h2>
            <button class="modal-close" (click)="deleteTarget.set(null)"><i class="bi bi-x-lg"></i></button>
          </div>
          <div class="modal-body">
            <div class="confirm-icon"><i class="bi bi-exclamation-triangle-fill" style="font-size:2rem;color:#dc2626;display:block;text-align:center;margin-bottom:.5rem"></i></div>
            <p style="text-align:center">Delete <strong>{{ deleteTarget()!.name }}</strong>?<br>
            <small style="color:#6b7280">Categories with active products cannot be deleted.</small></p>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" (click)="deleteTarget.set(null)">Cancel</button>
            <button class="btn-danger" (click)="doDelete()" [disabled]="saving()">
              @if (saving()) { <i class="bi bi-arrow-repeat spin"></i> } @else { <i class="bi bi-trash"></i> }
              Delete
            </button>
          </div>
        </div>
      </div>
    }
  `
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
