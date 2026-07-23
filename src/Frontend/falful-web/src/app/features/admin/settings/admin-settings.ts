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

  // ── Contact ─────────────────────────────────────────────────────────────────
  contact_email: {
    label:       'Contact Form Recipient',
    description: 'Email address where contact-form submissions are delivered. Defaults to the app sender address if left blank.',
    multiline:   false,
    category:    'Contact',
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
  'Contact':         'bi-envelope',
};

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, NepalDatePipe],
  styleUrls: ['../admin-shared.scss', './admin-settings.scss'],
  templateUrl: './admin-settings.html'
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
    const existingKeys = new Set(this.settings().map(s => s.key));

    // Include placeholder rows for known settings not yet in the database
    const allSettings: Setting[] = [...this.settings()];
    for (const key of Object.keys(SETTING_META)) {
      if (!existingKeys.has(key)) {
        allSettings.push({ key, value: '', updatedAt: '' });
      }
    }

    const map = new Map<string, { category: string; settings: Setting[] }>();
    for (const s of allSettings) {
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
