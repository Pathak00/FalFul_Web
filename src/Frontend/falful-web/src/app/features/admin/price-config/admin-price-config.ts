import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../../core/services/order.service';
import { PriceRule } from '../../../core/models/order.models';

@Component({
  selector: 'app-admin-price-config',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrl: '../admin-shared.scss',
  template: `
    <div class="admin-page">
      <div class="page-header">
        <div>
          <h1>Price Configuration</h1>
          <p class="page-sub">Configure delivery fees, service charges, container fees, and order thresholds. Changes take effect immediately on new orders.</p>
        </div>
      </div>

      @if (loading()) {
        <div class="empty-state">
          <div class="skeleton-row"></div><div class="skeleton-row"></div><div class="skeleton-row"></div>
        </div>
      } @else {
        <div class="price-cards">
          @for (rule of rules(); track rule.id) {
            <div class="price-card" [class.inactive]="!rule.isActive">
              <div class="pc-header">
                <div>
                  <span class="pc-name">{{ rule.ruleName }}</span>
                  <span class="pc-key">{{ rule.ruleKey }}</span>
                </div>
                <label class="toggle-switch">
                  <input type="checkbox" [(ngModel)]="rule.isActive" (change)="saveRule(rule)" />
                  <span class="toggle-slider"></span>
                </label>
              </div>
              <div class="pc-body">
                <div class="pc-value-row">
                  <input type="number" [(ngModel)]="rule.value" min="0" step="0.5"
                         class="value-input" (change)="saveRule(rule)" />
                  <span class="unit-badge">{{ rule.unit === 'percent' ? '%' : 'Rs.' }}</span>
                </div>
                @if (rule.updatedAt) {
                  <span class="pc-updated">Last updated: {{ rule.updatedAt | date:'dd MMM yyyy' }}</span>
                }
              </div>
            </div>
          }
        </div>

        @if (saveMsg()) {
          <div class="save-toast" [class.error]="saveMsg()!.startsWith('Error')">
            <i class="bi" [class.bi-check-circle-fill]="!saveMsg()!.startsWith('Error')" [class.bi-exclamation-circle-fill]="saveMsg()!.startsWith('Error')"></i>
            {{ saveMsg() }}
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .price-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; }
    .price-card {
      background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 1.25rem;
      transition: all .2s;
      &.inactive { opacity: .7; }
      &:hover { box-shadow: 0 2px 12px rgba(0,0,0,.06); }
    }
    .pc-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;
      .pc-name { display: block; font-weight: 700; font-size: .9rem; color: #111; }
      .pc-key  { display: block; font-size: .7rem; color: #9ca3af; font-family: monospace; margin-top: 2px; }
    }
    .pc-body .pc-value-row { display: flex; align-items: center; gap: .625rem; }
    .value-input {
      flex: 1; border: 1px solid #d1d5db; border-radius: 8px; padding: .5rem .75rem;
      font-size: 1.1rem; font-weight: 700; color: #111; outline: none; max-width: 120px;
      &:focus { border-color: #16a34a; box-shadow: 0 0 0 3px rgba(22,163,74,.08); }
    }
    .unit-badge { font-size: 1rem; font-weight: 700; color: #6b7280; }
    .pc-updated { display: block; font-size: .7rem; color: #9ca3af; margin-top: .5rem; }

    .toggle-switch { position: relative; display: inline-block; width: 40px; height: 22px; flex-shrink: 0;
      input { opacity: 0; width: 0; height: 0; }
      .toggle-slider { position: absolute; inset: 0; background: #d1d5db; border-radius: 22px; cursor: pointer; transition: .3s;
        &::before { content: ''; position: absolute; width: 16px; height: 16px; left: 3px; bottom: 3px; background: #fff; border-radius: 50%; transition: .3s; }
      }
      input:checked + .toggle-slider { background: #16a34a; }
      input:checked + .toggle-slider::before { transform: translateX(18px); }
    }

    .save-toast {
      position: fixed; bottom: 1.5rem; right: 1.5rem; background: #16a34a; color: #fff;
      padding: .75rem 1.25rem; border-radius: 10px; font-size: .85rem; font-weight: 600;
      display: flex; align-items: center; gap: .5rem; z-index: 999;
      box-shadow: 0 4px 16px rgba(0,0,0,.15); animation: slideUp .25s ease;
      &.error { background: #ef4444; }
    }
    @keyframes slideUp { from { transform: translateY(20px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
  `]
})
export class AdminPriceConfigComponent implements OnInit {
  private svc = inject(OrderService);

  rules   = signal<PriceRule[]>([]);
  loading = signal(true);
  saveMsg = signal<string | null>(null);
  private saveTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit() {
    this.svc.getPriceRulesAdmin().subscribe({
      next: list => { this.rules.set(list); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  saveRule(rule: PriceRule): void {
    this.svc.upsertPriceRule(rule.ruleKey, rule.value, rule.isActive).subscribe({
      next: () => this.showToast('Saved successfully'),
      error: e => this.showToast('Error: ' + (e.error?.message ?? 'Save failed'))
    });
  }

  private showToast(msg: string): void {
    this.saveMsg.set(msg);
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => this.saveMsg.set(null), 2500);
  }
}
