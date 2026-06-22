import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../../core/services/order.service';
import { PriceRule } from '../../../core/models/order.models';

@Component({
  selector: 'app-admin-price-config',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-price-config.html',
  styleUrl: './admin-price-config.scss',
})
export class AdminPriceConfigComponent implements OnInit {
  private svc = inject(OrderService);

  rules = signal<PriceRule[]>([]);
  loading = signal(true);
  saveMsg = signal<string | null>(null);
  private saveTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit() {
    this.svc.getPriceRulesAdmin().subscribe({
      next: (list) => {
        this.rules.set(list);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  saveRule(rule: PriceRule): void {
    this.svc.upsertPriceRule(rule.ruleKey, rule.value, rule.isActive).subscribe({
      next: () => this.showToast('Saved successfully'),
      error: (e) => this.showToast('Error: ' + (e.error?.message ?? 'Save failed')),
    });
  }

  private showToast(msg: string): void {
    this.saveMsg.set(msg);
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => this.saveMsg.set(null), 2500);
  }
}
