import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { HomepageSection } from '../../../../core/models/cms.models';
import { ScrollAnimateDirective } from '../../../../shared/directives/scroll-animate.directive';
import { ProductService } from '../../../../core/services/product.service';
import { ProductSummary } from '../../../../core/models/product.models';
import { ImageUrlService } from '../../../../core/services/image-url.service';
import { CartService } from '../../../../core/services/cart.service';

@Component({
  selector: 'app-product-showcase',
  standalone: true,
  imports: [RouterLink, ScrollAnimateDirective, DecimalPipe],
  templateUrl: './product-showcase.html',
  styleUrl: './product-showcase.scss'
})
export class ProductShowcaseComponent implements OnInit {
  @Input() sectionData: HomepageSection | undefined;

  private productService = inject(ProductService);
  protected imgSvc       = inject(ImageUrlService);
  private cartSvc        = inject(CartService);

  products: ProductSummary[] = [];
  loading = true;

  /** Tracks which product was just added so the button shows a brief ✓ state */
  addedId = signal<number | null>(null);
  private addedTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.productService.getPublicProducts().subscribe({
      next: list => {
        this.products = list.slice(0, 7);
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  addToCart(event: Event, p: ProductSummary): void {
    event.preventDefault();
    event.stopPropagation();

    this.cartSvc.addItem({
      itemType:    'PRODUCT',
      productId:   p.id,
      productName: p.name,
      productSlug: p.slug,
      imageUrl:    p.imageUrl ?? '',
      unitPrice:   p.price,
      quantity:    1,
      unit:        p.unit,
      totalPrice:  p.price,
      isCustomBuild: false,
    });

    // Show ✓ feedback for 1.4 s then reset
    if (this.addedTimer) clearTimeout(this.addedTimer);
    this.addedId.set(p.id);
    this.addedTimer = setTimeout(() => this.addedId.set(null), 1400);
  }

  imageUrl(url: string | undefined): string {
    return this.imgSvc.resolve(url);
  }

  firstTag(tags: string | undefined): string {
    return tags?.split(',')[0]?.trim() ?? '';
  }

  discountPct(p: ProductSummary): number {
    if (!p.mrp || p.mrp <= p.price) return 0;
    return Math.round(((p.mrp - p.price) / p.mrp) * 100);
  }

  savedAmount(p: ProductSummary): number {
    return (!p.mrp || p.mrp <= p.price) ? 0 : Math.max(0, p.mrp - p.price);
  }

  tagColor(tag: string): string {
    const t = tag.toLowerCase();
    if (t.includes('new'))      return 'red';
    if (t.includes('popular') || t.includes('best')) return 'amber';
    if (t.includes('organic'))  return 'green';
    if (t.includes('season'))   return 'green';
    if (t.includes('featured')) return 'blue';
    return 'gray';
  }
}
