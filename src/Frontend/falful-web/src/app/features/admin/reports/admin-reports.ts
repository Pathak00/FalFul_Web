import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../../core/services/order.service';
import {
  DeliveryReport, OrderReport,
  DELIVERY_FAILURE_REASONS, DELIVERY_STATUSES, PAYMENT_METHODS, ORDER_STATUSES,
} from '../../../core/models/order.models';

@Component({
  selector: 'app-admin-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrl: '../admin-shared.scss',
  template: `
    <div class="admin-page" style="max-width:1100px">
      <div class="page-header">
        <div>
          <h1>Reports</h1>
          <p class="page-sub">Delivery performance analytics and order revenue summaries.</p>
        </div>
      </div>

      <!-- Date filter -->
      <div class="filter-bar" style="margin-bottom:1.75rem">
        <input type="date" [(ngModel)]="fromDate" style="font-size:.875rem">
        <span style="color:#9ca3af;font-size:.875rem">–</span>
        <input type="date" [(ngModel)]="toDate" style="font-size:.875rem">
        <button class="btn-primary btn-sm" [disabled]="loading()" (click)="load()">
          @if (loading()) { <i class="bi bi-arrow-clockwise spin"></i> } Load Reports
        </button>
        @if (!loading() && (delivery() || orders())) {
          <span style="font-size:.78rem;color:#9ca3af;margin-left:.25rem">
            {{ fromDate || 'All time' }}{{ toDate ? ' – ' + toDate : '' }}
          </span>
        }
      </div>

      @if (loading()) {
        <div class="loading-state"><div class="spin"><i class="bi bi-arrow-clockwise"></i></div> Loading reports…</div>
      }

      <!-- ── Delivery Performance ── -->
      @if (delivery()) {
        <section>
          <h2 style="font-size:1rem;font-weight:700;color:#0f172a;margin:0 0 1rem;display:flex;align-items:center;gap:.5rem">
            <i class="bi bi-bicycle" style="color:#06b6d4"></i> Delivery Performance
          </h2>
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:.875rem;margin-bottom:1.5rem">
            <div class="kpi-card">
              <div class="kpi-value">{{ delivery()!.totalDeliveries }}</div>
              <div class="kpi-label">Total Deliveries</div>
            </div>
            <div class="kpi-card kpi-green">
              <div class="kpi-value">{{ delivery()!.delivered }}</div>
              <div class="kpi-label">Delivered</div>
            </div>
            <div class="kpi-card kpi-red">
              <div class="kpi-value">{{ delivery()!.failed }}</div>
              <div class="kpi-label">Failed</div>
            </div>
            <div class="kpi-card kpi-blue">
              <div class="kpi-value">{{ delivery()!.inProgress }}</div>
              <div class="kpi-label">In Progress</div>
            </div>
            <div class="kpi-card kpi-green">
              <div class="kpi-value">{{ delivery()!.successRate | number:'1.0-1' }}%</div>
              <div class="kpi-label">Success Rate</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-value">{{ delivery()!.avgAttempts | number:'1.0-2' }}</div>
              <div class="kpi-label">Avg Attempts</div>
            </div>
            @if (delivery()!.avgRating != null) {
              <div class="kpi-card kpi-orange">
                <div class="kpi-value">{{ delivery()!.avgRating | number:'1.0-1' }} ★</div>
                <div class="kpi-label">Avg Rating</div>
              </div>
            }
          </div>

          <!-- Breakdown tables side by side -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:2rem"
               class="report-grid">
            <!-- Failure Reasons -->
            @if (delivery()!.failureBreakdown?.length) {
              <div class="data-table-wrapper">
                <div style="padding:.75rem 1rem;border-bottom:1px solid #e2e8f0;font-size:.78rem;font-weight:700;color:#374151">
                  <i class="bi bi-x-circle" style="color:#ef4444;margin-right:.3rem"></i>Failure Reasons
                </div>
                <table class="data-table">
                  <thead><tr><th>Reason</th><th style="text-align:right">Count</th></tr></thead>
                  <tbody>
                    @for (row of delivery()!.failureBreakdown; track row.failureReason) {
                      <tr>
                        <td>{{ row.failureReasonLabel || failureReasonLabel(row.failureReason) }}</td>
                        <td style="text-align:right;font-weight:700">{{ row.count }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }

            <!-- Delivery Status Breakdown -->
            @if (delivery()!.statusBreakdown?.length) {
              <div class="data-table-wrapper">
                <div style="padding:.75rem 1rem;border-bottom:1px solid #e2e8f0;font-size:.78rem;font-weight:700;color:#374151">
                  <i class="bi bi-bar-chart" style="color:#3b82f6;margin-right:.3rem"></i>Status Breakdown
                </div>
                <table class="data-table">
                  <thead><tr><th>Status</th><th style="text-align:right">Count</th></tr></thead>
                  <tbody>
                    @for (row of delivery()!.statusBreakdown; track row.status) {
                      <tr>
                        <td>
                          <span class="status-badge"
                                [style.background]="dStatusBg(row.status)"
                                [style.color]="dStatusColor(row.status)">
                            {{ row.statusLabel || dStatusLabel(row.status) }}
                          </span>
                        </td>
                        <td style="text-align:right;font-weight:700">{{ row.count }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </div>
        </section>
      }

      <!-- ── Order Analytics ── -->
      @if (orders()) {
        <section>
          <h2 style="font-size:1rem;font-weight:700;color:#0f172a;margin:0 0 1rem;display:flex;align-items:center;gap:.5rem">
            <i class="bi bi-bag-check" style="color:#16a34a"></i> Order Analytics
          </h2>
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:.875rem;margin-bottom:1.5rem">
            <div class="kpi-card">
              <div class="kpi-value">{{ orders()!.totalOrders }}</div>
              <div class="kpi-label">Total Orders</div>
            </div>
            <div class="kpi-card kpi-green">
              <div class="kpi-value">{{ orders()!.delivered }}</div>
              <div class="kpi-label">Delivered</div>
            </div>
            <div class="kpi-card kpi-red">
              <div class="kpi-value">{{ orders()!.cancelled }}</div>
              <div class="kpi-label">Cancelled</div>
            </div>
            <div class="kpi-card kpi-blue">
              <div class="kpi-value">{{ orders()!.active }}</div>
              <div class="kpi-label">Active</div>
            </div>
            <div class="kpi-card kpi-green">
              <div class="kpi-value">Rs.{{ orders()!.totalRevenue | number:'1.0-0' }}</div>
              <div class="kpi-label">Total Revenue</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-value">Rs.{{ orders()!.avgOrderValue | number:'1.0-0' }}</div>
              <div class="kpi-label">Avg Order Value</div>
            </div>
            <div class="kpi-card kpi-orange">
              <div class="kpi-value">Rs.{{ orders()!.deliveredRevenue | number:'1.0-0' }}</div>
              <div class="kpi-label">Delivered Revenue</div>
            </div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem" class="report-grid">
            <!-- Order Status Breakdown -->
            @if (orders()!.statusBreakdown?.length) {
              <div class="data-table-wrapper">
                <div style="padding:.75rem 1rem;border-bottom:1px solid #e2e8f0;font-size:.78rem;font-weight:700;color:#374151">
                  <i class="bi bi-bar-chart" style="color:#3b82f6;margin-right:.3rem"></i>Order Status
                </div>
                <table class="data-table">
                  <thead><tr><th>Status</th><th style="text-align:right">Count</th><th style="text-align:right">Revenue</th></tr></thead>
                  <tbody>
                    @for (row of orders()!.statusBreakdown; track row.status) {
                      <tr>
                        <td>
                          <span class="status-badge"
                                [style.background]="oStatusBg(row.status)"
                                [style.color]="oStatusColor(row.status)">
                            {{ row.statusLabel || oStatusLabel(row.status) }}
                          </span>
                        </td>
                        <td style="text-align:right;font-weight:700">{{ row.count }}</td>
                        <td style="text-align:right;color:#16a34a;font-weight:600">Rs.{{ row.revenue | number:'1.0-0' }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }

            <!-- Payment Method Breakdown -->
            @if (orders()!.paymentBreakdown?.length) {
              <div class="data-table-wrapper">
                <div style="padding:.75rem 1rem;border-bottom:1px solid #e2e8f0;font-size:.78rem;font-weight:700;color:#374151">
                  <i class="bi bi-credit-card" style="color:#8b5cf6;margin-right:.3rem"></i>Payment Methods
                </div>
                <table class="data-table">
                  <thead><tr><th>Method</th><th style="text-align:right">Count</th><th style="text-align:right">Revenue</th></tr></thead>
                  <tbody>
                    @for (row of orders()!.paymentBreakdown; track row.paymentMethod) {
                      <tr>
                        <td>{{ row.paymentMethodLabel || paymentLabel(row.paymentMethod) }}</td>
                        <td style="text-align:right;font-weight:700">{{ row.count }}</td>
                        <td style="text-align:right;color:#16a34a;font-weight:600">Rs.{{ row.revenue | number:'1.0-0' }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </div>
        </section>
      }

      @if (!loading() && !delivery() && !orders()) {
        <div class="empty-state">
          <i class="bi bi-bar-chart-line empty-icon"></i>
          <h3>No report data</h3>
          <p>Select a date range and click "Load Reports".</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .kpi-card {
      background: #fff; border: 1px solid #e2e8f0; border-radius: 10px;
      padding: 1rem 1.25rem; text-align: center;
    }
    .kpi-value { font-size: 1.5rem; font-weight: 800; color: #0f172a; line-height: 1.2; }
    .kpi-label { font-size: .72rem; color: #64748b; margin-top: .25rem; text-transform: uppercase; letter-spacing: .04em; }
    .kpi-green  { border-top: 3px solid #22c55e; .kpi-value { color: #16a34a; } }
    .kpi-red    { border-top: 3px solid #ef4444; .kpi-value { color: #dc2626; } }
    .kpi-blue   { border-top: 3px solid #3b82f6; .kpi-value { color: #1d4ed8; } }
    .kpi-purple { border-top: 3px solid #8b5cf6; .kpi-value { color: #7c3aed; } }
    .kpi-orange { border-top: 3px solid #f59e0b; .kpi-value { color: #d97706; } }
    @media (max-width: 640px) { .report-grid { grid-template-columns: 1fr !important; } }
  `]
})
export class AdminReportsComponent implements OnInit {
  private svc = inject(OrderService);

  delivery = signal<DeliveryReport | null>(null);
  orders   = signal<OrderReport | null>(null);
  loading  = signal(false);

  fromDate = '';
  toDate   = '';

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    const f = this.fromDate || undefined;
    const t = this.toDate   || undefined;
    let done = 0;
    const finish = () => { if (++done === 2) this.loading.set(false); };

    this.svc.getDeliveryReport(f, t).subscribe({ next: r => { this.delivery.set(r); finish(); }, error: () => finish() });
    this.svc.getOrderReport(f, t).subscribe({ next: r => { this.orders.set(r);   finish(); }, error: () => finish() });
  }

  failureReasonLabel(n: number) { return DELIVERY_FAILURE_REASONS[n] ?? 'Unknown'; }
  dStatusLabel(n: number)       { return DELIVERY_STATUSES[n]?.label ?? 'Unknown'; }
  dStatusColor(n: number)       { return DELIVERY_STATUSES[n]?.color ?? '#6b7280'; }
  dStatusBg(n: number)          { return (DELIVERY_STATUSES[n]?.color ?? '#6b7280') + '1a'; }
  oStatusLabel(n: number)       { return ORDER_STATUSES[n]?.label ?? 'Unknown'; }
  oStatusColor(n: number)       { return ORDER_STATUSES[n]?.color ?? '#6b7280'; }
  oStatusBg(n: number)          { return (ORDER_STATUSES[n]?.color ?? '#6b7280') + '1a'; }
  paymentLabel(n: number)       { return PAYMENT_METHODS[n] ?? 'Unknown'; }
}
