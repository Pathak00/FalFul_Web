import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { OrderService } from '../../core/services/order.service';
import { PaymentService } from '../../core/services/payment.service';
import { AuthService } from '../../core/services/auth.service';
import { PermissionService } from '../../core/services/permission.service';
import {
  Address, CheckoutConfig, PriceRule, PlaceOrderRequest, PAYMENT_METHODS
} from '../../core/models/order.models';
import { PaymentMethodDto, PaymentSettingsDto, InitiatePaymentDto } from '../../core/models/payment.models';

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
                        <span>All delivery slots for this date have passed.</span>
                        <button class="no-slots-btn" type="button" (click)="selectTomorrow()">
                          Schedule for tomorrow
                        </button>
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
              @if (paymentMethodsLoading()) {
                <div style="color:#94a3b8;font-size:.875rem"><i class="bi bi-arrow-repeat spin"></i> Loading methods…</div>
              } @else if (paymentMethods().length === 0) {
                <p style="color:#dc2626;font-size:.875rem">No payment methods available. Please contact support.</p>
              } @else {
                <div class="payment-options">
                  @for (pm of paymentMethods(); track pm.id) {
                    <label class="payment-card" [class.selected]="form.paymentMethodId === pm.id">
                      <input type="radio" name="payment" [value]="pm.id" [(ngModel)]="form.paymentMethodId" (change)="onPaymentMethodChange()" />
                      <i class="bi {{ methodIcon(pm.code) }}"></i>
                      <span>{{ pm.name }}</span>
                      @if (pm.description) {
                        <span class="pm-desc">{{ pm.description }}</span>
                      }
                    </label>
                  }
                </div>

                <!-- Advance method selector: shown when COD selected + advance enabled + order meets threshold -->
                @if (showAdvanceMethodSelector()) {
                  <div class="advance-selector">
                    <p class="advance-note">
                      <i class="bi bi-info-circle"></i>
                      Advance payment required: <strong>Rs. {{ advanceAmount() | number:'1.0-0' }}</strong>
                      ({{ paymentSettings()!.advancePercent }}% of order). Select an online method for the advance:
                    </p>
                    <div class="payment-options" style="margin-top:.5rem">
                      @for (pm of onlinePaymentMethods(); track pm.id) {
                        <label class="payment-card payment-card-sm" [class.selected]="form.advanceMethodId === pm.id">
                          <input type="radio" name="advance-payment" [value]="pm.id" [(ngModel)]="form.advanceMethodId" />
                          <i class="bi {{ methodIcon(pm.code) }}"></i>
                          <span>{{ pm.name }}</span>
                        </label>
                      }
                    </div>
                  </div>
                }
              }
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

            <!-- Advance breakdown when applicable -->
            @if (showAdvanceMethodSelector() && advanceAmount() > 0) {
              <div class="advance-breakdown">
                <div class="ab-row ab-now">
                  <i class="bi bi-lightning-charge-fill"></i>
                  <span>Pay now (advance)</span>
                  <span class="ab-amt">Rs. {{ advanceAmount() | number:'1.0-0' }}</span>
                </div>
                <div class="ab-row ab-later">
                  <i class="bi bi-house-door"></i>
                  <span>Pay on delivery</span>
                  <span class="ab-amt">Rs. {{ (totalAmount() - advanceAmount()) | number:'1.0-0' }}</span>
                </div>
              </div>
            }

            @if (error()) {
              <div class="co-error"><i class="bi bi-exclamation-circle"></i> {{ error() }}</div>
            }

            <!-- Auth hint — shown before clicking Place Order -->
            @if (!isAuthenticated()) {
              <div class="co-auth-hint">
                <i class="bi bi-person-lock"></i>
                Sign in or create an account to complete your order.
              </div>
            } @else if (!isCustomer()) {
              <div class="co-auth-hint co-auth-hint-warn">
                <i class="bi bi-exclamation-triangle"></i>
                This account type cannot place customer orders.
              </div>
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

    <!-- ── Auth gate modal ───────────────────────────────────────────────────── -->
    @if (authGateModal() !== 'none') {
      <div class="modal-overlay" (click)="authGateModal.set('none')">
        <div class="modal-box auth-gate-modal" (click)="$event.stopPropagation()">
          @if (authGateModal() === 'unauthenticated') {
            <div class="agm-icon"><i class="bi bi-bag-heart-fill"></i></div>
            <h3>Sign in to place your order</h3>
            <p>
              Your cart is saved. Log in or create a free customer account to complete your purchase.
            </p>
            <div class="agm-actions">
              <button class="btn-primary agm-btn" (click)="goToLogin()">
                <i class="bi bi-box-arrow-in-right"></i> Log In
              </button>
              <button class="btn-secondary agm-btn" (click)="goToRegister()">
                <i class="bi bi-person-plus"></i> Create Account
              </button>
            </div>
            <button class="agm-skip" (click)="authGateModal.set('none')">Continue browsing</button>
          } @else {
            <div class="agm-icon agm-icon-warn"><i class="bi bi-shield-exclamation"></i></div>
            <h3>Customer account required</h3>
            <p>
              Orders can only be placed from an Individual or Organization customer account.
              Rider, staff, and admin accounts cannot place customer orders.
            </p>
            <button class="btn-secondary agm-btn" (click)="authGateModal.set('none')">Got it</button>
          }
        </div>
      </div>
    }
  `,
  styleUrl: './checkout.scss'
})
export class CheckoutComponent implements OnInit {
  readonly cart       = inject(CartService);
  private orderSvc    = inject(OrderService);
  private paySvc      = inject(PaymentService);
  private authSvc     = inject(AuthService);
  private permSvc     = inject(PermissionService);
  private router      = inject(Router);

  readonly isAuthenticated = this.authSvc.isAuthenticated;
  readonly isCustomer      = computed(() => this.permSvc.canShop());

  authGateModal = signal<'none' | 'unauthenticated' | 'non-customer'>('none');

  addresses              = signal<Address[]>([]);
  paymentMethods         = signal<PaymentMethodDto[]>([]);
  paymentSettings        = signal<PaymentSettingsDto | null>(null);
  paymentMethodsLoading  = signal(true);
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

  // Bumped whenever form.deliveryDate changes programmatically so that
  // availableSlots (which reads the non-reactive form property) re-evaluates.
  private readonly scheduleKey = signal(0);

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
    this.scheduleKey(); // tracked so bumping it forces re-evaluation
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
    paymentMethodId:  0,
    advanceMethodId:  undefined as number | undefined,
    notes:            '',
  };

  readonly onlinePaymentMethods = computed(() =>
    this.paymentMethods().filter(m => m.code !== 'cod')
  );

  readonly selectedMethod = computed(() =>
    this.paymentMethods().find(m => m.id === this.form.paymentMethodId) ?? null
  );

  readonly advanceAmount = computed(() => {
    const settings = this.paymentSettings();
    if (!settings?.advanceEnabled) return 0;
    const total = this.totalAmount();
    if (total < settings.minAdvanceAmount) return 0;
    return Math.round(total * settings.advancePercent / 100);
  });

  readonly showAdvanceMethodSelector = computed(() => {
    const method = this.selectedMethod();
    return method?.code === 'cod' && this.advanceAmount() > 0;
  });

  get minDate(): string {
    // Only past dates are disabled — today and all future dates are always allowed.
    return nepalDateString(nepalNow());
  }

  get tomorrowDate(): string {
    const d = nepalNow();
    d.setDate(d.getDate() + 1);
    return nepalDateString(d);
  }

  ngOnInit() {
    // Restore form data saved before navigating to login/register
    let hasDraft = false;
    const draftStr = sessionStorage.getItem('checkout_draft');
    if (draftStr) {
      sessionStorage.removeItem('checkout_draft');
      try {
        const { form, useManual } = JSON.parse(draftStr);
        if (form) Object.assign(this.form, form);
        this.useManual.set(useManual ?? false);
        hasDraft = true;
      } catch { /* malformed draft — ignore */ }
    }

    this.orderSvc.getSetting('cancellation_policy_text').subscribe({
      next: s => this.cancelPolicy.set(s.value),
      error: () => {}
    });

    this.paySvc.getEnabledMethods().subscribe({
      next: list => {
        this.paymentMethods.set(list);
        this.paymentMethodsLoading.set(false);
        if (list.length > 0 && this.form.paymentMethodId === 0)
          this.form.paymentMethodId = list[0].id;
      },
      error: () => this.paymentMethodsLoading.set(false),
    });

    this.paySvc.getPaymentSettings().subscribe({
      next: s => this.paymentSettings.set(s),
      error: () => {}
    });

    this.orderSvc.getCheckoutConfig().subscribe({
      next: cfg => {
        this.checkoutConfig.set(cfg);
        this.configLoading.set(false);
        if (hasDraft) this.validateDraftSchedule();
        else this.setInitialDeliveryDate();
      },
      error: () => this.configLoading.set(false)
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
          // Skip auto-fill when the user's draft data is already in the form
          if (!hasDraft) {
            const def = list.find(a => a.isDefault) ?? list[0];
            if (def) this.onAddressSelect(def);
          }
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
    this.scheduleKey.update(v => v + 1);
    // Clear any previously-selected slot that is no longer in the available list
    if (!this.availableSlots().some(s => s.label === this.form.deliveryTimeSlot)) {
      this.form.deliveryTimeSlot = '';
    }
  }

  selectTomorrow(): void {
    this.form.deliveryDate = this.tomorrowDate;
    this.form.deliveryTimeSlot = '';
    this.scheduleKey.update(v => v + 1);
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

  onPaymentMethodChange(): void {
    this.form.advanceMethodId = undefined;
  }

  methodIcon(code: string): string {
    return { cod: 'bi-cash-stack', esewa: 'bi-phone', khalti: 'bi-phone-fill' }[code] ?? 'bi-credit-card';
  }

  resetLocation(): void {
    this.locationStatus.set('idle');
    this.userLatitude.set(null);
    this.userLongitude.set(null);
  }

  goToLogin(): void {
    this.saveFormDraft();
    this.router.navigate(['/auth/login'], { queryParams: { returnUrl: '/checkout' } });
  }

  goToRegister(): void {
    this.saveFormDraft();
    this.router.navigate(['/auth/register'], { queryParams: { returnUrl: '/checkout' } });
  }

  private saveFormDraft(): void {
    sessionStorage.setItem('checkout_draft', JSON.stringify({
      form:      { ...this.form },
      useManual: this.useManual(),
    }));
  }

  private setInitialDeliveryDate(): void {
    this.form.deliveryDate = nepalDateString(nepalNow());
    this.scheduleKey.update(v => v + 1);
  }

  private validateDraftSchedule(): void {
    const todayStr = nepalDateString(nepalNow());

    if (!this.form.deliveryDate) {
      this.form.deliveryDate = todayStr;
      this.scheduleKey.update(v => v + 1);
      return;
    }

    // If saved date is in the past (came back next day), reset to today
    if (this.form.deliveryDate < todayStr) {
      this.form.deliveryDate    = todayStr;
      this.form.deliveryTimeSlot = '';
    }

    this.scheduleKey.update(v => v + 1);

    // Clear saved slot if it's no longer available on the (possibly updated) date
    if (!this.availableSlots().some(s => s.label === this.form.deliveryTimeSlot)) {
      this.form.deliveryTimeSlot = '';
    }
  }

  placeOrder(): void {
    // Auth gate: enforce before any form validation so the experience is clear
    if (!this.authSvc.isAuthenticated()) {
      this.authGateModal.set('unauthenticated');
      return;
    }
    if (!this.permSvc.canShop()) {
      this.authGateModal.set('non-customer');
      return;
    }

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
    if (this.form.paymentMethodId === 0)  { this.error.set('Please select a payment method.'); return; }

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

    const method = this.selectedMethod();
    if (!method) { this.error.set('Please select a payment method.'); return; }

    const dto: PlaceOrderRequest = {
      deliveryAddressId: this.selectedAddressId() ?? 0,
      fullAddress:       this.form.fullAddress,
      city:              this.form.city,
      deliveryPhone:     this.form.deliveryPhone,
      landmark:          this.form.landmark || undefined,
      deliveryDate:      this.form.deliveryDate,
      deliveryTimeSlot:  this.form.deliveryTimeSlot,
      paymentMethod:     this.form.paymentMethodId,
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
        const orderId     = (res as { orderId: number; orderNumber: string }).orderId;
        const orderNumber = (res as { orderId: number; orderNumber: string }).orderNumber;

        const baseUrl  = window.location.origin;
        const payDto: InitiatePaymentDto = {
          paymentMethodId: this.form.paymentMethodId,
          advanceMethodId: this.form.advanceMethodId,
          returnUrl:       `${baseUrl}/payment/callback?gateway=${method.code}`,
          failureUrl:      `${baseUrl}/payment/callback?gateway=${method.code}&failed=1`,
        };

        this.paySvc.initiatePayment(orderId, payDto).subscribe({
          next: payResult => {
            this.cart.clearCart();
            if (!payResult.requiresRedirect) {
              // COD no advance — go straight to orders
              this.router.navigate(['/orders'], { queryParams: { placed: orderNumber } });
              return;
            }
            // eSewa: formFields means a browser form POST
            if (payResult.formFields && payResult.redirectUrl) {
              this.submitGatewayForm(payResult.redirectUrl, payResult.formFields);
            } else if (payResult.redirectUrl) {
              // Khalti: direct redirect
              window.location.href = payResult.redirectUrl;
            } else {
              this.router.navigate(['/orders'], { queryParams: { placed: orderNumber } });
            }
          },
          error: e => {
            // Order placed but payment initiation failed — still go to orders
            this.cart.clearCart();
            this.error.set(e.error?.message ?? 'Order placed but payment initiation failed.');
            this.placing.set(false);
            this.router.navigate(['/orders'], { queryParams: { placed: orderNumber } });
          }
        });
      },
      error: e => {
        this.error.set(e.error?.message ?? 'Failed to place order. Please try again.');
        this.placing.set(false);
      }
    });
  }

  private submitGatewayForm(action: string, fields: Record<string, string>): void {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = action;
    Object.entries(fields).forEach(([key, value]) => {
      const input = document.createElement('input');
      input.type  = 'hidden';
      input.name  = key;
      input.value = value;
      form.appendChild(input);
    });
    document.body.appendChild(form);
    form.submit();
  }
}
