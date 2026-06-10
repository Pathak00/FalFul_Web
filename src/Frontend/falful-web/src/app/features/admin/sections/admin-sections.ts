import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HomepageSection } from '../../../core/models/cms.models';
import { CmsService } from '../../../core/services/cms.service';

const SECTION_INFO: Record<string, { label: string; description: string }> = {
  hero:      { label: 'Hero Banner',       description: 'The large banner at the very top of the homepage with a title, tagline, and call-to-action button.' },
  features:  { label: 'Features',          description: 'The row of cards explaining your key selling points — freshness, delivery speed, etc.' },
  products:  { label: 'Product Showcase',  description: 'A grid of featured products shown on the homepage.' },
  how:       { label: 'How It Works',      description: 'A step-by-step guide explaining the ordering process to new visitors.' },
  stats:     { label: 'Stats / Numbers',   description: 'Animated numbers showing impressive stats like total customers, deliveries, etc.' },
  promo:     { label: 'Promotions',        description: 'Promotional banners and a call-to-action panel at the bottom of the homepage.' },
};

@Component({
  selector: 'app-admin-sections',
  standalone: true,
  imports: [FormsModule],
  styleUrl: '../admin-shared.scss',
  templateUrl: './admin-sections.html',
  styleUrl: './admin-sections.scss'
})
export class AdminSectionsComponent implements OnInit {
  private cms = inject(CmsService);

  sections = signal<HomepageSection[]>([]);
  loading = signal(true);
  savingKey = signal('');
  savedKey = signal('');

  sectionLabel(key: string) { return SECTION_INFO[key]?.label ?? key; }
  sectionDesc(key: string)  { return SECTION_INFO[key]?.description ?? 'Configure this homepage section.'; }

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.cms.getSections().subscribe({ next: s => { this.sections.set(s); this.loading.set(false); }, error: () => this.loading.set(false) });
  }

  save(s: HomepageSection) {
    this.savingKey.set(s.sectionKey);
    this.savedKey.set('');
    this.cms.upsertSection({ sectionKey: s.sectionKey, title: s.title, subtitle: s.subtitle, content: s.content, isVisible: s.isVisible, displayOrder: s.displayOrder }).subscribe({
      next: () => { this.savingKey.set(''); this.savedKey.set(s.sectionKey); setTimeout(() => this.savedKey.set(''), 2500); },
      error: () => this.savingKey.set('')
    });
  }
}
