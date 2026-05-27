import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { ProductService } from '../../../core/services/product.service';
import { Category, ProductSummary } from '../../../core/models/product.models';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  styleUrl: './product-list.scss',
  template: `
    <div class="products-page">
      <!-- Hero Banner -->
      <section class="products-hero">
        <div class="hero-content">
          <h1>Fresh Fruits <span class="gradient-text">Delivered</span></h1>
          <p>Farm-fresh, hand-picked fruits delivered to your door</p>
          <div class="hero-search">
            <i class="bi bi-search search-icon"></i>
            <input [(ngModel)]="searchTerm" (ngModelChange)="onSearch()" placeholder="Search fruits…" />
          </div>
        </div>
      </section>

      <!-- BYB banner when cut-fruit products exist -->
      @if (hasCutFruits()) {
        <div class="byb-banner">
          <div class="byb-banner-text">
            <i class="bi bi-scissors"></i>
            <span>Want custom cut fruit portions?</span>
          </div>
          <a routerLink="/build-your-bowl" class="byb-banner-link">
            <i class="bi bi-basket2"></i> Build Your Fruit Bowl →
          </a>
        </div>
      }

      <div class="products-layout">
        <!-- Sidebar: Categories -->
        <aside class="category-sidebar">
          <h3 class="sidebar-title">Categories</h3>
          <ul class="category-list">
            <li>
              <button class="cat-btn" [class.active]="!selectedCategory" (click)="selectCategory(undefined)">
                <i class="bi bi-grid-fill"></i> All Products
                <span class="cat-count">{{ totalCount() }}</span>
              </button>
            </li>
            @for (cat of categories(); track cat.id) {
              <li>
                <button class="cat-btn" [class.active]="selectedCategory === cat.id" (click)="selectCategory(cat.id)">
                  @if (cat.icon?.startsWith('bi-')) {
                    <i class="bi {{ cat.icon }}"></i>
                  } @else {
                    <i class="bi bi-tag-fill"></i>
                  }
                  {{ cat.name }}
                </button>
              </li>
            }
          </ul>
        </aside>

        <!-- Main: Products Grid -->
        <main class="products-main">
          <!-- Sort & count bar -->
          <div class="products-toolbar">
            <span class="result-count">
              {{ products().length }} product{{ products().length !== 1 ? 's' : '' }}
              @if (selectedCategory) { in <strong>{{ activeCategoryName() }}</strong> }
            </span>
            <label class="featured-toggle">
              <input type="checkbox" [(ngModel)]="featuredOnly" (ngModelChange)="load()" />
              <span>Featured only</span>
            </label>
          </div>

          @if (loading()) {
            <div class="products-loading">
              <div class="skeleton-grid">
                @for (_ of [1,2,3,4,5,6]; track $index) {
                  <div class="product-skeleton"></div>
                }
              </div>
            </div>
          } @else if (products().length === 0) {
            <div class="no-products">
              <i class="bi bi-basket2"></i>
              <h3>No products found</h3>
              <p>Try a different category or search term.</p>
            </div>
          } @else {
            <div class="products-grid">
              @for (p of products(); track p.id) {
                <a class="product-card" [routerLink]="['/products', p.slug]">
                  <div class="card-image">
                    @if (p.imageUrl) {
                      <img [src]="p.imageUrl" [alt]="p.name" />
                    } @else {
                      <div class="card-image-placeholder">
                        <i class="bi bi-image"></i>
                      </div>
                    }
                    @if (p.isFeatured) {
                      <span class="featured-tag"><i class="bi bi-star-fill"></i> Featured</span>
                    }
                    @if (!p.isAvailable) {
                      <div class="out-of-stock-overlay">Out of Stock</div>
                    }
                  </div>
                  <div class="card-body">
                    <span class="card-category">{{ p.categoryName }}</span>
                    <h3 class="card-name">{{ p.name }}</h3>
                    @if (p.shortDescription) {
                      <p class="card-desc">{{ p.shortDescription }}</p>
                    }
                    <div class="card-footer">
                      <div class="card-price">
                        <span class="price-amount">Rs. {{ p.price | number:'1.0-0' }}</span>
                        <span class="price-unit">/ {{ p.unit }}</span>
                      </div>
                      <button class="add-btn" [disabled]="!p.isAvailable" (click)="$event.preventDefault()">
                        <i class="bi bi-cart-plus"></i>
                      </button>
                    </div>
                  </div>
                </a>
              }
            </div>
          }
        </main>
      </div>
    </div>
  `
})
export class ProductListComponent implements OnInit {
  products       = signal<ProductSummary[]>([]);
  categories     = signal<Category[]>([]);
  loading        = signal(true);
  totalCount     = signal(0);
  hasCutFruits   = signal(false);
  selectedCategory: number | undefined = undefined;
  searchTerm = '';
  featuredOnly = false;

  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private svc: ProductService, private route: ActivatedRoute) {}

  ngOnInit() {
    this.svc.getActiveCategories().subscribe(cats => this.categories.set(cats));
    this.route.queryParams.subscribe(p => {
      if (p['category']) this.selectedCategory = +p['category'];
      this.load();
    });
  }

  selectCategory(id: number | undefined) {
    this.selectedCategory = id;
    this.load();
  }

  onSearch() {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.load(), 350);
  }

  load() {
    this.loading.set(true);
    this.svc.getPublicProducts(this.selectedCategory, this.searchTerm || undefined, this.featuredOnly).subscribe({
      next: list => {
        // Products with minOrderGrams belong exclusively to Build Your Bowl
        const perKg = list.filter(p => !p.minOrderGrams);
        this.hasCutFruits.set(perKg.length < list.length);
        this.products.set(perKg);
        if (!this.selectedCategory && !this.searchTerm) this.totalCount.set(perKg.length);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  activeCategoryName(): string {
    return this.categories().find(c => c.id === this.selectedCategory)?.name ?? '';
  }
}
