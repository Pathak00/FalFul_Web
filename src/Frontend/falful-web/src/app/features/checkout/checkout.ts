import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { OrderService } from '../../core/services/order.service';
import { PaymentService } from '../../core/services/payment.service';
import { DiscountService } from '../../core/services/discount.service';
import { AuthService } from '../../core/services/auth.service';
import { PermissionService } from '../../core/services/permission.service';
import {
  Address, CheckoutConfig, PriceRule, PlaceOrderRequest, PAYMENT_METHODS
} from '../../core/models/order.models';
import { PaymentMethodDto, PaymentSettingsDto, InitiatePaymentDto } from '../../core/models/payment.models';
import { PopDialogBoxComponent } from '../../shared/components/PopUpConfirmationModel/popDialogBox';

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
  imports: [CommonModule, FormsModule, RouterLink, PopDialogBoxComponent],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss'
})
export class CheckoutComponent implements OnInit {
  readonly cart       = inject(CartService);
  private orderSvc    = inject(OrderService);
  private paySvc      = inject(PaymentService);
  private discountSvc = inject(DiscountService);
  private authSvc     = inject(AuthService);
  private permSvc     = inject(PermissionService);
  private router      = inject(Router);

  readonly isAuthenticated = this.authSvc.isAuthenticated;
  readonly isCustomer      = computed(() => this.permSvc.canShop());

  authGateModal = signal<'none' | 'unauthenticated' | 'non-customer'>('none');

  readonly authGateTitle = computed(() =>
    this.authGateModal() === 'unauthenticated'
      ? 'Sign in to place your order'
      : 'Customer account required'
  );
  readonly authGateMessage = computed(() =>
    this.authGateModal() === 'unauthenticated'
      ? 'Your cart is saved. Log in to complete your purchase.'
      : 'Orders can only be placed from an Individual or Organization customer account. Rider, staff, and admin accounts cannot place customer orders.'
  );
  readonly authGateConfirmText = computed(() =>
    this.authGateModal() === 'unauthenticated' ? 'Log In' : 'Got it'
  );

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
  readonly preTotalAmount = computed(() =>
    this.cart.subTotal() + this.effectiveDeliveryFee() + this.serviceFeeAmt()
  );
  readonly totalAmount = computed(() =>
    Math.max(0, this.preTotalAmount() - this.appliedDiscount())
  );

  // ── Discount ──────────────────────────────────────────────────────────────
  discountInput   = signal('');
  discountMsg     = signal('');
  discountSuccess = signal(false);
  appliedDiscount = signal(0);
  appliedCode     = signal('');
  discountApplying = signal(false);

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

  applyDiscount(): void {
    const code = this.discountInput().trim();
    if (!code) { this.discountMsg.set('Enter a discount code.'); this.discountSuccess.set(false); return; }
    this.discountApplying.set(true);
    this.discountMsg.set('');
    this.discountSvc.validateCode(code, this.preTotalAmount()).subscribe({
      next: res => {
        this.discountApplying.set(false);
        this.discountMsg.set(res.message);
        this.discountSuccess.set(res.isValid);
        if (res.isValid) {
          this.appliedDiscount.set(res.discountAmount);
          this.appliedCode.set(code.toUpperCase());
        } else {
          this.appliedDiscount.set(0);
          this.appliedCode.set('');
        }
      },
      error: () => {
        this.discountApplying.set(false);
        this.discountMsg.set('Failed to validate code. Try again.');
        this.discountSuccess.set(false);
      }
    });
  }

  removeDiscount(): void {
    this.appliedDiscount.set(0);
    this.appliedCode.set('');
    this.discountInput.set('');
    this.discountMsg.set('');
    this.discountSuccess.set(false);
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

  onAuthGateConfirm(): void {
    if (this.authGateModal() === 'unauthenticated') this.goToLogin();
    this.authGateModal.set('none');
  }

  onAuthGateClose(open: boolean): void {
    if (!open) this.authGateModal.set('none');
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
      discountCode:      this.appliedCode() || undefined,
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
