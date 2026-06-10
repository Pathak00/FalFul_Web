import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DiscountService } from '../../../core/services/discount.service';
import { NoticeDto } from '../../../core/models/discount.models';

@Component({
  selector: 'app-notices-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notices-banner.html',
  styleUrl: './notices-banner.scss'
})
export class NoticesBannerComponent implements OnInit {
  private discountSvc = inject(DiscountService);

  notices   = signal<NoticeDto[]>([]);
  dismissed = signal<Set<number>>(new Set());

  // Only text notices here — image notices are shown as popups in the home component
  readonly visible = () =>
    this.notices().filter(n => !n.imageUrl && !this.dismissed().has(n.id));

  ngOnInit() {
    this.discountSvc.getActiveNotices().subscribe({
      next: list => this.notices.set(list),
      error: () => {}
    });
  }

  dismiss(id: number) {
    this.dismissed.update(s => new Set([...s, id]));
  }

  typeClass(t: number) { return { 1: 'info', 2: 'warning', 3: 'success', 4: 'error' }[t] ?? 'info'; }
  typeIcon(t: number)  { return { 1: 'bi-info-circle-fill', 2: 'bi-exclamation-triangle-fill', 3: 'bi-check-circle-fill', 4: 'bi-x-circle-fill' }[t] ?? 'bi-info-circle-fill'; }
}
