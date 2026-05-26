import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../../core/services/product.service';
import { Product } from '../../../core/models/product.models';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  styleUrl: './product-detail.scss',
  template: `
    @if (loading()) {
      <div class="detail-loading">
        <div class="skeleton-img"></div>
        <div class="skeleton-body">
          <div class="skeleton-line wide"></div>
          <div class="skeleton-line medium"></div>
          <div class="skeleton-line short"></div>
        </div>
      </div>
    } @else if (!product()) {
      <div class="not-found">
        <i class="bi bi-exclamation-circle"></i>
        <h2>Product Not Found</h2>
        <p>The product you are looking for does not exist.</p>
        <a routerLink="/products" class="back-link"><i class="bi bi-arrow-left"></i> Back to Products</a>
      </div>
    } @else {
      <div class="detail-page">
        <!-- Breadcrumb -->
        <nav class="breadcrumb">
          <a routerLink="/">Home</a>
          <i class="bi bi-chevron-right"></i>
          <a routerLink="/products">Products</a>
          <i class="bi bi-chevron-right"></i>
          <span>{{ product()!.name }}</span>
        </nav>

        <div class="detail-layout">
          <!-- Image Panel -->
          <div class="detail-image-panel">
            <div class="main-image">
              @if (product()!.imageUrl) {
                <img [src]="product()!.imageUrl" [alt]="product()!.name" />
              } @else {
                <div class="image-placeholder">
                  <i class="bi bi-image"></i>
                </div>
              }
            </div>
            @if (product()!.isFeatured) {
              <div class="featured-ribbon"><i class="bi bi-star-fill"></i> Featured Product</div>
            }
          </div>

          <!-- Info Panel -->
          <div class="detail-info-panel">
            <span class="detail-category">{{ product()!.categoryName }}</span>
            <h1 class="detail-name">{{ product()!.name }}</h1>

            @if (product()!.shortDescription) {
              <p class="detail-short-desc">{{ product()!.shortDescription }}</p>
            }

            <div class="detail-price-row">
              <span class="detail-price">Rs. {{ product()!.price | number:'1.0-0' }}</span>
              <span class="detail-unit">per {{ product()!.unit }}</span>
            </div>

            <div class="detail-avail" [class.unavailable]="!product()!.isAvailable">
              @if (product()!.isAvailable) {
                <i class="bi bi-check-circle-fill"></i> In Stock ({{ product()!.stock | number:'1.0-1' }} {{ product()!.unit }} available)
              } @else {
                <i class="bi bi-x-circle-fill"></i> Out of Stock
              }
            </div>

            <!-- Quantity + Order (Phase 5) -->
            <div class="detail-order-row">
              <div class="qty-control">
                <button (click)="decQty()"><i class="bi bi-dash"></i></button>
                <span class="qty-val">{{ qty }}</span>
                <button (click)="incQty()"><i class="bi bi-plus"></i></button>
              </div>
              <button class="btn-add-cart" [disabled]="!product()!.isAvailable">
                <i class="bi bi-cart-plus"></i>
                Add to Cart
              </button>
            </div>
            <p class="coming-soon-note">
              <i class="bi bi-info-circle"></i>
              Cart & ordering coming in Phase 5.
            </p>

            @if (product()!.description) {
              <div class="detail-description">
                <h3>About this product</h3>
                <p>{{ product()!.description }}</p>
              </div>
            }

            @if (product()!.tags) {
              <div class="detail-tags">
                @for (tag of tagList(); track tag) {
                  <span class="tag-chip">{{ tag }}</span>
                }
              </div>
            }
          </div>
        </div>

        <div class="back-row">
          <a routerLink="/products" class="back-link"><i class="bi bi-arrow-left"></i> Back to Products</a>
        </div>
      </div>
    }
  `
})
export class ProductDetailComponent implements OnInit {
  product = signal<Product | null>(null);
  loading = signal(true);
  qty = 1;

  constructor(
    private svc: ProductService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const slug = params.get('slug')!;
      this.loading.set(true);
      this.svc.getProductBySlug(slug).subscribe({
        next: p  => { this.product.set(p); this.loading.set(false); },
        error: () => { this.product.set(null); this.loading.set(false); }
      });
    });
  }

  incQty() { if (this.qty < 99) this.qty++; }
  decQty() { if (this.qty > 1)  this.qty--; }

  tagList(): string[] {
    return (this.product()?.tags ?? '').split(',').map(t => t.trim()).filter(Boolean);
  }
}
