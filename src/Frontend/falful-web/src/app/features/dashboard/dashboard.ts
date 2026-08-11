import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { OrderService } from '../../core/services/order.service';
import { OrderSummary, ORDER_STATUSES, DELIVERY_STATUSES } from '../../core/models/order.models';
import { SubscriptionService } from '../../core/services/subscription.service';
import { UserSubscription } from '../../core/models/subscription.models';
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private orderService = inject(OrderService);
  private SubscriptionSrv = inject(SubscriptionService);
  subscription = signal<UserSubscription | null>(null);
  hasSubscription = signal(false);

  readonly user = this.authService.currentUser;
  readonly initial = computed(() => this.user()?.fullName?.charAt(0)?.toUpperCase() ?? '?');

  loading = signal(true);
  private _all = signal<OrderSummary[]>([]);

  readonly recentOrders = computed(() => this._all().slice(0, 5));

  ngOnInit(): void {
    this.orderService.getMyOrders().subscribe({
      next: (list) => {
        this._all.set(list);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });

    this.SubscriptionSrv.getuserSuscription().subscribe({
      next: (response) => {
        console.log(response);
        console.log(response.data);
        this.subscription.set(response.data);
        this.hasSubscription.set(true);
        console.log('success');
      },
      error: (err) => {
        console.log('error');
        this.subscription.set(null);
        this.hasSubscription.set(false);
        console.error(err);
      },
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
