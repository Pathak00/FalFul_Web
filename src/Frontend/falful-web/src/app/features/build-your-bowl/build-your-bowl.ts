import { Component, OnInit, signal, computed, inject, effect, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ProductService } from '../../core/services/product.service';
import { OrderService } from '../../core/services/order.service';
import { CartService } from '../../core/services/cart.service';
import { ImageUrlService } from '../../core/services/image-url.service';
import { ProductSummary } from '../../core/models/product.models';
import { PriceRule } from '../../core/models/order.models';

interface BowlEntry {
  product: ProductSummary;
  grams: number;
}

interface Particle {
  id: number;
  sx: number;
  sy: number;
  tx: string;
  ty: string;
}

@Component({
  selector: 'app-build-your-bowl',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './build-your-bowl.html',
  styleUrl: './build-your-bowl.scss'
})
export class BuildYourBowlComponent implements OnInit {
  @ViewChild('bowlPanel') bowlPanelRef?: ElementRef<HTMLElement>;

  private productSvc = inject(ProductService);
  private orderSvc   = inject(OrderService);
  readonly cartSvc   = inject(CartService);
  protected imgSvc   = inject(ImageUrlService);

  loading      = signal(true);
  available    = signal<ProductSummary[]>([]);
  entries      = signal<BowlEntry[]>([]);
  container    = signal<'bowl' | 'box'>('bowl');
  addedSuccess = signal(false);

  bowlFee          = signal(0);
  boxFee           = signal(0);
  serviceFeePct    = signal(0);
  cutFruitMinGrams = signal(100);
  cutFruitGramStep = signal(50);

  bowlQty      = signal(1);

  particles    = signal<Particle[]>([]);
  poppingIds   = signal<number[]>([]);
  gramFlashIds = signal<number[]>([]);
  bowlPulsing  = signal(false);
  cartPopping  = signal(false);

  private addedTimer: ReturnType<typeof setTimeout> | null = null;

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

  isPopping(id: number): boolean {
    return this.poppingIds().includes(id);
  }

  isFlashingGram(id: number): boolean {
    return this.gramFlashIds().includes(id);
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

  toggleFruit(p: ProductSummary, event: MouseEvent): void {
    if (this.isAdded(p.id)) {
      this.removeEntry(p.id);
    } else {
      this.spawnParticle(event, p.id);
      const initialGrams = this.effectiveMin(p);
      this.entries.update(list => [...list, { product: p, grams: initialGrams }]);
    }
  }

  private spawnParticle(event: MouseEvent, productId: number): void {
    const pr = this.bowlPanelRef?.nativeElement.getBoundingClientRect();
    const dx = pr ? (pr.left + pr.width / 2) - event.clientX : -180;
    const dy = pr ? (pr.top  + 72)           - event.clientY : 120;

    const id = (Date.now() + Math.random() * 1000) | 0;
    this.particles.update(ps => [
      ...ps,
      { id, sx: event.clientX - 14, sy: event.clientY - 14, tx: `${dx}px`, ty: `${dy}px` }
    ]);
    setTimeout(() => this.particles.update(ps => ps.filter(p => p.id !== id)), 850);

    this.poppingIds.update(ids => [...ids, productId]);
    setTimeout(() => this.poppingIds.update(ids => ids.filter(i => i !== productId)), 420);
  }

  increaseGrams(entry: BowlEntry): void {
    const step = this.entryStep(entry);
    this.entries.update(list => list.map(e =>
      e.product.id === entry.product.id ? { ...e, grams: e.grams + step } : e
    ));
    this.flashGram(entry.product.id);
  }

  decreaseGrams(entry: BowlEntry): void {
    const step = this.entryStep(entry);
    const min  = this.entryMin(entry);
    this.entries.update(list => list.map(e =>
      e.product.id === entry.product.id
        ? { ...e, grams: Math.max(min, e.grams - step) }
        : e
    ));
    this.flashGram(entry.product.id);
  }

  private flashGram(id: number): void {
    this.gramFlashIds.update(ids => [...ids, id]);
    setTimeout(() => this.gramFlashIds.update(ids => ids.filter(i => i !== id)), 320);
  }

  increaseBowlQty(): void { this.bowlQty.update(q => Math.min(q + 1, 20)); }
  decreaseBowlQty(): void { this.bowlQty.update(q => Math.max(1, q - 1)); }

  removeEntry(id: number): void {
    this.entries.update(list => list.filter(e => e.product.id !== id));
  }

  addToCart(): void {
    const cont           = this.container();
    const currentEntries = this.entries();
    const sig            = this.bowlSig(currentEntries, cont);

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

    const qty = this.bowlQty();
    this.cartSvc.addItem({
      itemType:           'BUILD_BOWL',
      productName:        `Custom Fruit ${cont === 'bowl' ? 'Bowl' : 'Box'}`,
      unitPrice:          this.bowlTotal(),
      quantity:           qty,
      unit:               cont === 'bowl' ? 'Bowl' : 'Box',
      totalPrice:         this.bowlTotal() * qty,
      isCustomBuild:      true,
      customBuildDetails: JSON.stringify(details),
      bowlSignature:      sig,
    });
    this.bowlQty.set(1);

    this.cartPopping.set(true);
    this.bowlPulsing.set(true);
    setTimeout(() => this.cartPopping.set(false), 400);
    setTimeout(() => this.bowlPulsing.set(false), 650);

    this.entries.set([]);
    this.addedSuccess.set(true);
    if (this.addedTimer) clearTimeout(this.addedTimer);
    this.addedTimer = setTimeout(() => this.addedSuccess.set(false), 3000);
  }
}
