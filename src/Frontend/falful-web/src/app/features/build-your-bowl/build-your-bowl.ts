import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { OrderService } from '../../core/services/order.service';
import { CartService } from '../../core/services/cart.service';
import { ProductSummary } from '../../core/models/product.models';
import { PriceRule } from '../../core/models/order.models';

interface BowlEntry {
  product: ProductSummary;
  weight: number;
}

@Component({
  selector: 'app-build-your-bowl',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="bowl-page">
      <div class="bowl-hero">
        <h1><i class="bi bi-scissors"></i> Build Your Fruit Bowl</h1>
        <p>Choose your fruits, set the weight, and we'll create a custom fruit bowl just for you.</p>
      </div>

      <div class="bowl-layout">
        <!-- Left: Fruit Picker -->
        <div class="fruit-picker">
          <h3>Select Fruits</h3>

          @if (loading()) {
            <div class="picker-loading">
              @for (s of [1,2,3,4,5,6]; track s) {
                <div class="fruit-card skeleton"></div>
              }
            </div>
          } @else {
            <div class="fruit-grid">
              @for (p of available(); track p.id) {
                <div class="fruit-card" [class.added]="isAdded(p.id)" (click)="toggleFruit(p)">
                  <div class="fruit-img">
                    @if (p.imageUrl) { <img [src]="p.imageUrl" [alt]="p.name" /> }
                    @else { <div class="no-img"><i class="bi bi-image"></i></div> }
                  </div>
                  <div class="fruit-info">
                    <span class="fruit-name">{{ p.name }}</span>
                    <span class="fruit-price">Rs. {{ p.price }}/{{ p.unit }}</span>
                  </div>
                  <div class="fruit-check"><i class="bi bi-check-circle-fill"></i></div>
                </div>
              }
            </div>
          }
        </div>

        <!-- Right: Build Summary -->
        <div class="bowl-summary">
          <h3>Your Bowl</h3>

          <!-- Container type -->
          <div class="container-select">
            <label>Container Type</label>
            <div class="container-options">
              <button [class.selected]="container() === 'bowl'" (click)="container.set('bowl')">
                <i class="bi bi-basket2"></i> Bowl
                @if (bowlFee() > 0) { <span class="fee-tag">+Rs. {{ bowlFee() }}</span> }
              </button>
              <button [class.selected]="container() === 'box'" (click)="container.set('box')">
                <i class="bi bi-box-seam"></i> Box
                @if (boxFee() > 0) { <span class="fee-tag">+Rs. {{ boxFee() }}</span> }
              </button>
            </div>
          </div>

          <!-- Added fruits + weights -->
          @if (entries().length === 0) {
            <div class="empty-bowl">
              <i class="bi bi-basket2"></i>
              <p>Click fruits on the left to add them</p>
            </div>
          } @else {
            <div class="entries-list">
              @for (entry of entries(); track entry.product.id) {
                <div class="entry-row">
                  <span class="entry-name">{{ entry.product.name }}</span>
                  <div class="weight-control">
                    <button (click)="adjustWeight(entry, -0.25)"><i class="bi bi-dash"></i></button>
                    <span>{{ entry.weight | number:'1.2-2' }} {{ entry.product.unit }}</span>
                    <button (click)="adjustWeight(entry, 0.25)"><i class="bi bi-plus"></i></button>
                  </div>
                  <span class="entry-price">Rs. {{ entry.product.price * entry.weight | number:'1.0-0' }}</span>
                  <button class="remove-entry" (click)="removeEntry(entry.product.id)">
                    <i class="bi bi-x"></i>
                  </button>
                </div>
              }
            </div>
          }

          <!-- Pricing breakdown -->
          <div class="price-breakdown">
            <div class="pb-row">
              <span>Fruits subtotal</span>
              <span>Rs. {{ fruitsSubtotal() | number:'1.0-0' }}</span>
            </div>
            <div class="pb-row">
              <span>Container fee</span>
              <span>Rs. {{ containerFee() | number:'1.0-0' }}</span>
            </div>
            @if (serviceFeePct() > 0) {
              <div class="pb-row">
                <span>Service fee ({{ serviceFeePct() }}%)</span>
                <span>Rs. {{ serviceFeeAmt() | number:'1.0-0' }}</span>
              </div>
            }
            <div class="pb-row total">
              <span>Total</span>
              <span>Rs. {{ bowlTotal() | number:'1.0-0' }}</span>
            </div>
          </div>

          @if (entries().length > 0) {
            <button class="btn-add-bowl" (click)="addToCart()" [disabled]="bowlTotal() <= 0">
              <i class="bi bi-cart-plus"></i> Add Bowl to Cart
            </button>
          }

          <a routerLink="/products" class="btn-browse">
            <i class="bi bi-box-seam"></i> Browse Regular Products
          </a>
        </div>
      </div>
    </div>
  `,
  styleUrl: './build-your-bowl.scss'
})
export class BuildYourBowlComponent implements OnInit {
  private productSvc = inject(ProductService);
  private orderSvc   = inject(OrderService);
  private cartSvc    = inject(CartService);
  private router     = inject(Router);

  loading   = signal(true);
  available = signal<ProductSummary[]>([]);
  entries   = signal<BowlEntry[]>([]);
  container = signal<'bowl' | 'box'>('bowl');

  bowlFee     = signal(0);
  boxFee      = signal(0);
  serviceFeePct = signal(0);

  fruitsSubtotal = computed(() =>
    this.entries().reduce((s, e) => s + e.product.price * e.weight, 0)
  );
  containerFee = computed(() =>
    this.container() === 'bowl' ? this.bowlFee() : this.boxFee()
  );
  serviceFeeAmt = computed(() =>
    Math.round(this.fruitsSubtotal() * this.serviceFeePct() / 100 * 100) / 100
  );
  bowlTotal = computed(() =>
    this.fruitsSubtotal() + this.containerFee() + this.serviceFeeAmt()
  );

  ngOnInit() {
    this.productSvc.getPublicProducts(undefined, undefined, false).subscribe({
      next: list => { this.available.set(list.filter(p => p.isAvailable)); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
    this.orderSvc.getPriceRules().subscribe({
      next: rules => {
        const map: Record<string, PriceRule> = {};
        rules.forEach(r => { if (r.isActive) map[r.ruleKey] = r; });
        this.bowlFee.set(map['bowl_container_fee']?.value ?? 0);
        this.boxFee.set(map['box_container_fee']?.value ?? 0);
        this.serviceFeePct.set(map['service_fee_percent']?.value ?? 0);
      }
    });
  }

  isAdded(id: number): boolean {
    return this.entries().some(e => e.product.id === id);
  }

  toggleFruit(p: ProductSummary): void {
    if (this.isAdded(p.id)) {
      this.removeEntry(p.id);
    } else {
      this.entries.update(list => [...list, { product: p, weight: 0.5 }]);
    }
  }

  adjustWeight(entry: BowlEntry, delta: number): void {
    this.entries.update(list => list.map(e =>
      e.product.id === entry.product.id
        ? { ...e, weight: Math.max(0.25, Math.round((e.weight + delta) * 100) / 100) }
        : e
    ));
  }

  removeEntry(id: number): void {
    this.entries.update(list => list.filter(e => e.product.id !== id));
  }

  addToCart(): void {
    const details = {
      container: this.container(),
      fruits: this.entries().map(e => ({
        productId: e.product.id,
        name: e.product.name,
        weight: e.weight,
        unit: e.product.unit,
        price: e.product.price,
      }))
    };

    this.cartSvc.addItem({
      productName: `Custom Fruit ${this.container() === 'bowl' ? 'Bowl' : 'Box'}`,
      unitPrice:   this.bowlTotal(),
      quantity:    1,
      unit:        'Bowl',
      totalPrice:  this.bowlTotal(),
      isCustomBuild: true,
      customBuildDetails: JSON.stringify(details),
    });

    this.entries.set([]);
    this.router.navigate(['/checkout']);
  }
}
