import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { OrderService } from '../../core/services/order.service';
import { OrderSummary, ORDER_STATUSES, DELIVERY_STATUSES } from '../../core/models/order.models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="customer-dash">

      <!-- ── Header ─────────────────────────────────────────────────────────── -->
      <div class="dash-header">
        <div class="dash-welcome">
          <div class="dash-avatar">{{ initial() }}</div>
          <div class="dash-greeting">
            <h1>Welcome back, {{ user()?.fullName }}!</h1>
            <p>Here's a quick look at your account.</p>
          </div>
        </div>
        <a routerLink="/products" class="btn-shop-now">
          <i class="bi bi-basket2-fill"></i> Shop Now
        </a>
      </div>

      <!-- ── Quick Actions ───────────────────────────────────────────────────── -->
      <section class="dash-section">
        <h2 class="section-title">Quick Actions</h2>
        <div class="quick-actions">
          <a routerLink="/products" class="action-card green">
            <div class="action-icon"><i class="bi bi-basket2-fill"></i></div>
            <div class="action-label">Browse Products</div>
            <div class="action-sub">Fresh fruits &amp; veggies</div>
          </a>
          <a routerLink="/build-your-bowl" class="action-card blue">
            <div class="action-icon"><i class="bi bi-cup-hot-fill"></i></div>
            <div class="action-label">Build Your Bowl</div>
            <div class="action-sub">Customise your combo</div>
          </a>
          <a routerLink="/orders" class="action-card purple">
            <div class="action-icon"><i class="bi bi-bag-check-fill"></i></div>
            <div class="action-label">My Orders</div>
            <div class="action-sub">Track &amp; manage</div>
          </a>
          <a routerLink="/checkout" class="action-card orange">
            <div class="action-icon"><i class="bi bi-cart-check-fill"></i></div>
            <div class="action-label">Checkout</div>
            <div class="action-sub">Complete your cart</div>
          </a>
        </div>
      </section>

      <!-- ── Recent Orders ───────────────────────────────────────────────────── -->
      <section class="dash-section">
        <div class="section-header">
          <h2 class="section-title">Recent Orders</h2>
          <a routerLink="/orders" class="see-all">See all <i class="bi bi-arrow-right"></i></a>
        </div>

        @if (loading()) {
          <div class="orders-skeleton">
            @for (s of [1,2,3]; track s) {
              <div class="order-skeleton-row"></div>
            }
          </div>
        } @else if (recentOrders().length === 0) {
          <div class="orders-empty">
            <i class="bi bi-bag-x"></i>
            <p>You haven't placed any orders yet.</p>
            <a routerLink="/products" class="btn-browse">Browse Products</a>
          </div>
        } @else {
          <div class="orders-list">
            @for (order of recentOrders(); track order.id) {
              <a [routerLink]="['/orders', order.id]" class="order-row">
                <div class="or-left">
                  <span class="or-number">{{ order.orderNumber }}</span>
                  <span class="or-date">{{ order.createdAt | date:'dd MMM yyyy':'Asia/Kathmandu' }}</span>
                </div>
                <div class="or-middle">
                  <span class="or-items">{{ order.itemCount }} item{{ order.itemCount !== 1 ? 's' : '' }}</span>
                  <span class="or-delivery">{{ order.deliveryDate | date:'dd MMM':'Asia/Kathmandu' }} · {{ order.deliveryTimeSlot }}</span>
                </div>
                <div class="or-right">
                  <span class="or-amount">Rs. {{ order.totalAmount | number:'1.0-0' }}</span>
                  <span class="or-badge"
                        [style.background]="statusBg(order)"
                        [style.color]="statusColor(order)">
                    {{ statusLabel(order) }}
                  </span>
                </div>
                <i class="bi bi-chevron-right or-arrow"></i>
              </a>
            }
          </div>
        }
      </section>

      <!-- ── Account ─────────────────────────────────────────────────────────── -->
      <section class="dash-section">
        <h2 class="section-title">My Account</h2>
        <div class="account-card">
          <div class="account-info">
            <div class="account-avatar">{{ initial() }}</div>
            <div class="account-details">
              <div class="account-name">{{ user()?.fullName }}</div>
              @if (user()?.email) {
                <div class="account-meta"><i class="bi bi-envelope"></i> {{ user()?.email }}</div>
              }
              @if (user()?.phoneNumber) {
                <div class="account-meta"><i class="bi bi-telephone"></i> {{ user()?.phoneNumber }}</div>
              }
              <div class="account-meta"><i class="bi bi-person-badge"></i> {{ user()?.role }}</div>
            </div>
          </div>
        </div>
      </section>

    </div>
  `,
  styles: [`
    .customer-dash {
      max-width: 860px;
      margin: 0 auto;
      padding: 2rem 1.25rem 3rem;
    }

    /* ── Header ───────────────────────────────────────────────────────────── */
    .dash-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 2rem;
      flex-wrap: wrap;
    }

    .dash-welcome {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .dash-avatar {
      width: 52px;
      height: 52px;
      border-radius: 50%;
      background: linear-gradient(135deg, #2d9348, #48c774);
      color: #fff;
      font-size: 1.25rem;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .dash-greeting h1 {
      font-size: 1.35rem;
      font-weight: 800;
      color: #111827;
      margin: 0 0 .2rem;
    }

    .dash-greeting p {
      font-size: .875rem;
      color: #6b7280;
      margin: 0;
    }

    .btn-shop-now {
      display: inline-flex;
      align-items: center;
      gap: .4rem;
      background: linear-gradient(135deg, #2d9348, #48c774);
      color: #fff;
      text-decoration: none;
      padding: .55rem 1.25rem;
      border-radius: 10px;
      font-size: .875rem;
      font-weight: 600;
      white-space: nowrap;
      transition: opacity .15s;
      &:hover { opacity: .88; }
    }

    /* ── Sections ─────────────────────────────────────────────────────────── */
    .dash-section {
      margin-bottom: 2rem;
    }

    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: .875rem;
    }

    .section-title {
      font-size: 1rem;
      font-weight: 700;
      color: #111827;
      margin: 0 0 .875rem;
    }

    .section-header .section-title { margin-bottom: 0; }

    .see-all {
      font-size: .8rem;
      font-weight: 600;
      color: #2d9348;
      text-decoration: none;
      display: flex;
      align-items: center;
      gap: .25rem;
      &:hover { text-decoration: underline; }
    }

    /* ── Quick Actions ────────────────────────────────────────────────────── */
    .quick-actions {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: .875rem;
    }

    .action-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: .5rem;
      padding: 1.25rem .75rem;
      border-radius: 14px;
      text-decoration: none;
      border: 1.5px solid transparent;
      transition: transform .15s, box-shadow .15s;
      background: #fff;
      box-shadow: 0 1px 4px rgba(0,0,0,.06);

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 18px rgba(0,0,0,.1);
      }

      &.green  { border-color: #d1fae5; background: #f0fdf4; }
      &.blue   { border-color: #dbeafe; background: #eff6ff; }
      &.purple { border-color: #ede9fe; background: #f5f3ff; }
      &.orange { border-color: #ffedd5; background: #fff7ed; }
    }

    .action-icon {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;

      .green  & { background: #dcfce7; color: #16a34a; }
      .blue   & { background: #dbeafe; color: #2563eb; }
      .purple & { background: #ede9fe; color: #7c3aed; }
      .orange & { background: #ffedd5; color: #ea580c; }
    }

    .action-label {
      font-size: .8rem;
      font-weight: 700;
      color: #111827;
    }

    .action-sub {
      font-size: .7rem;
      color: #9ca3af;
    }

    /* ── Orders ───────────────────────────────────────────────────────────── */
    .orders-skeleton {
      display: flex;
      flex-direction: column;
      gap: .625rem;
    }

    .order-skeleton-row {
      height: 62px;
      border-radius: 12px;
      background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
      background-size: 200% 100%;
      animation: shimmer 1.4s infinite;
    }

    @keyframes shimmer { to { background-position: -200% 0; } }

    .orders-empty {
      text-align: center;
      padding: 2.5rem 1rem;
      background: #f9fafb;
      border-radius: 14px;
      color: #6b7280;
      i { font-size: 2rem; display: block; margin-bottom: .5rem; }
      p { font-size: .875rem; margin: 0 0 1rem; }
    }

    .btn-browse {
      display: inline-block;
      text-decoration: none;
      background: linear-gradient(135deg, #2d9348, #48c774);
      color: #fff;
      padding: .5rem 1.25rem;
      border-radius: 8px;
      font-size: .8rem;
      font-weight: 600;
    }

    .orders-list {
      display: flex;
      flex-direction: column;
      gap: .5rem;
    }

    .order-row {
      display: flex;
      align-items: center;
      gap: .75rem;
      padding: .875rem 1rem;
      background: #fff;
      border-radius: 12px;
      border: 1px solid #f3f4f6;
      text-decoration: none;
      color: inherit;
      transition: box-shadow .15s, border-color .15s;
      &:hover { box-shadow: 0 4px 14px rgba(0,0,0,.07); border-color: #e5e7eb; }
    }

    .or-left {
      display: flex;
      flex-direction: column;
      gap: .15rem;
      min-width: 0;
      flex: 0 0 130px;
    }

    .or-number {
      font-size: .8rem;
      font-weight: 700;
      color: #111827;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .or-date { font-size: .72rem; color: #9ca3af; }

    .or-middle {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: .15rem;
      min-width: 0;
    }

    .or-items { font-size: .78rem; color: #374151; font-weight: 500; }
    .or-delivery { font-size: .72rem; color: #9ca3af; }

    .or-right {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: .3rem;
      flex-shrink: 0;
    }

    .or-amount {
      font-size: .85rem;
      font-weight: 700;
      color: #111827;
    }

    .or-badge {
      font-size: .68rem;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 20px;
      white-space: nowrap;
    }

    .or-arrow {
      font-size: .75rem;
      color: #d1d5db;
      flex-shrink: 0;
    }

    /* ── Account ──────────────────────────────────────────────────────────── */
    .account-card {
      background: #fff;
      border: 1px solid #f3f4f6;
      border-radius: 14px;
      padding: 1.25rem 1.25rem;
    }

    .account-info {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .account-avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: linear-gradient(135deg, #2d9348, #48c774);
      color: #fff;
      font-size: 1.1rem;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .account-name {
      font-size: .925rem;
      font-weight: 700;
      color: #111827;
      margin-bottom: .3rem;
    }

    .account-meta {
      font-size: .78rem;
      color: #6b7280;
      display: flex;
      align-items: center;
      gap: .35rem;
      margin-bottom: .15rem;
      i { font-size: .75rem; }
    }

    /* ── Responsive ───────────────────────────────────────────────────────── */
    @media (max-width: 640px) {
      .quick-actions { grid-template-columns: repeat(2, 1fr); }
      .dash-header { flex-direction: column; align-items: flex-start; }
      .or-middle { display: none; }
    }

    @media (max-width: 400px) {
      .quick-actions { grid-template-columns: 1fr 1fr; gap: .625rem; }
      .action-card { padding: 1rem .5rem; }
    }
  `]
})
export class DashboardComponent implements OnInit {
  private authService  = inject(AuthService);
  private orderService = inject(OrderService);

  readonly user    = this.authService.currentUser;
  readonly initial = computed(() => this.user()?.fullName?.charAt(0)?.toUpperCase() ?? '?');

  loading      = signal(true);
  private _all = signal<OrderSummary[]>([]);

  readonly recentOrders = computed(() => this._all().slice(0, 5));

  ngOnInit(): void {
    this.orderService.getMyOrders().subscribe({
      next: list => { this._all.set(list); this.loading.set(false); },
      error: ()   => this.loading.set(false)
    });
  }

  private useDelivery(o: OrderSummary): boolean {
    return o.status === 4 && o.deliveryStatus != null;
  }

  statusLabel(o: OrderSummary): string {
    return this.useDelivery(o)
      ? (DELIVERY_STATUSES[o.deliveryStatus!]?.label ?? o.deliveryStatusLabel ?? 'Unknown')
      : (ORDER_STATUSES[o.status]?.label ?? 'Unknown');
  }

  statusColor(o: OrderSummary): string {
    return this.useDelivery(o)
      ? (DELIVERY_STATUSES[o.deliveryStatus!]?.color ?? '#6b7280')
      : (ORDER_STATUSES[o.status]?.color ?? '#6b7280');
  }

  statusBg(o: OrderSummary): string {
    return this.statusColor(o) + '1a';
  }
}
