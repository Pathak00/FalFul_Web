import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReceiptService } from '../../../core/services/receipt.service';
import { ReceiptPrintLog } from '../../../core/models/receipt.models';

const PAGE_SIZE = 50;

@Component({
  selector: 'app-admin-receipt-logs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrl: '../admin-shared.scss',
  template: `
    <div class="admin-page" style="max-width:1100px">

      <div class="page-header">
        <div>
          <h1>Receipt Print Logs</h1>
          <p class="page-sub">Audit trail of every receipt printed — who, when, and which template.</p>
        </div>
        <button class="btn-secondary" (click)="load()" title="Refresh">
          <i class="bi bi-arrow-clockwise"></i> Refresh
        </button>
      </div>

      <!-- Filter bar -->
      <div class="filter-bar">
        <div class="filter-group">
          <label>Filter by Order #</label>
          <div class="input-with-btn">
            <input type="number" [(ngModel)]="filterOrderId" placeholder="Order ID" min="1" />
            <button class="btn-primary btn-sm" (click)="applyFilter()"><i class="bi bi-search"></i></button>
            @if (filterOrderId) {
              <button class="btn-secondary btn-sm" (click)="clearFilter()"><i class="bi bi-x-lg"></i></button>
            }
          </div>
        </div>
      </div>

      @if (loading()) {
        <div class="loading-state"><div class="spinner"></div> Loading…</div>
      } @else if (logs().length === 0) {
        <div class="empty-state">
          <i class="bi bi-printer"></i>
          <p>{{ filterOrderId ? 'No print logs found for this order.' : 'No receipt print logs yet.' }}</p>
        </div>
      } @else {
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Printed By</th>
                <th>Role</th>
                <th>Template</th>
                <th>Printed At</th>
              </tr>
            </thead>
            <tbody>
              @for (l of logs(); track l.id) {
                <tr>
                  <td><span class="order-num">#{{ l.orderNumber }}</span></td>
                  <td>{{ l.printedByName }}</td>
                  <td><span class="role-badge">{{ l.printedByRole }}</span></td>
                  <td>
                    @if (l.templateName) {
                      <span>{{ l.templateName }}</span>
                    } @else {
                      <span class="text-muted">—</span>
                    }
                  </td>
                  <td class="time-cell">{{ l.printedAt | date:'dd MMM yyyy, h:mm a':'Asia/Kathmandu' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="pagination">
          <button class="btn-secondary btn-sm" (click)="prevPage()" [disabled]="page() === 0">
            <i class="bi bi-chevron-left"></i> Prev
          </button>
          <span class="page-info">Page {{ page() + 1 }}</span>
          <button class="btn-secondary btn-sm" (click)="nextPage()" [disabled]="logs().length < pageSize">
            Next <i class="bi bi-chevron-right"></i>
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .filter-bar { display:flex; align-items:flex-end; gap:1rem; margin-bottom:1.5rem; flex-wrap:wrap; }
    .filter-group { display:flex; flex-direction:column; gap:.35rem; label { font-size:.75rem; font-weight:600; color:#64748b; } }
    .input-with-btn { display:flex; gap:.375rem; input { height:36px; border:1px solid #e2e8f0; border-radius:6px; padding:.375rem .625rem; font-size:.85rem; width:140px; } }

    .table-wrap { overflow-x:auto; }
    .data-table { width:100%; border-collapse:collapse; font-size:.85rem; }
    .data-table th { background:#f8fafc; padding:.625rem .75rem; text-align:left; font-size:.72rem; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:#64748b; border-bottom:2px solid #e2e8f0; white-space:nowrap; }
    .data-table td { padding:.625rem .75rem; border-bottom:1px solid #f1f5f9; color:#374151; vertical-align:middle; }
    .data-table tr:hover td { background:#f8fafc; }
    .order-num { font-weight:700; color:#0f172a; font-size:.82rem; }
    .role-badge { display:inline-block; padding:1px 8px; border-radius:999px; font-size:.72rem; font-weight:600; background:#f1f5f9; color:#475569; }
    .time-cell { color:#94a3b8; font-size:.8rem; white-space:nowrap; }
    .text-muted { color:#94a3b8; }

    .pagination { display:flex; align-items:center; gap:.75rem; margin-top:1.25rem; justify-content:center; }
    .page-info { font-size:.85rem; color:#64748b; }
    .btn-sm { padding:.3rem .75rem; font-size:.8rem; }
  `]
})
export class AdminReceiptLogsComponent implements OnInit {
  private receiptSvc = inject(ReceiptService);

  logs        = signal<ReceiptPrintLog[]>([]);
  loading     = signal(true);
  page        = signal(0);
  filterOrderId: number | null = null;

  readonly pageSize = PAGE_SIZE;

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    const orderId = this.filterOrderId ?? undefined;
    this.receiptSvc.getPrintLogs(orderId, PAGE_SIZE, this.page() * PAGE_SIZE).subscribe({
      next: list => { this.logs.set(list); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  applyFilter() { this.page.set(0); this.load(); }

  clearFilter() { this.filterOrderId = null; this.page.set(0); this.load(); }

  prevPage() { if (this.page() > 0) { this.page.update(p => p - 1); this.load(); } }

  nextPage() { this.page.update(p => p + 1); this.load(); }
}
