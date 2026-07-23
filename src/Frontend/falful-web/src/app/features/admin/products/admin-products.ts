import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../../core/services/product.service';
import { UploadService } from '../../../core/services/upload.service';
import { ImageUrlService } from '../../../core/services/image-url.service';
import { ToastService } from '../../../core/services/toast.service';
import { Category, Product, CreateProductRequest, PRODUCT_UNITS } from '../../../core/models/product.models';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['../admin-shared.scss', './admin-products.scss'],
  templateUrl: './admin-products.html'
})
export class AdminProductsComponent implements OnInit {
  private svc    = inject(ProductService);
  private upload = inject(UploadService);
  private toast  = inject(ToastService);
  protected imgSvc = inject(ImageUrlService);

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

  // URL uploaded in this form session but not yet committed to the backend.
  // Tracked so we can delete it if the form is cancelled or the save fails.
  private pendingUploadUrl = '';

  // Original image URL of the product being edited.
  // Tracked so we can delete the old file after a successful image replacement.
  private originalImageUrl = '';

  onImagePicked(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    // If a previous upload in this session is being replaced before saving, delete it.
    if (this.pendingUploadUrl) {
      this.upload.deleteUpload(this.pendingUploadUrl);
      this.pendingUploadUrl = '';
    }

    this.uploading.set(true);
    this.uploadError.set('');
    this.upload.upload(file).subscribe({
      next: url => {
        this.pendingUploadUrl = url;
        this.form.imageUrl    = url;
        this.uploading.set(false);
      },
      error: (e: { error?: { message?: string } }) => {
        this.uploadError.set(e?.error?.message || 'Upload failed.');
        this.uploading.set(false);
      }
    });
  }

  removeImage() {
    // Only delete from server if the displayed image is a fresh upload this session.
    if (this.form.imageUrl && this.form.imageUrl === this.pendingUploadUrl) {
      this.upload.deleteUpload(this.pendingUploadUrl);
      this.pendingUploadUrl = '';
    }
    this.form.imageUrl = '';
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
    this.pendingUploadUrl = '';
    this.originalImageUrl = '';
    this.showForm.set(true);
  }

  openEdit(p: Product) {
    this.editTarget.set(p);
    this.originalImageUrl = p.imageUrl ?? '';
    this.pendingUploadUrl = '';
    this.form = {
      categoryId: p.categoryId, name: p.name, slug: p.slug,
      description: p.description, shortDescription: p.shortDescription,
      price: p.price, mrp: p.mrp, unit: p.unit, stock: p.stock,
      isAvailable: p.isAvailable, isFeatured: p.isFeatured,
      imageUrl: p.imageUrl, tags: p.tags, displayOrder: p.displayOrder,
      minOrderGrams: p.minOrderGrams, gramStep: p.gramStep, cutFruitPrice: p.cutFruitPrice,
      showInCatalog: p.showInCatalog ?? true
    };
    this.formError.set('');
    this.showForm.set(true);
  }

  closeForm() {
    // User cancelled — delete any upload that was never saved.
    if (this.pendingUploadUrl) {
      this.upload.deleteUpload(this.pendingUploadUrl);
      this.pendingUploadUrl = '';
    }
    this.showForm.set(false);
  }

  autoSlug() {
    if (!this.editTarget()) {
      this.form.slug = this.form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    }
  }

  submitForm() {
    this.formError.set('');
    const target          = this.editTarget();
    const pendingUrl      = this.pendingUploadUrl;
    const originalUrl     = this.originalImageUrl;
    this.saving.set(true);

    if (target) {
      // ── Update ──────────────────────────────────────────────────────────────
      this.svc.updateProduct(target.id, this.form).subscribe({
        next: () => {
          // Image was replaced — the old file is now unreferenced on the backend
          // (backend also deletes it, but this guards against any edge cases).
          if (originalUrl && originalUrl !== this.form.imageUrl)
            this.upload.deleteUpload(originalUrl);
          this.pendingUploadUrl = '';
          this.saving.set(false);
          this.closeFormAfterSave();
        },
        error: (e: { error?: { message?: string } }) => {
          // Save failed — the freshly uploaded image is now orphaned; clean it up.
          if (pendingUrl) {
            this.upload.deleteUpload(pendingUrl);
            this.form.imageUrl    = originalUrl; // restore previous image in UI
            this.pendingUploadUrl = '';
          }
          this.saving.set(false);
          this.formError.set(e?.error?.message || 'Save failed.');
        }
      });
    } else {
      // ── Create ──────────────────────────────────────────────────────────────
      this.svc.createProduct(this.form).subscribe({
        next: () => {
          this.pendingUploadUrl = ''; // image is now committed
          this.saving.set(false);
          this.closeFormAfterSave();
        },
        error: (e: { error?: { message?: string } }) => {
          // Product was never created — delete the orphaned upload.
          if (pendingUrl) {
            this.upload.deleteUpload(pendingUrl);
            this.form.imageUrl    = '';
            this.pendingUploadUrl = '';
          }
          this.saving.set(false);
          this.formError.set(e?.error?.message || 'Save failed.');
        }
      });
    }
  }

  private closeFormAfterSave() {
    this.showForm.set(false);
    this.load();
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
      price: 0, mrp: undefined, unit: 'KG', stock: 0, isAvailable: true, isFeatured: false,
      imageUrl: '', tags: '', displayOrder: 0, minOrderGrams: undefined, gramStep: undefined,
      cutFruitPrice: undefined, showInCatalog: true
    };
  }
}
