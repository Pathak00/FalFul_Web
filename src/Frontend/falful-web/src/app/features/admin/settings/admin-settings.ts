import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../../core/services/order.service';
import { NepalDatePipe } from '../../../core/pipes/nepal-date.pipe';

interface Setting {
  key:       string;
  value:     string;
  updatedAt: string;
}

const SETTING_LABELS: Record<string, { label: string; description: string; multiline: boolean; category?: string }> = {
  // ── Policies ──────────────────────────────────────────────────────────────
  cancellation_policy_text: {
    label:       'Cancellation Policy Text',
    description: 'Shown to customers near the cancel button and on the checkout page.',
    multiline:   true,
    category:    'Policies',
  },
  // ── Scheduling ────────────────────────────────────────────────────────────
  order_lead_time_hours: {
    label:       'Order Lead Time (hours)',
    description: 'Minimum hours between when an order is placed and the first available delivery slot for regular orders.',
    multiline:   false,
    category:    'Scheduling',
  },
  cut_fruit_lead_time_hours: {
    label:       'Cut-Fruit Lead Time (hours)',
    description: 'Minimum hours for cut-fruit (Build Your Bowl) orders. Can be shorter than regular orders for nearby delivery.',
    multiline:   false,
    category:    'Scheduling',
  },
  delivery_slot_start_hour: {
    label:       'Delivery Window Start (24h hour)',
    description: 'Hour when delivery slots begin each day. E.g. 9 = 9:00 AM Nepal Time.',
    multiline:   false,
    category:    'Scheduling',
  },
  delivery_slot_end_hour: {
    label:       'Delivery Window End (24h hour)',
    description: 'Hour when delivery slots end each day. E.g. 21 = 9:00 PM Nepal Time.',
    multiline:   false,
    category:    'Scheduling',
  },
  slot_interval_minutes: {
    label:       'Slot Interval (minutes)',
    description: 'Duration of each time slot in minutes. E.g. 180 = 3-hour slots (9–12, 12–3, 3–6, 6–9).',
    multiline:   false,
    category:    'Scheduling',
  },
  // ── Delivery Radius ───────────────────────────────────────────────────────
  store_latitude: {
    label:       'Store Latitude',
    description: 'GPS latitude of the store/business location. Used to calculate customer distance for cut-fruit radius validation.',
    multiline:   false,
    category:    'Delivery Radius',
  },
  store_longitude: {
    label:       'Store Longitude',
    description: 'GPS longitude of the store/business location.',
    multiline:   false,
    category:    'Delivery Radius',
  },
  cut_fruit_delivery_radius_km: {
    label:       'Cut-Fruit Delivery Radius (km)',
    description: 'Maximum distance in km from the store for cut-fruit delivery. Set to 0 to disable radius validation.',
    multiline:   false,
    category:    'Delivery Radius',
  },
};

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, NepalDatePipe],
  styleUrl: '../admin-shared.scss',
  template: `
    <div class="admin-page" style="max-width:800px">
      <div class="page-header">
        <div>
          <h1>App Settings</h1>
          <p class="page-sub">Configure customer-visible text and policies. Changes take effect immediately.</p>
        </div>
      </div>

      @if (loading()) {
        <div class="loading-state"><div class="spin"><i class="bi bi-arrow-clockwise"></i></div> Loading settings…</div>
      } @else if (settings().length === 0) {
        <div class="empty-state">
          <i class="bi bi-gear empty-icon"></i>
          <h3>No settings found</h3>
          <p>No configurable settings are available.</p>
        </div>
      } @else {
        <div style="display:flex;flex-direction:column;gap:1.25rem">
          @for (s of settings(); track s.key) {
            <div class="setting-card" [class.editing]="editingKey() === s.key">
              <div class="sc-header">
                <div class="sc-label-group">
                  <span class="sc-label">{{ settingMeta(s.key).label }}</span>
                  <span class="sc-description">{{ settingMeta(s.key).description }}</span>
                  <span class="sc-updated">Last updated: {{ s.updatedAt | nepalDate }} NPT</span>
                </div>
                @if (editingKey() !== s.key) {
                  <button class="btn-edit btn-sm" (click)="startEdit(s)">
                    <i class="bi bi-pencil"></i> Edit
                  </button>
                }
              </div>

              @if (editingKey() === s.key) {
                <div class="sc-edit-area">
                  @if (settingMeta(s.key).multiline) {
                    <textarea [(ngModel)]="editValue"
                              rows="4"
                              style="width:100%;box-sizing:border-box;border:1px solid #d1d5db;border-radius:8px;padding:.625rem .75rem;font-size:.875rem;font-family:inherit;resize:vertical">
                    </textarea>
                  } @else {
                    <input type="text" [(ngModel)]="editValue"
                           style="width:100%;box-sizing:border-box;border:1px solid #d1d5db;border-radius:8px;padding:.5rem .75rem;font-size:.875rem">
                  }
                  <div class="sc-edit-actions">
                    <button class="btn-secondary btn-sm" (click)="cancelEdit()">Cancel</button>
                    <button class="btn-primary btn-sm" [disabled]="saving() || !editValue.trim()" (click)="save(s.key)">
                      @if (saving()) { <i class="bi bi-arrow-clockwise spin"></i> } Save
                    </button>
                  </div>
                </div>
              } @else {
                <p class="sc-current-value">{{ s.value }}</p>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .setting-card {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.125rem 1.25rem;
      transition: box-shadow .15s;
    }
    .setting-card.editing { border-color: #6366f1; box-shadow: 0 0 0 3px #6366f11a; }
    .sc-header { display: flex; align-items: flex-start; gap: 1rem; justify-content: space-between; }
    .sc-label-group { flex: 1; }
    .sc-label { display: block; font-weight: 700; font-size: .9rem; color: #111; }
    .sc-description { display: block; font-size: .78rem; color: #6b7280; margin-top: .2rem; }
    .sc-updated { display: block; font-size: .7rem; color: #9ca3af; margin-top: .25rem; }
    .sc-current-value { margin: .75rem 0 0; font-size: .875rem; color: #374151; line-height: 1.5; white-space: pre-wrap; background: #f8fafc; border-radius: 6px; padding: .5rem .75rem; }
    .sc-edit-area { margin-top: .75rem; }
    .sc-edit-actions { display: flex; justify-content: flex-end; gap: .5rem; margin-top: .5rem; }
  `]
})
export class AdminSettingsComponent implements OnInit {
  private svc = inject(OrderService);

  settings   = signal<Setting[]>([]);
  loading    = signal(true);
  saving     = signal(false);
  editingKey = signal<string | null>(null);
  editValue  = '';

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.svc.getAllAdminSettings().subscribe({
      next: list => { this.settings.set(list); this.loading.set(false); },
      error: ()  => this.loading.set(false),
    });
  }

  settingMeta(key: string) {
    return SETTING_LABELS[key] ?? { label: key, description: '', multiline: false };
  }

  startEdit(s: Setting) {
    this.editValue = s.value;
    this.editingKey.set(s.key);
  }

  cancelEdit() { this.editingKey.set(null); }

  save(key: string) {
    if (!this.editValue.trim()) return;
    this.saving.set(true);
    this.svc.updateAdminSetting(key, this.editValue.trim()).subscribe({
      next: () => {
        this.settings.update(list => list.map(s => s.key === key ? { ...s, value: this.editValue.trim(), updatedAt: new Date().toISOString() } : s));
        this.editingKey.set(null);
        this.saving.set(false);
      },
      error: () => this.saving.set(false),
    });
  }
}
