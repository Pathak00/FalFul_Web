import { Component, Input, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { HomepageSection } from '../../../../core/models/cms.models';
import { ScrollAnimateDirective } from '../../../../shared/directives/scroll-animate.directive';
import { ProductService } from '../../../../core/services/product.service';
import { ProductSummary } from '../../../../core/models/product.models';
import { environment } from '../../../../../environments/environment';

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

  products: ProductSummary[] = [];
  loading = true;

  ngOnInit(): void {
    this.productService.getPublicProducts().subscribe({
      next: list => {
        this.products = list.slice(0, 7);
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  imageUrl(url: string | undefined): string {
    if (!url) return '';
    return url.startsWith('http') ? url : environment.apiUrl + url;
  }

  firstTag(tags: string | undefined): string {
    return tags?.split(',')[0]?.trim() ?? '';
  }

  discountPct(p: ProductSummary): number {
    if (!p.mrp || p.mrp <= p.price) return 0;
    return Math.round(((p.mrp - p.price) / p.mrp) * 100);
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
