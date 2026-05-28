import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { ProductService } from '../../../core/services/product.service';
import { CartService } from '../../../core/services/cart.service';
import { PermissionService } from '../../../core/services/permission.service';
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
                <div class="image-placeholder"><i class="bi bi-image"></i></div>
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

            <!-- Per KG pricing (always) -->
            <div class="detail-price-row">
              <span class="detail-price">Rs. {{ product()!.price | number:'1.0-0' }}</span>
              <span class="detail-unit">per {{ product()!.unit }}</span>
            </div>

            <!-- Cut fruit notice — directs to BYB -->
            @if (product()!.cutFruitPrice && product()!.minOrderGrams) {
              <a routerLink="/build-your-bowl" class="byb-notice">
                <i class="bi bi-scissors"></i>
                Also available as cut fruit — from Rs. {{ product()!.cutFruitPrice | number:'1.0-0' }}
                for {{ product()!.minOrderGrams }}g · <strong>Build Your Bowl →</strong>
              </a>
            }

            <div class="detail-avail" [class.unavailable]="!product()!.isAvailable">
              @if (product()!.isAvailable) {
                <i class="bi bi-check-circle-fill"></i>
                In Stock ({{ product()!.stock | number:'1.0-1' }} {{ product()!.unit }} available)
              } @else {
                <i class="bi bi-x-circle-fill"></i> Out of Stock
              }
            </div>

            <!-- Quantity + Add to Cart -->
            @if (perms.canShop()) {
              <div class="detail-order-row">
                <div class="qty-control">
                  <button (click)="decQty()" [disabled]="qty <= 1">
                    <i class="bi bi-dash"></i>
                  </button>
                  <span class="qty-val">{{ qty }}</span>
                  <button (click)="incQty()"><i class="bi bi-plus"></i></button>
                </div>

                <button class="btn-add-cart" [disabled]="!product()!.isAvailable" (click)="addToCart()">
                  <i class="bi bi-cart-plus"></i> Add to Cart
                </button>
              </div>

              @if (addedMsg()) {
                <p class="added-note"><i class="bi bi-check-circle-fill"></i> Added to cart!</p>
              }
            }

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
  private svc   = inject(ProductService);
  private cart  = inject(CartService);
  private route = inject(ActivatedRoute);
  readonly perms = inject(PermissionService);

  product  = signal<Product | null>(null);
  loading  = signal(true);
  addedMsg = signal(false);
  qty      = 1;
  private msgTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const slug = params.get('slug')!;
      this.loading.set(true);
      this.qty = 1;
      this.svc.getProductBySlug(slug).subscribe({
        next: p  => { this.product.set(p); this.loading.set(false); },
        error: () => { this.product.set(null); this.loading.set(false); }
      });
    });
  }

  incQty() { if (this.qty < 99) this.qty++; }

  decQty() { if (this.qty > 1) this.qty--; }

  addToCart(): void {
    const p = this.product();
    if (!p || !p.isAvailable) return;
    this.cart.addItem({
      itemType:    'PRODUCT',
      productId:   p.id,
      productName: p.name,
      productSlug: p.slug,
      imageUrl:    p.imageUrl,
      unitPrice:   p.price,
      quantity:    this.qty,
      unit:        p.unit,
      totalPrice:  p.price * this.qty,
      isCustomBuild: false,
    });
    this.addedMsg.set(true);
    if (this.msgTimer) clearTimeout(this.msgTimer);
    this.msgTimer = setTimeout(() => this.addedMsg.set(false), 2000);
  }

  tagList(): string[] {
    return (this.product()?.tags ?? '').split(',').map(t => t.trim()).filter(Boolean);
  }
}
