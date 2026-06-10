import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { ProductService } from '../../../core/services/product.service';
import { CartService } from '../../../core/services/cart.service';
import { ImageUrlService } from '../../../core/services/image-url.service';
import { Product } from '../../../core/models/product.models';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  styleUrl: './product-detail.scss',
  templateUrl: './product-detail.html'
})
export class ProductDetailComponent implements OnInit {
  private svc    = inject(ProductService);
  private cart   = inject(CartService);
  private route  = inject(ActivatedRoute);
  protected imgSvc = inject(ImageUrlService);

  product     = signal<Product | null>(null);
  loading     = signal(true);
  addedMsg    = signal(false);
  btnPressing = signal(false);
  qty         = 1;
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
    this.btnPressing.set(true);
    setTimeout(() => this.btnPressing.set(false), 280);
    this.addedMsg.set(true);
    if (this.msgTimer) clearTimeout(this.msgTimer);
    this.msgTimer = setTimeout(() => this.addedMsg.set(false), 2000);
  }

  hasDiscount(): boolean {
    const p = this.product();
    return !!p?.mrp && p.mrp > p.price;
  }

  discountPct(): number {
    const p = this.product();
    if (!p?.mrp || p.mrp <= p.price) return 0;
    return Math.round(((p.mrp - p.price) / p.mrp) * 100);
  }

  savedAmount(): number {
    const p = this.product();
    if (!p?.mrp) return 0;
    return Math.max(0, p.mrp - p.price);
  }

  tagList(): string[] {
    return (this.product()?.tags ?? '').split(',').map(t => t.trim()).filter(Boolean);
  }
}
