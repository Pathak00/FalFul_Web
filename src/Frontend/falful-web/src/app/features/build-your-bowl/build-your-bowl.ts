import { Component, OnInit, signal, computed, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ProductService } from '../../core/services/product.service';
import { OrderService } from '../../core/services/order.service';
import { CartService } from '../../core/services/cart.service';
import { ProductSummary } from '../../core/models/product.models';
import { PriceRule } from '../../core/models/order.models';

interface BowlEntry {
  product: ProductSummary;
  grams: number;
}

@Component({
  selector: 'app-build-your-bowl',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="bowl-page">
      <div class="bowl-hero">
        <h1><i class="bi bi-scissors"></i> Build Your Fruit Bowl</h1>
        <p>Choose your fruits, set the weight in grams, and we'll create a custom fruit bowl just for you.</p>
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
          } @else if (available().length === 0) {
            <div class="no-cut-fruits">
              <i class="bi bi-scissors"></i>
              <p>No cut-fruit products are configured yet.</p>
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
                    @if (p.cutFruitPrice && p.minOrderGrams) {
                      <span class="fruit-price">Rs. {{ p.cutFruitPrice }}/{{ p.minOrderGrams }}g</span>
                    } @else {
                      <span class="fruit-price">Rs. {{ p.price }}/{{ p.unit }}</span>
                    }
                    <span class="fruit-min">
                      Min {{ effectiveMin(p) }}g · step {{ p.gramStep ?? cutFruitGramStep() }}g
                    </span>
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
                    <button (click)="decreaseGrams(entry)"
                            [disabled]="entry.grams <= entryMin(entry)">
                      <i class="bi bi-dash"></i>
                    </button>
                    <div class="weight-display">
                      <span class="weight-val">{{ entry.grams }}g</span>
                      <span class="weight-min">min {{ entryMin(entry) }}g</span>
                    </div>
                    <button (click)="increaseGrams(entry)"><i class="bi bi-plus"></i></button>
                  </div>
                  <span class="entry-price">Rs. {{ entryPrice(entry) | number:'1.0-0' }}</span>
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

          @if (addedSuccess()) {
            <div class="added-success">
              <i class="bi bi-check-circle-fill"></i> Bowl added to cart!
            </div>
          }

          <!-- Bowls in Cart -->
          @if (bowlsInCart().length > 0) {
            <div class="bowls-in-cart">
              <div class="bic-header">
                <span>Bowls in Cart</span>
                <span class="bic-count">{{ bowlsInCart().length }}</span>
              </div>
              <div class="bic-list">
                @for (entry of bowlsInCart(); track entry.index) {
                  <div class="bic-row">
                    <div class="bic-info">
                      <span class="bic-name">{{ entry.item.productName }}</span>
                      <span class="bic-detail">{{ entry.item.quantity }} × Rs. {{ entry.item.unitPrice | number:'1.0-0' }}</span>
                    </div>
                    <span class="bic-price">Rs. {{ entry.item.totalPrice | number:'1.0-0' }}</span>
                    <button class="bic-remove" (click)="cartSvc.removeItem(entry.index)" title="Remove">
                      <i class="bi bi-trash3"></i>
                    </button>
                  </div>
                }
              </div>
              <a routerLink="/checkout" class="btn-checkout">
                <i class="bi bi-bag-check"></i> Go to Checkout
              </a>
            </div>
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
  readonly cartSvc   = inject(CartService);

  loading   = signal(true);
  available = signal<ProductSummary[]>([]);
  entries   = signal<BowlEntry[]>([]);
  container = signal<'bowl' | 'box'>('bowl');
  addedSuccess = signal(false);

  bowlFee          = signal(0);
  boxFee           = signal(0);
  serviceFeePct    = signal(0);
  cutFruitMinGrams = signal(100);
  cutFruitGramStep = signal(50);

  private addedTimer: ReturnType<typeof setTimeout> | null = null;

  // When the global minimum changes, clamp any existing entries below the new floor.
  private readonly clampEffect = effect(() => {
    const globalMin = this.cutFruitMinGrams();
    this.entries.update(list =>
      list.map(e => {
        const min = Math.max(e.product.minOrderGrams ?? 0, globalMin);
        return e.grams < min ? { ...e, grams: min } : e;
      })
    );
  }, { allowSignalWrites: true });

  fruitsSubtotal = computed(() =>
    this.entries().reduce((s, e) => s + this.entryPrice(e), 0)
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

  bowlsInCart = computed(() =>
    this.cartSvc.items()
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => item.itemType === 'BUILD_BOWL')
  );

  // ── Helpers ────────────────────────────────────────────────────────────────

  entryPrice(e: BowlEntry): number {
    const min = e.product.minOrderGrams;
    const cutPrice = e.product.cutFruitPrice;
    if (cutPrice && min) return (e.grams / min) * cutPrice;
    if (cutPrice)        return (e.grams / 1000) * cutPrice;
    return (e.grams / 1000) * e.product.price;
  }

  entryStep(e: BowlEntry): number {
    return e.product.gramStep ?? this.cutFruitGramStep();
  }

  entryMin(e: BowlEntry): number {
    return Math.max(e.product.minOrderGrams ?? 0, this.cutFruitMinGrams());
  }

  effectiveMin(p: ProductSummary): number {
    return Math.max(p.minOrderGrams ?? 0, this.cutFruitMinGrams());
  }

  private bowlSig(entries: BowlEntry[], cont: 'bowl' | 'box'): string {
    const parts = [...entries]
      .sort((a, b) => a.product.id - b.product.id)
      .map(e => `${e.product.id}:${e.grams}`)
      .join(',');
    return `${cont}|${parts}`;
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  ngOnInit() {
    forkJoin({
      products: this.productSvc.getPublicProducts(undefined, undefined, false),
      rules:    this.orderSvc.getPriceRules(),
    }).subscribe({
      next: ({ products, rules }) => {
        const map: Record<string, PriceRule> = {};
        rules.forEach(r => { if (r.isActive) map[r.ruleKey] = r; });
        this.bowlFee.set(map['bowl_container_fee']?.value         ?? 0);
        this.boxFee.set(map['box_container_fee']?.value           ?? 0);
        this.serviceFeePct.set(map['service_fee_percent']?.value  ?? 0);
        this.cutFruitMinGrams.set(map['cut_fruit_min_grams']?.value ?? 100);
        this.cutFruitGramStep.set(map['cut_fruit_gram_step']?.value ?? 50);
        // Only show products configured for cut-fruit (minOrderGrams > 0)
        this.available.set(products.filter(p => p.isAvailable && !!p.minOrderGrams));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  // ── Interaction ────────────────────────────────────────────────────────────

  isAdded(id: number): boolean {
    return this.entries().some(e => e.product.id === id);
  }

  toggleFruit(p: ProductSummary): void {
    if (this.isAdded(p.id)) {
      this.removeEntry(p.id);
    } else {
      const initialGrams = this.effectiveMin(p);
      this.entries.update(list => [...list, { product: p, grams: initialGrams }]);
    }
  }

  increaseGrams(entry: BowlEntry): void {
    const step = this.entryStep(entry);
    this.entries.update(list => list.map(e =>
      e.product.id === entry.product.id ? { ...e, grams: e.grams + step } : e
    ));
  }

  decreaseGrams(entry: BowlEntry): void {
    const step = this.entryStep(entry);
    const min  = this.entryMin(entry);
    this.entries.update(list => list.map(e =>
      e.product.id === entry.product.id
        ? { ...e, grams: Math.max(min, e.grams - step) }
        : e
    ));
  }

  removeEntry(id: number): void {
    this.entries.update(list => list.filter(e => e.product.id !== id));
  }

  addToCart(): void {
    const cont = this.container();
    const currentEntries = this.entries();
    const sig  = this.bowlSig(currentEntries, cont);

    const details = {
      container:    cont,
      totalGrams:   currentEntries.reduce((s, e) => s + e.grams, 0),
      containerFee: this.containerFee(),
      serviceFee:   this.serviceFeeAmt(),
      fruits: currentEntries.map(e => ({
        productId: e.product.id,
        name:      e.product.name,
        grams:     e.grams,
        price:     Math.round(this.entryPrice(e) * 100) / 100,
      }))
    };

    this.cartSvc.addItem({
      itemType:           'BUILD_BOWL',
      productName:        `Custom Fruit ${cont === 'bowl' ? 'Bowl' : 'Box'}`,
      unitPrice:          this.bowlTotal(),
      quantity:           1,
      unit:               cont === 'bowl' ? 'Bowl' : 'Box',
      totalPrice:         this.bowlTotal(),
      isCustomBuild:      true,
      customBuildDetails: JSON.stringify(details),
      bowlSignature:      sig,
    });

    this.entries.set([]);
    this.addedSuccess.set(true);
    if (this.addedTimer) clearTimeout(this.addedTimer);
    this.addedTimer = setTimeout(() => this.addedSuccess.set(false), 3000);
  }
}
