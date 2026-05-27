import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { OrderService } from '../../../core/services/order.service';
import { OrderSummary, ORDER_STATUSES, PAYMENT_METHODS } from '../../../core/models/order.models';

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="orders-page">
      <div class="orders-header">
        <h2><i class="bi bi-bag-check"></i> My Orders</h2>
      </div>

      @if (placed()) {
        <div class="placed-banner">
          <i class="bi bi-check-circle-fill"></i>
          Order <strong>{{ placed() }}</strong> placed successfully! We'll start processing it shortly.
        </div>
      }

      @if (loading()) {
        <div class="orders-skeleton">
          @for (s of [1,2,3]; track s) {
            <div class="order-card skeleton"></div>
          }
        </div>
      } @else if (orders().length === 0) {
        <div class="orders-empty">
          <i class="bi bi-bag-x"></i>
          <h3>No orders yet</h3>
          <p>Start shopping to see your orders here.</p>
          <a routerLink="/products" class="btn-shop">Browse Products</a>
        </div>
      } @else {
        <div class="orders-list">
          @for (order of orders(); track order.id) {
            <a [routerLink]="['/orders', order.id]" class="order-card">
              <div class="oc-left">
                <span class="oc-number">{{ order.orderNumber }}</span>
                <span class="oc-date">{{ order.createdAt | date:'dd MMM yyyy, h:mm a' }}</span>
                <span class="oc-items">{{ order.itemCount }} item{{ order.itemCount > 1 ? 's' : '' }} · {{ order.deliveryDate | date:'dd MMM' }} · {{ order.deliveryTimeSlot }}</span>
              </div>
              <div class="oc-right">
                <span class="oc-amount">Rs. {{ order.totalAmount | number:'1.0-0' }}</span>
                <span class="oc-status" [style.background]="statusBg(order.status)" [style.color]="statusColor(order.status)">
                  {{ statusLabel(order.status) }}
                </span>
              </div>
              <i class="bi bi-chevron-right oc-arrow"></i>
            </a>
          }
        </div>
      }
    </div>
  `,
  styleUrl: './order-list.scss'
})
export class OrderListComponent implements OnInit {
  private svc   = inject(OrderService);
  private route = inject(ActivatedRoute);

  orders  = signal<OrderSummary[]>([]);
  loading = signal(true);
  placed  = signal('');

  ngOnInit() {
    this.route.queryParams.subscribe(p => this.placed.set(p['placed'] ?? ''));
    this.svc.getMyOrders().subscribe({
      next: list => { this.orders.set(list); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  statusLabel(s: number): string { return ORDER_STATUSES[s]?.label ?? 'Unknown'; }
  statusColor(s: number): string { return ORDER_STATUSES[s]?.color ?? '#6b7280'; }
  statusBg(s: number): string    { return (ORDER_STATUSES[s]?.color ?? '#6b7280') + '1a'; }
}
