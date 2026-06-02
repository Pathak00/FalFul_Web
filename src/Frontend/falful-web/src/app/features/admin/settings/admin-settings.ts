import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../../core/services/order.service';
import { ToastService } from '../../../core/services/toast.service';
import { NepalDatePipe } from '../../../core/pipes/nepal-date.pipe';

interface Setting {
  key:       string;
  value:     string;
  updatedAt: string;
}

const SETTING_META: Record<string, { label: string; description: string; multiline: boolean; category: string }> = {
  cancellation_policy_text: {
    label:       'Cancellation Policy Text',
    description: 'Shown to customers near the cancel button and on the checkout page.',
    multiline:   true,
    category:    'Policies',
  },
  order_lead_time_hours: {
    label:       'Order Lead Time (hours)',
    description: 'Minimum hours between placement and the first available delivery slot for regular orders.',
    multiline:   false,
    category:    'Scheduling',
  },
  cut_fruit_lead_time_hours: {
    label:       'Cut-Fruit Lead Time (hours)',
    description: 'Minimum hours for cut-fruit (Build Your Bowl) orders.',
    multiline:   false,
    category:    'Scheduling',
  },
  delivery_slot_start_hour: {
    label:       'Delivery Window Start (24h)',
    description: 'Hour when delivery slots begin each day. E.g. 9 = 9:00 AM Nepal Time.',
    multiline:   false,
    category:    'Scheduling',
  },
  delivery_slot_end_hour: {
    label:       'Delivery Window End (24h)',
    description: 'Hour when delivery slots end each day. E.g. 21 = 9:00 PM Nepal Time.',
    multiline:   false,
    category:    'Scheduling',
  },
  slot_interval_minutes: {
    label:       'Slot Interval (minutes)',
    description: 'Duration of each time slot in minutes. E.g. 60 = 1-hour slots, 120 = 2-hour slots.',
    multiline:   false,
    category:    'Scheduling',
  },
  store_latitude: {
    label:       'Store Latitude',
    description: 'GPS latitude of the store location. Used for cut-fruit radius validation.',
    multiline:   false,
    category:    'Delivery Radius',
  },
  store_longitude: {
    label:       'Store Longitude',
    description: 'GPS longitude of the store location.',
    multiline:   false,
    category:    'Delivery Radius',
  },
  cut_fruit_delivery_radius_km: {
    label:       'Cut-Fruit Radius (km)',
    description: 'Max distance from the store for cut-fruit delivery. Set to 0 to disable.',
    multiline:   false,
    category:    'Delivery Radius',
  },

  // ── Homepage Stats ──────────────────────────────────────────────────────────
  homepage_stat_1_value: {
    label:       'Stat 1 – Value',
    description: 'Numeric value for the first stat counter (e.g. 2400). Used for the count-up animation.',
    multiline:   false,
    category:    'Homepage Stats',
  },
  homepage_stat_1_suffix: {
    label:       'Stat 1 – Suffix',
    description: 'Text appended after the number (e.g. "+", "k+", or leave blank).',
    multiline:   false,
    category:    'Homepage Stats',
  },
  homepage_stat_1_label: {
    label:       'Stat 1 – Label',
    description: 'Descriptive label shown below the number (e.g. "Happy Customers").',
    multiline:   false,
    category:    'Homepage Stats',
  },
  homepage_stat_2_value: {
    label:       'Stat 2 – Value',
    description: 'Numeric value for the second stat counter (e.g. 15).',
    multiline:   false,
    category:    'Homepage Stats',
  },
  homepage_stat_2_suffix: {
    label:       'Stat 2 – Suffix',
    description: 'Text appended after the number (e.g. "k+").',
    multiline:   false,
    category:    'Homepage Stats',
  },
  homepage_stat_2_label: {
    label:       'Stat 2 – Label',
    description: 'Descriptive label (e.g. "Orders Delivered").',
    multiline:   false,
    category:    'Homepage Stats',
  },
  homepage_stat_3_value: {
    label:       'Stat 3 – Value',
    description: 'Numeric value for the third stat counter (e.g. 50).',
    multiline:   false,
    category:    'Homepage Stats',
  },
  homepage_stat_3_suffix: {
    label:       'Stat 3 – Suffix',
    description: 'Text appended after the number (e.g. "+").',
    multiline:   false,
    category:    'Homepage Stats',
  },
  homepage_stat_3_label: {
    label:       'Stat 3 – Label',
    description: 'Descriptive label (e.g. "Fruit Varieties").',
    multiline:   false,
    category:    'Homepage Stats',
  },
  homepage_stat_4_value: {
    label:       'Stat 4 – Value',
    description: 'Numeric value for the fourth stat counter (e.g. 5).',
    multiline:   false,
    category:    'Homepage Stats',
  },
  homepage_stat_4_suffix: {
    label:       'Stat 4 – Suffix',
    description: 'Text appended after the number (leave blank if none).',
    multiline:   false,
    category:    'Homepage Stats',
  },
  homepage_stat_4_label: {
    label:       'Stat 4 – Label',
    description: 'Descriptive label (e.g. "Cities Covered").',
    multiline:   false,
    category:    'Homepage Stats',
  },
};

const CATEGORY_ICONS: Record<string, string> = {
  'Policies':        'bi-file-text',
  'Scheduling':      'bi-clock',
  'Delivery Radius': 'bi-geo-alt',
  'Homepage Stats':  'bi-bar-chart-line',
};

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, NepalDatePipe],
  styleUrl: '../admin-shared.scss',
  template: `
    <div class="admin-page settings-page">
      <div class="page-header">
        <div>
          <h1>App Settings</h1>
          <p class="page-sub">Configure scheduling, policies, and delivery parameters. Changes take effect immediately.</p>
        </div>
      </div>

      @if (loading()) {
        <div class="loading-state"><div class="spinner"></div> Loading settings…</div>
      } @else if (settings().length === 0) {
        <div class="empty-state">
          <i class="bi bi-gear empty-icon"></i>
          <p>No configurable settings found.</p>
        </div>
      } @else {
        <div class="settings-groups">
          @for (group of groupedSettings(); track group.category) {
            <div class="card settings-card">
              <div class="card-header settings-group-header">
                <i class="bi {{ categoryIcon(group.category) }} group-icon"></i>
                <h2>{{ group.category }}</h2>
              </div>
              <div class="settings-list">
                @for (s of group.settings; track s.key) {
                  <div class="setting-row" [class.editing]="editingKey() === s.key">
                    <div class="setting-meta">
                      <span class="setting-label">{{ meta(s.key).label }}</span>
                      <span class="setting-desc">{{ meta(s.key).description }}</span>
                      <span class="setting-updated">Updated {{ s.updatedAt | nepalDate }} NPT</span>
                    </div>

                    @if (editingKey() === s.key) {
                      <div class="setting-editor">
                        @if (meta(s.key).multiline) {
                          <textarea class="form-control" [(ngModel)]="editValue" rows="4"></textarea>
                        } @else {
                          <input class="form-control" type="text" [(ngModel)]="editValue" />
                        }
                        <div class="setting-actions">
                          <button class="btn btn-ghost btn-sm" (click)="cancelEdit()">Cancel</button>
                          <button class="btn btn-primary btn-sm" [disabled]="saving() || !editValue.trim()" (click)="save(s.key)">
                            @if (saving()) { <i class="bi bi-arrow-repeat spin"></i> Saving… }
                            @else { <i class="bi bi-check-lg"></i> Save }
                          </button>
                        </div>
                      </div>
                    } @else {
                      <div class="setting-value-row">
                        <p class="setting-value">{{ s.value }}</p>
                        <button class="btn btn-xs btn-ghost" (click)="startEdit(s)">
                          <i class="bi bi-pencil"></i> Edit
                        </button>
                      </div>
                    }
                  </div>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .settings-page { max-width: 780px; }
    .settings-groups { display: flex; flex-direction: column; gap: 1.5rem; }

    .card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
    .card-header { display: flex; align-items: center; justify-content: space-between; padding: .875rem 1.25rem; border-bottom: 1px solid #f1f5f9; background: #f8fafc; h2 { margin: 0; font-size: .875rem; font-weight: 700; color: #0f172a; } }

    .settings-card .card-header { padding: .875rem 1.25rem; }
    .settings-group-header { display: flex; align-items: center; gap: .5rem; h2 { font-size: .875rem; font-weight: 700; margin: 0; } }
    .group-icon { color: #16a34a; font-size: 1rem; }

    .settings-list { display: flex; flex-direction: column; }

    .setting-row {
      padding: 1rem 1.25rem; border-top: 1px solid #f1f5f9; transition: background .1s;
      &:first-child { border-top: none; }
      &.editing { background: rgba(22,163,74,.04); border-left: 3px solid #16a34a; padding-left: calc(1.25rem - 3px); }
    }

    .setting-meta { margin-bottom: .5rem; }
    .setting-label { display: block; font-weight: 600; font-size: .875rem; color: #111827; }
    .setting-desc  { display: block; font-size: .78rem; color: #6b7280; margin-top: .15rem; }
    .setting-updated { display: block; font-size: .68rem; color: #9ca3af; margin-top: .2rem; }

    .setting-value-row { display: flex; align-items: flex-start; gap: 1rem; }
    .setting-value { flex: 1; margin: 0; font-size: .875rem; color: #374151; line-height: 1.5; white-space: pre-wrap; background: #f8fafc; border: 1px solid #f1f5f9; border-radius: 6px; padding: .4rem .625rem; min-height: 2rem; }

    .setting-editor { display: flex; flex-direction: column; gap: .5rem; }
    .setting-actions { display: flex; justify-content: flex-end; gap: .5rem; }
    .form-control {
      width: 100%; box-sizing: border-box; border: 1px solid #d1d5db; border-radius: 7px;
      padding: .5rem .75rem; font-size: .875rem; color: #0f172a; font-family: inherit;
      background: #fff; outline: none; transition: border-color .15s, box-shadow .15s;
      resize: vertical;
      &:focus { border-color: #16a34a; box-shadow: 0 0 0 3px rgba(22,163,74,.1); }
    }

    .btn-xs { font-size: .7rem; padding: .2rem .5rem; }

    @keyframes spin { to { transform: rotate(360deg); } }
    .spin { display: inline-block; animation: spin .7s linear infinite; }
  `]
})
export class AdminSettingsComponent implements OnInit {
  private svc   = inject(OrderService);
  private toast = inject(ToastService);

  settings   = signal<Setting[]>([]);
  loading    = signal(true);
  saving     = signal(false);
  editingKey = signal<string | null>(null);
  editValue  = '';

  readonly groupedSettings = computed(() => {
    const map = new Map<string, { category: string; settings: Setting[] }>();
    for (const s of this.settings()) {
      const cat = SETTING_META[s.key]?.category ?? 'Other';
      if (!map.has(cat)) map.set(cat, { category: cat, settings: [] });
      map.get(cat)!.settings.push(s);
    }
    return [...map.values()];
  });

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.svc.getAllAdminSettings().subscribe({
      next: list => { this.settings.set(list); this.loading.set(false); },
      error: ()  => this.loading.set(false),
    });
  }

  meta(key: string) {
    return SETTING_META[key] ?? { label: key, description: '', multiline: false, category: 'Other' };
  }

  categoryIcon(cat: string): string {
    return CATEGORY_ICONS[cat] ?? 'bi-gear';
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
        const val = this.editValue.trim();
        this.settings.update(list => list.map(s =>
          s.key === key ? { ...s, value: val, updatedAt: new Date().toISOString() } : s
        ));
        this.editingKey.set(null);
        this.saving.set(false);
        this.toast.success('Setting saved.');
      },
      error: (e: { error?: { message?: string } }) => {
        this.saving.set(false);
        this.toast.error(e?.error?.message ?? 'Failed to save setting.');
      },
    });
  }
}
