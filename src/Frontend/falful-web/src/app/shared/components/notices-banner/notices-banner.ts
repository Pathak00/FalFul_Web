import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DiscountService } from '../../../core/services/discount.service';
import { NoticeDto } from '../../../core/models/discount.models';

@Component({
  selector: 'app-notices-banner',
  standalone: true,
  imports: [CommonModule],
  template: `
    @for (n of visible(); track n.id) {
      <div class="notice-banner" [class]="'nb--' + typeClass(n.noticeType)">
        <i class="bi {{ typeIcon(n.noticeType) }}"></i>
        <span class="nb-title">{{ n.title }}</span>
        <span class="nb-msg">{{ n.message }}</span>
        <button class="nb-close" (click)="dismiss(n.id)" aria-label="Dismiss"><i class="bi bi-x-lg"></i></button>
      </div>
    }
  `,
  styles: [`
    .notice-banner {
      display: flex; align-items: center; gap: .75rem; padding: .6rem 1.25rem;
      font-size: .85rem;
      i.bi:first-child { font-size: 1rem; flex-shrink: 0; }
    }
    .nb--info    { background: #dbeafe; color: #1d4ed8; }
    .nb--warning { background: #fef3c7; color: #92400e; }
    .nb--success { background: #dcfce7; color: #15803d; }
    .nb--error   { background: #fee2e2; color: #b91c1c; }
    .nb-title { font-weight: 700; flex-shrink: 0; }
    .nb-msg   { flex: 1; opacity: .9; }
    .nb-close { background: none; border: none; cursor: pointer; color: inherit; opacity: .7;
      padding: 0 .25rem; margin-left: auto; flex-shrink: 0;
      &:hover { opacity: 1; }
    }
  `]
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
