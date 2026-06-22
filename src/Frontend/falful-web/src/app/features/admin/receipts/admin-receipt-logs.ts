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
  templateUrl: './admin-receipt-logs.html',
  styleUrl: './admin-receipt-logs.scss',
})
export class AdminReceiptLogsComponent implements OnInit {
  private receiptSvc = inject(ReceiptService);

  logs = signal<ReceiptPrintLog[]>([]);
  loading = signal(true);
  page = signal(0);
  filterOrderId: number | null = null;

  readonly pageSize = PAGE_SIZE;

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    const orderId = this.filterOrderId ?? undefined;
    this.receiptSvc.getPrintLogs(orderId, PAGE_SIZE, this.page() * PAGE_SIZE).subscribe({
      next: (list) => {
        this.logs.set(list);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  applyFilter() {
    this.page.set(0);
    this.load();
  }

  clearFilter() {
    this.filterOrderId = null;
    this.page.set(0);
    this.load();
  }

  prevPage() {
    if (this.page() > 0) {
      this.page.update((p) => p - 1);
      this.load();
    }
  }

  nextPage() {
    this.page.update((p) => p + 1);
    this.load();
  }
}
