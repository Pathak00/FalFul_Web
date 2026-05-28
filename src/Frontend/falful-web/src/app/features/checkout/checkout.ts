import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { OrderService } from '../../core/services/order.service';
import { AuthService } from '../../core/services/auth.service';
import {
  Address, PriceRule, PlaceOrderRequest,
  DELIVERY_TIME_SLOTS, PAYMENT_METHODS
} from '../../core/models/order.models';

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

            <!-- Delivery Date & Time -->
            <section class="co-section">
              <h3><i class="bi bi-calendar-event"></i> Delivery Schedule</h3>
              <div class="form-row">
                <div class="form-group">
                  <label>Delivery Date *</label>
                  <input type="date" [(ngModel)]="form.deliveryDate" [min]="minDate" />
                </div>
                <div class="form-group">
                  <label>Time Slot *</label>
                  <select [(ngModel)]="form.deliveryTimeSlot">
                    <option value="">Select time...</option>
                    @for (slot of timeSlots; track slot) {
                      <option [value]="slot">{{ slot }}</option>
                    }
                  </select>
                </div>
              </div>
            </section>

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
                <span>Rs. {{ deliveryFee() | number:'1.0-0' }}</span>
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

            <button class="btn-place-order" (click)="placeOrder()" [disabled]="placing()">
              @if (placing()) { <span class="spinner"></span> Processing... }
              @else { <i class="bi bi-bag-check"></i> Place Order }
            </button>

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
  cancelPolicy      = signal<string>('');

  deliveryFee    = signal(0);
  serviceFeePct  = signal(0);
  minOrderAmt    = signal(0);
  freeAbove      = signal(0);

  serviceFeeAmt = computed(() =>
    Math.round(this.cart.subTotal() * this.serviceFeePct() / 100 * 100) / 100
  );
  effectiveDeliveryFee = computed(() =>
    this.freeAbove() > 0 && this.cart.subTotal() >= this.freeAbove() ? 0 : this.deliveryFee()
  );
  totalAmount = computed(() =>
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

  readonly timeSlots     = DELIVERY_TIME_SLOTS;
  readonly paymentMethods = [
    { value: 1, label: 'Cash on Delivery', icon: 'bi-cash-stack' },
    { value: 2, label: 'eSewa',            icon: 'bi-phone' },
    { value: 3, label: 'Khalti',           icon: 'bi-phone-fill' },
  ];

  get minDate(): string {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }

  ngOnInit() {
    this.orderSvc.getSetting('cancellation_policy_text').subscribe({
      next: s => this.cancelPolicy.set(s.value),
      error: () => {}
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

  placeOrder(): void {
    this.error.set('');
    const sub = this.cart.subTotal();

    if (this.minOrderAmt() > 0 && sub < this.minOrderAmt()) {
      this.error.set(`Minimum order is Rs. ${this.minOrderAmt()}.`);
      return;
    }
    if (!this.form.fullAddress.trim()) { this.error.set('Delivery address is required.'); return; }
    if (!this.form.city.trim())        { this.error.set('City is required.'); return; }
    if (!this.form.deliveryPhone.trim()) { this.error.set('Phone number is required.'); return; }
    if (!this.form.deliveryDate)       { this.error.set('Delivery date is required.'); return; }
    if (!this.form.deliveryTimeSlot)   { this.error.set('Delivery time slot is required.'); return; }

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
