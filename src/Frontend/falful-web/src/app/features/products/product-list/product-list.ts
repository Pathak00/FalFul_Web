import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { ProductService } from '../../../core/services/product.service';
import { ImageUrlService } from '../../../core/services/image-url.service';
import { Category, ProductSummary } from '../../../core/models/product.models';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  styleUrl: './product-list.scss',
  templateUrl: './product-list.html'
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

  protected imgSvc = inject(ImageUrlService);
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
        this.hasCutFruits.set(list.some(p => !!p.minOrderGrams));
        this.products.set(list);
        if (!this.selectedCategory && !this.searchTerm) this.totalCount.set(list.length);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  activeCategoryName(): string {
    return this.categories().find(c => c.id === this.selectedCategory)?.name ?? '';
  }

  hasDiscount(p: ProductSummary): boolean {
    return !!p.mrp && p.mrp > p.price;
  }

  discountPct(p: ProductSummary): number {
    if (!this.hasDiscount(p)) return 0;
    return Math.round(((p.mrp! - p.price) / p.mrp!) * 100);
  }

  savedAmount(p: ProductSummary): number {
    if (!this.hasDiscount(p)) return 0;
    return Math.max(0, p.mrp! - p.price);
  }
}
