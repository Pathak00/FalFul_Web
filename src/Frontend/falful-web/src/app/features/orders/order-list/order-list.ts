import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { OrderService } from '../../../core/services/order.service';
import { OrderSummary, ORDER_STATUSES, DELIVERY_STATUSES } from '../../../core/models/order.models';

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './order-list.html',
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

  private useDeliveryStatus(order: OrderSummary): boolean {
    return order.status === 4 && order.deliveryStatus != null;
  }

  effectiveStatusLabel(order: OrderSummary): string {
    return this.useDeliveryStatus(order)
      ? (DELIVERY_STATUSES[order.deliveryStatus!]?.label ?? order.deliveryStatusLabel ?? 'Unknown')
      : (ORDER_STATUSES[order.status]?.label ?? 'Unknown');
  }

  effectiveStatusColor(order: OrderSummary): string {
    return this.useDeliveryStatus(order)
      ? (DELIVERY_STATUSES[order.deliveryStatus!]?.color ?? '#6b7280')
      : (ORDER_STATUSES[order.status]?.color ?? '#6b7280');
  }

  effectiveStatusBg(order: OrderSummary): string {
    return this.effectiveStatusColor(order) + '1a';
  }
}
