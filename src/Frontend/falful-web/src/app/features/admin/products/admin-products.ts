import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../../core/services/product.service';
import { UploadService } from '../../../core/services/upload.service';
import { ToastService } from '../../../core/services/toast.service';
import { Category, Product, CreateProductRequest, PRODUCT_UNITS } from '../../../core/models/product.models';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['../admin-shared.scss', './admin-products.scss'],
  template: `
    <div class="admin-page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Products</h1>
          <p class="page-subtitle">Manage your fruit product catalog</p>
        </div>
        <button class="btn-primary" (click)="openCreate()">
          <i class="bi bi-plus-lg"></i> Add Product
        </button>
      </div>

      <!-- Filters -->
      <div class="filter-bar">
        <select [(ngModel)]="filterCategory" (ngModelChange)="load()">
          <option [ngValue]="undefined">All Categories</option>
          @for (cat of categories(); track cat.id) {
            <option [ngValue]="cat.id">{{ cat.name }}</option>
          }
        </select>
        <input [(ngModel)]="filterSearch" (ngModelChange)="onSearch()" placeholder="Search products…" />
      </div>

      @if (loading()) {
        <div class="loading-state"><i class="bi bi-arrow-repeat spin"></i> Loading products…</div>
      } @else if (products().length === 0) {
        <div class="empty-state">
          <i class="bi bi-box-seam empty-icon"></i>
          <p>No products found. Add your first product.</p>
        </div>
      } @else {
        <div class="data-table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Image</th>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Unit</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (p of products(); track p.id) {
                <tr>
                  <td class="id-cell">{{ p.id }}</td>
                  <td>
                    @if (p.imageUrl) {
                      <img [src]="p.imageUrl" [alt]="p.name" class="product-img-preview" />
                    } @else {
                      <div class="no-img"><i class="bi bi-image"></i></div>
                    }
                  </td>
                  <td>
                    <strong>{{ p.name }}</strong>
                    @if (p.isFeatured) { <i class="bi bi-star-fill featured-star" title="Featured"></i> }
                    <br><small style="color:#94a3b8">{{ p.slug }}</small>
                  </td>
                  <td>{{ p.categoryName }}</td>
                  <td class="price-cell">Rs. {{ p.price | number:'1.0-0' }}</td>
                  <td><span class="unit-badge">{{ p.unit }}</span></td>
                  <td>{{ p.stock | number:'1.0-1' }}</td>
                  <td>
                    <span class="status-badge" [class.active]="p.isAvailable" [class.inactive]="!p.isAvailable"
                          style="cursor:pointer" (click)="toggleAvail(p)" [title]="p.isAvailable ? 'Click to mark unavailable' : 'Click to mark available'">
                      {{ p.isAvailable ? 'Available' : 'Unavailable' }}
                    </span>
                  </td>
                  <td class="actions-cell">
                    <button class="btn-sm btn-ghost" (click)="openEdit(p)" title="Edit">
                      <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn-sm btn-danger-ghost" (click)="confirmDelete(p)" title="Delete">
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
        <div class="modal modal-lg" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>{{ editTarget() ? 'Edit Product' : 'Add Product' }}</h2>
            <button class="modal-close" (click)="closeForm()"><i class="bi bi-x-lg"></i></button>
          </div>
          <div class="modal-body">
            @if (formError()) {
              <div class="form-error-box">
                <i class="bi bi-exclamation-circle-fill" style="color:#dc2626"></i>
                {{ formError() }}
              </div>
            }
            <div class="form-row">
              <div class="form-group" style="flex:2">
                <label>Name <span class="required">*</span></label>
                <input [(ngModel)]="form.name" (ngModelChange)="autoSlug()" placeholder="e.g. Fresh Mango" />
              </div>
              <div class="form-group" style="flex:1">
                <label>Category <span class="required">*</span></label>
                <select [(ngModel)]="form.categoryId">
                  <option [ngValue]="0" disabled>Select category</option>
                  @for (cat of categories(); track cat.id) {
                    <option [ngValue]="cat.id">{{ cat.name }}</option>
                  }
                </select>
              </div>
            </div>
            <div class="form-group">
              <label>Slug <span class="required">*</span></label>
              <input [(ngModel)]="form.slug" placeholder="auto-generated from name" />
            </div>
            <div class="form-group">
              <label>Short Description</label>
              <input [(ngModel)]="form.shortDescription" placeholder="One-line summary (shown in cards)" />
            </div>
            <div class="form-group">
              <label>Description</label>
              <textarea [(ngModel)]="form.description" rows="3" placeholder="Full product description"></textarea>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Per KG Price (Rs.) <span class="required">*</span></label>
                <input type="number" [(ngModel)]="form.price" min="0" step="0.01" placeholder="e.g. 250" />
              </div>
              <div class="form-group">
                <label>Unit <span class="required">*</span></label>
                <select [(ngModel)]="form.unit">
                  @for (u of units; track u) { <option [value]="u">{{ u }}</option> }
                </select>
              </div>
              <div class="form-group">
                <label>Stock</label>
                <input type="number" [(ngModel)]="form.stock" min="0" step="0.1" />
              </div>
              <div class="form-group">
                <label>Display Order</label>
                <input type="number" [(ngModel)]="form.displayOrder" min="0" />
              </div>
            </div>
            <div class="form-group">
              <label>Product Image</label>
              <div class="image-picker" (click)="imgInput.click()">
                @if (uploading()) {
                  <div class="img-uploading"><i class="bi bi-arrow-repeat spin"></i> Uploading…</div>
                } @else if (form.imageUrl) {
                  <img [src]="form.imageUrl" class="img-preview" [alt]="form.name" />
                  <button type="button" class="img-remove" (click)="$event.stopPropagation(); form.imageUrl = ''">
                    <i class="bi bi-x-lg"></i>
                  </button>
                } @else {
                  <div class="img-placeholder">
                    <i class="bi bi-cloud-upload"></i>
                    <span>Click to upload image</span>
                    <small>JPG, PNG, WEBP · max 5 MB</small>
                  </div>
                }
              </div>
              <input #imgInput type="file" accept="image/*" style="display:none" (change)="onImagePicked($event)" />
              @if (uploadError()) {
                <span style="font-size:.75rem;color:#dc2626">{{ uploadError() }}</span>
              }
            </div>
            <div class="form-group">
              <label>Tags <small style="color:#94a3b8">(comma-separated)</small></label>
              <input [(ngModel)]="form.tags" placeholder="mango,tropical,summer" />
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Min Order Grams <small style="color:#94a3b8">(cut fruits only)</small></label>
                <input type="number" [(ngModel)]="form.minOrderGrams" min="0" step="50" placeholder="e.g. 300" />
              </div>
              <div class="form-group">
                <label>Gram Step <small style="color:#94a3b8">(increment; blank = global default)</small></label>
                <input type="number" [(ngModel)]="form.gramStep" min="0" step="50" placeholder="e.g. 150" />
              </div>
            </div>
            @if (form.minOrderGrams && form.minOrderGrams > 0) {
              <div class="form-group">
                <label>
                  Cut Fruit Base Price (Rs. at {{ form.minOrderGrams }}g)
                  <small style="color:#94a3b8"> — used for cut portions &amp; Build Your Bowl</small>
                </label>
                <input type="number" [(ngModel)]="form.cutFruitPrice" min="0" step="0.01"
                       placeholder="e.g. 120 for {{ form.minOrderGrams }}g" />
                @if (form.cutFruitPrice && form.minOrderGrams) {
                  <small style="color:#16a34a;display:block;margin-top:.25rem">
                    ≈ Rs. {{ (form.cutFruitPrice / form.minOrderGrams * 100) | number:'1.0-1' }} per 100g
                  </small>
                }
              </div>
            }
            <div class="form-row" style="gap:1.5rem">
              <label class="checkbox-label">
                <input type="checkbox" [(ngModel)]="form.isAvailable" />
                <span>Available</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" [(ngModel)]="form.isFeatured" />
                <span>Featured <i class="bi bi-star-fill" style="color:#f59e0b;font-size:.8rem"></i></span>
              </label>
            </div>
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
            <h2>Delete Product</h2>
            <button class="modal-close" (click)="deleteTarget.set(null)"><i class="bi bi-x-lg"></i></button>
          </div>
          <div class="modal-body" style="text-align:center">
            <i class="bi bi-exclamation-triangle-fill" style="font-size:2rem;color:#dc2626;display:block;margin-bottom:.75rem"></i>
            <p>Delete <strong>{{ deleteTarget()!.name }}</strong>?<br>
            <small style="color:#6b7280">This action soft-deletes the product.</small></p>
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
export class AdminProductsComponent implements OnInit {
  private svc    = inject(ProductService);
  private upload = inject(UploadService);
  private toast  = inject(ToastService);

  products     = signal<Product[]>([]);
  categories   = signal<Category[]>([]);
  loading      = signal(true);
  showForm     = signal(false);
  saving       = signal(false);
  formError    = signal('');
  editTarget   = signal<Product | null>(null);
  deleteTarget = signal<Product | null>(null);

  filterCategory: number | undefined = undefined;
  filterSearch = '';
  units = PRODUCT_UNITS;

  form: CreateProductRequest = this.emptyForm();

  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  uploading    = signal(false);
  uploadError  = signal('');

  onImagePicked(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.uploading.set(true);
    this.uploadError.set('');
    this.upload.upload(file).subscribe({
      next: url  => { this.form.imageUrl = url; this.uploading.set(false); },
      error: (e: { error?: { message?: string } }) => {
        this.uploadError.set(e?.error?.message || 'Upload failed.');
        this.uploading.set(false);
      }
    });
  }

  ngOnInit() {
    this.svc.getAllCategories().subscribe(cats => this.categories.set(cats));
    this.load();
  }

  load() {
    this.loading.set(true);
    this.svc.getAllProducts(this.filterCategory, this.filterSearch || undefined).subscribe({
      next: list => { this.products.set(list); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  onSearch() {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.load(), 350);
  }

  openCreate() {
    this.editTarget.set(null);
    this.form = this.emptyForm();
    this.formError.set('');
    this.showForm.set(true);
  }

  openEdit(p: Product) {
    this.editTarget.set(p);
    this.form = {
      categoryId: p.categoryId, name: p.name, slug: p.slug,
      description: p.description, shortDescription: p.shortDescription,
      price: p.price, unit: p.unit, stock: p.stock,
      isAvailable: p.isAvailable, isFeatured: p.isFeatured,
      imageUrl: p.imageUrl, tags: p.tags, displayOrder: p.displayOrder,
      minOrderGrams: p.minOrderGrams, gramStep: p.gramStep, cutFruitPrice: p.cutFruitPrice
    };
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
      this.svc.updateProduct(target.id, this.form).subscribe({ next: done, error: fail });
    } else {
      this.svc.createProduct(this.form).subscribe({ next: done, error: fail });
    }
  }

  toggleAvail(p: Product) {
    this.svc.setProductAvailability(p.id, !p.isAvailable).subscribe({
      next: () => this.load()
    });
  }

  confirmDelete(p: Product) { this.deleteTarget.set(p); }

  doDelete() {
    const t = this.deleteTarget();
    if (!t) return;
    this.saving.set(true);
    this.svc.deleteProduct(t.id).subscribe({
      next: () => { this.saving.set(false); this.deleteTarget.set(null); this.load(); },
      error: (e: { error?: { message?: string } }) => { this.saving.set(false); this.toast.error(e?.error?.message || 'Delete failed.'); }
    });
  }

  private emptyForm(): CreateProductRequest {
    return {
      categoryId: 0, name: '', slug: '', description: '', shortDescription: '',
      price: 0, unit: 'KG', stock: 0, isAvailable: true, isFeatured: false,
      imageUrl: '', tags: '', displayOrder: 0, minOrderGrams: undefined, gramStep: undefined, cutFruitPrice: undefined
    };
  }
}
