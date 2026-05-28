import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { OrderService } from '../../core/services/order.service';
import { AuthService } from '../../core/services/auth.service';
import {
  Address, CheckoutConfig, PriceRule, PlaceOrderRequest, PAYMENT_METHODS
} from '../../core/models/order.models';

// ── Nepal time helpers ────────────────────────────────────────────────────────

const NEPAL_OFFSET_MS = (5 * 60 + 45) * 60 * 1000; // UTC+05:45

function nepalNow(): Date {
  const utcMs = Date.now() + new Date().getTimezoneOffset() * 60_000;
  return new Date(utcMs + NEPAL_OFFSET_MS);
}

function nepalDateString(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ── Slot helpers ──────────────────────────────────────────────────────────────

interface TimeSlot {
  label: string;
  startMinutes: number; // minutes from midnight
}

function formatSlotHour(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const ampm = h < 12 ? 'AM' : 'PM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return m === 0 ? `${h12}:00 ${ampm}` : `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

function generateAllSlots(startHour: number, endHour: number, intervalMinutes: number): TimeSlot[] {
  const slots: TimeSlot[] = [];
  let cur = startHour * 60;
  while (cur + intervalMinutes <= endHour * 60) {
    const end = cur + intervalMinutes;
    slots.push({ label: `${formatSlotHour(cur)} – ${formatSlotHour(end)}`, startMinutes: cur });
    cur = end;
  }
  return slots;
}

// ── Haversine ─────────────────────────────────────────────────────────────────

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const toRad = (d: number) => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Component ─────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="checkout-page">
      <div class="co-header">
        <a routerLink="/products" class="back-link"><i class="bi bi-arrow-left"></i> Continue Shopping</a>
        <h2>Checkout</h2>
      </div>

      @if (cart.items().length === 0) {
        <div class="empty-checkout">
          <i class="bi bi-cart-x"></i>
          <p>Your cart is empty.</p>
          <a routerLink="/products" class="btn-shop">Browse Products</a>
        </div>
      } @else {
        <div class="co-layout">
          <!-- Left: Details -->
          <div class="co-form">

            <!-- Delivery Address -->
            <section class="co-section">
              <h3><i class="bi bi-geo-alt"></i> Delivery Address</h3>

              @if (!isAuthenticated()) {
                <div class="login-prompt">
                  <i class="bi bi-person-lock"></i>
                  <p>Please <a routerLink="/auth/login">login</a> to save and use your addresses.</p>
                </div>
              }

              @if (addresses().length > 0) {
                <div class="saved-addresses">
                  @for (addr of addresses(); track addr.id) {
                    <label class="addr-card" [class.selected]="selectedAddressId() === addr.id">
                      <input type="radio" name="address" [value]="addr.id" [(ngModel)]="selectedAddrId" (change)="onAddressSelect(addr)" />
                      <div class="addr-info">
                        <span class="addr-label"><i class="bi bi-house-door"></i> {{ addr.label }}</span>
                        <span class="addr-full">{{ addr.fullAddress }}, {{ addr.city }}</span>
                        @if (addr.landmark) { <span class="addr-land">{{ addr.landmark }}</span> }
                        <span class="addr-phone"><i class="bi bi-telephone"></i> {{ addr.phoneNumber }}</span>
                      </div>
                    </label>
                  }
                </div>
                <button class="btn-new-addr" (click)="useManual.set(!useManual())">
                  <i class="bi bi-plus-circle"></i>
                  {{ useManual() ? 'Use saved address' : 'Enter different address' }}
                </button>
              }

              @if (addresses().length === 0 || useManual()) {
                <div class="addr-form">
                  <div class="form-row">
                    <div class="form-group">
                      <label>Full Address *</label>
                      <input type="text" [(ngModel)]="form.fullAddress" placeholder="Street, area..." />
                    </div>
                    <div class="form-group">
                      <label>City *</label>
                      <input type="text" [(ngModel)]="form.city" placeholder="Kathmandu" />
                    </div>
                  </div>
                  <div class="form-row">
                    <div class="form-group">
                      <label>Phone Number *</label>
                      <input type="tel" [(ngModel)]="form.deliveryPhone" placeholder="98XXXXXXXX" />
                    </div>
                    <div class="form-group">
                      <label>Landmark</label>
                      <input type="text" [(ngModel)]="form.landmark" placeholder="Near temple..." />
                    </div>
                  </div>
                </div>
              }
            </section>

            <!-- Delivery Schedule -->
            <section class="co-section">
              <h3><i class="bi bi-calendar-event"></i> Delivery Schedule
                <span class="tz-tag">Nepal Time</span>
              </h3>

              @if (configLoading()) {
                <div class="slot-loading"><div class="spinner"></div> Loading available slots…</div>
              } @else {
                <div class="form-row">
                  <div class="form-group">
                    <label>Delivery Date *</label>
                    <input type="date" [(ngModel)]="form.deliveryDate"
                           [min]="minDate"
                           (ngModelChange)="onDateChange()" />
                  </div>
                  <div class="form-group">
                    <label>Time Slot *</label>
                    @if (availableSlots().length === 0 && form.deliveryDate) {
                      <div class="no-slots">
                        <i class="bi bi-clock-history"></i>
                        No slots available for today — please select a future date.
                      </div>
                    } @else {
                      <select [(ngModel)]="form.deliveryTimeSlot">
                        <option value="">Select time…</option>
                        @for (slot of availableSlots(); track slot.label) {
                          <option [value]="slot.label">{{ slot.label }}</option>
                        }
                      </select>
                    }
                  </div>
                </div>

                @if (hasCutFruits() && checkoutConfig()) {
                  <div class="lead-time-note">
                    <i class="bi bi-info-circle"></i>
                    Cut-fruit orders require at least <strong>{{ checkoutConfig()!.cutFruitLeadTimeHours }}h</strong> lead time.
                    Regular orders require <strong>{{ checkoutConfig()!.leadTimeHours }}h</strong>.
                    Slots reflect current Nepal time.
                  </div>
                }
              }
            </section>

            <!-- Location (required for cut-fruit orders) -->
            @if (hasCutFruits() && checkoutConfig() && checkoutConfig()!.cutFruitRadiusKm > 0) {
              <section class="co-section co-section-location">
                <h3><i class="bi bi-geo"></i> Delivery Location
                  <span class="required-tag">Required for Cut Fruits</span>
                </h3>
                <p class="location-desc">
                  Cut-fruit delivery is available within
                  <strong>{{ checkoutConfig()!.cutFruitRadiusKm }} km</strong> of our store.
                  We need your location to verify eligibility.
                </p>

                @if (locationStatus() === 'idle' || locationStatus() === 'denied' || locationStatus() === 'unsupported') {
                  <button class="btn-locate" (click)="detectLocation()" [disabled]="locationStatus() === 'unsupported'">
                    <i class="bi bi-crosshair2"></i>
                    {{ locationStatus() === 'denied' ? 'Retry — allow location in browser' :
                       locationStatus() === 'unsupported' ? 'Geolocation not supported' :
                       'Detect My Location' }}
                  </button>
                  @if (locationStatus() === 'denied') {
                    <p class="loc-error">Location access was denied. Please allow it in your browser settings and try again.</p>
                  }
                }

                @if (locationStatus() === 'loading') {
                  <div class="loc-loading"><div class="spinner"></div> Detecting location…</div>
                }

                @if (locationStatus() === 'granted' && distanceKm() !== null) {
                  @if (isOutsideRadius()) {
                    <div class="loc-outside">
                      <i class="bi bi-x-circle-fill"></i>
                      <div>
                        <strong>Outside delivery area</strong>
                        <p>
                          Your location is approximately <strong>{{ distanceKm()! | number:'1.1-1' }} km</strong> away.
                          Cut-fruit delivery is available within {{ checkoutConfig()!.cutFruitRadiusKm }} km only.
                          You can remove cut-fruit items from your cart to continue.
                        </p>
                      </div>
                    </div>
                  } @else {
                    <div class="loc-inside">
                      <i class="bi bi-check-circle-fill"></i>
                      <div>
                        <strong>Within delivery area</strong>
                        <p>Your location ({{ distanceKm()! | number:'1.1-1' }} km away) is within our cut-fruit delivery zone.</p>
                      </div>
                    </div>
                  }
                  <button class="btn-relocate" (click)="resetLocation()">
                    <i class="bi bi-arrow-clockwise"></i> Re-detect location
                  </button>
                }
              </section>
            }

            <!-- Payment -->
            <section class="co-section">
              <h3><i class="bi bi-credit-card"></i> Payment Method</h3>
              <div class="payment-options">
                @for (pm of paymentMethods; track pm.value) {
                  <label class="payment-card" [class.selected]="form.paymentMethod === pm.value">
                    <input type="radio" name="payment" [value]="pm.value" [(ngModel)]="form.paymentMethod" />
                    <i class="bi {{ pm.icon }}"></i>
                    <span>{{ pm.label }}</span>
                    @if (pm.value !== 1) {
                      <span class="soon-tag">Soon</span>
                    }
                  </label>
                }
              </div>
            </section>

            <!-- Notes -->
            <section class="co-section">
              <h3><i class="bi bi-chat-text"></i> Order Notes (optional)</h3>
              <textarea [(ngModel)]="form.notes" rows="2" placeholder="Special instructions..."></textarea>
            </section>
          </div>

          <!-- Right: Summary -->
          <div class="co-summary">
            <h3>Order Summary</h3>
            <div class="summary-items">
              @for (item of cart.items(); track $index) {
                <div class="summary-item">
                  <span class="si-name">{{ item.productName }}
                    @if (item.isCustomBuild) { <span class="custom-tag">Custom</span> }
                  </span>
                  <span class="si-qty">{{ item.quantity | number:'1.0-2' }} {{ item.unit }}</span>
                  <span class="si-price">Rs. {{ item.totalPrice | number:'1.0-0' }}</span>
                </div>
              }
            </div>

            <div class="summary-totals">
              <div class="st-row">
                <span>Subtotal</span>
                <span>Rs. {{ cart.subTotal() | number:'1.0-0' }}</span>
              </div>
              <div class="st-row">
                <span>Delivery Fee</span>
                <span>Rs. {{ effectiveDeliveryFee() | number:'1.0-0' }}</span>
              </div>
              @if (serviceFeePct() > 0) {
                <div class="st-row">
                  <span>Service Fee ({{ serviceFeePct() }}%)</span>
                  <span>Rs. {{ serviceFeeAmt() | number:'1.0-0' }}</span>
                </div>
              }
              <div class="st-row total">
                <span>Total</span>
                <span>Rs. {{ totalAmount() | number:'1.0-0' }}</span>
              </div>
            </div>

            @if (error()) {
              <div class="co-error"><i class="bi bi-exclamation-circle"></i> {{ error() }}</div>
            }

            <button class="btn-place-order" (click)="placeOrder()" [disabled]="placing() || !canPlaceOrder()">
              @if (placing()) { <span class="spinner"></span> Processing... }
              @else { <i class="bi bi-bag-check"></i> Place Order }
            </button>

            @if (!canPlaceOrder() && !placing()) {
              @if (isOutsideRadius()) {
                <p class="co-block-reason">
                  <i class="bi bi-geo-alt-fill"></i>
                  Cut-fruit delivery is currently available only within our nearby delivery area.
                </p>
              } @else if (hasCutFruits() && locationStatus() !== 'granted' && checkoutConfig()!.cutFruitRadiusKm > 0) {
                <p class="co-block-reason">
                  <i class="bi bi-crosshair2"></i>
                  Please verify your location to order cut fruits.
                </p>
              }
            }

            @if (cancelPolicy()) {
              <p class="co-cancel-policy"><i class="bi bi-info-circle"></i> {{ cancelPolicy() }}</p>
            }
          </div>
        </div>
      }
    </div>
  `,
  styleUrl: './checkout.scss'
})
export class CheckoutComponent implements OnInit {
  readonly cart       = inject(CartService);
  private orderSvc    = inject(OrderService);
  private authSvc     = inject(AuthService);
  private router      = inject(Router);

  readonly isAuthenticated = this.authSvc.isAuthenticated;

  addresses         = signal<Address[]>([]);
  selectedAddressId = signal<number | null>(null);
  selectedAddrId    = 0;
  useManual         = signal(false);
  placing           = signal(false);
  error             = signal('');
  cancelPolicy      = signal('');
  configLoading     = signal(true);
  checkoutConfig    = signal<CheckoutConfig | null>(null);

  deliveryFee   = signal(0);
  serviceFeePct = signal(0);
  minOrderAmt   = signal(0);
  freeAbove     = signal(0);

  // ── Geolocation ───────────────────────────────────────────────────────────
  locationStatus = signal<'idle' | 'loading' | 'granted' | 'denied' | 'unsupported'>('idle');
  userLatitude   = signal<number | null>(null);
  userLongitude  = signal<number | null>(null);

  // ── Derived ───────────────────────────────────────────────────────────────
  readonly hasCutFruits = computed(() =>
    this.cart.items().some(i => i.itemType === 'BUILD_BOWL')
  );

  readonly distanceKm = computed(() => {
    const lat = this.userLatitude(), lng = this.userLongitude(), cfg = this.checkoutConfig();
    if (lat == null || lng == null || !cfg) return null;
    return haversineKm(lat, lng, cfg.storeLatitude, cfg.storeLongitude);
  });

  readonly isOutsideRadius = computed(() => {
    const cfg = this.checkoutConfig(), dist = this.distanceKm();
    if (!this.hasCutFruits() || !cfg || cfg.cutFruitRadiusKm <= 0) return false;
    return dist != null && dist > cfg.cutFruitRadiusKm;
  });

  readonly canPlaceOrder = computed(() => {
    const cfg = this.checkoutConfig();
    if (!cfg) return false;
    if (this.isOutsideRadius()) return false;
    if (this.hasCutFruits() && cfg.cutFruitRadiusKm > 0 && this.locationStatus() !== 'granted') return false;
    return true;
  });

  readonly allSlots = computed((): TimeSlot[] => {
    const cfg = this.checkoutConfig();
    if (!cfg) return [];
    return generateAllSlots(cfg.slotStartHour, cfg.slotEndHour, cfg.slotIntervalMinutes);
  });

  readonly availableSlots = computed((): TimeSlot[] => {
    const cfg = this.checkoutConfig();
    const date = this.form.deliveryDate;
    if (!cfg || !date) return this.allSlots();

    const nepal    = nepalNow();
    const todayStr = nepalDateString(nepal);
    if (date !== todayStr) return this.allSlots();

    const leadMins = (this.hasCutFruits() ? cfg.cutFruitLeadTimeHours : cfg.leadTimeHours) * 60;
    const nowMins  = nepal.getHours() * 60 + nepal.getMinutes();
    const earliest = nowMins + leadMins;
    return this.allSlots().filter(s => s.startMinutes >= earliest);
  });

  readonly serviceFeeAmt = computed(() =>
    Math.round(this.cart.subTotal() * this.serviceFeePct() / 100 * 100) / 100
  );
  readonly effectiveDeliveryFee = computed(() =>
    this.freeAbove() > 0 && this.cart.subTotal() >= this.freeAbove() ? 0 : this.deliveryFee()
  );
  readonly totalAmount = computed(() =>
    this.cart.subTotal() + this.effectiveDeliveryFee() + this.serviceFeeAmt()
  );

  form = {
    fullAddress:      '',
    city:             '',
    deliveryPhone:    '',
    landmark:         '',
    deliveryDate:     '',
    deliveryTimeSlot: '',
    paymentMethod:    1,
    notes:            '',
  };

  readonly paymentMethods = [
    { value: 1, label: 'Cash on Delivery', icon: 'bi-cash-stack' },
    { value: 2, label: 'eSewa',            icon: 'bi-phone' },
    { value: 3, label: 'Khalti',           icon: 'bi-phone-fill' },
  ];

  get minDate(): string {
    return nepalDateString(nepalNow());
  }

  ngOnInit() {
    this.orderSvc.getSetting('cancellation_policy_text').subscribe({
      next: s => this.cancelPolicy.set(s.value),
      error: () => {}
    });

    this.orderSvc.getCheckoutConfig().subscribe({
      next: cfg => { this.checkoutConfig.set(cfg); this.configLoading.set(false); },
      error: ()  => this.configLoading.set(false)
    });

    this.orderSvc.getPriceRules().subscribe({
      next: rules => {
        const map: Record<string, PriceRule> = {};
        rules.forEach(r => { if (r.isActive) map[r.ruleKey] = r; });
        this.deliveryFee.set(map['delivery_fee']?.value ?? 0);
        this.serviceFeePct.set(map['service_fee_percent']?.value ?? 0);
        this.minOrderAmt.set(map['min_order_amount']?.value ?? 0);
        this.freeAbove.set(map['free_delivery_above']?.value ?? 0);
      }
    });

    if (this.isAuthenticated()) {
      this.orderSvc.getAddresses().subscribe({
        next: list => {
          this.addresses.set(list);
          const def = list.find(a => a.isDefault) ?? list[0];
          if (def) this.onAddressSelect(def);
        }
      });
    }
  }

  onAddressSelect(addr: Address): void {
    this.selectedAddressId.set(addr.id);
    this.selectedAddrId     = addr.id;
    this.form.fullAddress   = addr.fullAddress;
    this.form.city          = addr.city;
    this.form.deliveryPhone = addr.phoneNumber;
    this.form.landmark      = addr.landmark ?? '';
    this.useManual.set(false);
  }

  onDateChange(): void {
    // Reset slot selection when date changes; let the user pick a valid slot
    const slots = this.availableSlots();
    if (!slots.some(s => s.label === this.form.deliveryTimeSlot)) {
      this.form.deliveryTimeSlot = '';
    }
  }

  detectLocation(): void {
    if (!navigator.geolocation) { this.locationStatus.set('unsupported'); return; }
    this.locationStatus.set('loading');
    navigator.geolocation.getCurrentPosition(
      pos => {
        this.userLatitude.set(pos.coords.latitude);
        this.userLongitude.set(pos.coords.longitude);
        this.locationStatus.set('granted');
      },
      () => this.locationStatus.set('denied'),
      { timeout: 10000, enableHighAccuracy: false }
    );
  }

  resetLocation(): void {
    this.locationStatus.set('idle');
    this.userLatitude.set(null);
    this.userLongitude.set(null);
  }

  placeOrder(): void {
    this.error.set('');
    const sub = this.cart.subTotal();

    if (this.minOrderAmt() > 0 && sub < this.minOrderAmt()) {
      this.error.set(`Minimum order is Rs. ${this.minOrderAmt()}.`);
      return;
    }
    if (!this.form.fullAddress.trim())    { this.error.set('Delivery address is required.'); return; }
    if (!this.form.city.trim())           { this.error.set('City is required.'); return; }
    if (!this.form.deliveryPhone.trim())  { this.error.set('Phone number is required.'); return; }
    if (!this.form.deliveryDate)          { this.error.set('Delivery date is required.'); return; }
    if (!this.form.deliveryTimeSlot)      { this.error.set('Delivery time slot is required.'); return; }

    const cfg = this.checkoutConfig();
    if (this.hasCutFruits() && cfg && cfg.cutFruitRadiusKm > 0) {
      if (this.locationStatus() !== 'granted') {
        this.error.set('Please verify your delivery location for cut-fruit orders.');
        return;
      }
      if (this.isOutsideRadius()) {
        this.error.set(
          `Cut-fruit delivery is only available within ${cfg.cutFruitRadiusKm} km of our store. ` +
          `Your location is approximately ${this.distanceKm()?.toFixed(1)} km away.`
        );
        return;
      }
    }

    const dto: PlaceOrderRequest = {
      deliveryAddressId: this.selectedAddressId() ?? 0,
      fullAddress:       this.form.fullAddress,
      city:              this.form.city,
      deliveryPhone:     this.form.deliveryPhone,
      landmark:          this.form.landmark || undefined,
      deliveryDate:      this.form.deliveryDate,
      deliveryTimeSlot:  this.form.deliveryTimeSlot,
      paymentMethod:     this.form.paymentMethod,
      notes:             this.form.notes || undefined,
      deliveryLatitude:  this.userLatitude() ?? undefined,
      deliveryLongitude: this.userLongitude() ?? undefined,
      items: this.cart.items().map(i => ({
        productId:          i.productId,
        productName:        i.productName,
        productSlug:        i.productSlug,
        imageUrl:           i.imageUrl,
        unitPrice:          i.unitPrice,
        quantity:           i.quantity,
        unit:               i.unit,
        totalPrice:         i.totalPrice,
        isCustomBuild:      i.isCustomBuild,
        customBuildDetails: i.customBuildDetails,
      }))
    };

    this.placing.set(true);
    this.orderSvc.placeOrder(dto).subscribe({
      next: res => {
        this.cart.clearCart();
        this.router.navigate(['/orders'], { queryParams: { placed: res.orderNumber } });
      },
      error: e => {
        this.error.set(e.error?.message ?? 'Failed to place order. Please try again.');
        this.placing.set(false);
      }
    });
  }
}
