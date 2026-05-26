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
  template: `
    <div class="admin-page">
      <div class="page-header">
        <div>
          <h1>Homepage Sections</h1>
          <p class="page-sub">The FalFul homepage is divided into sections. Use this page to edit the text content of each section, or hide sections you don't want to show.</p>
        </div>
      </div>

      @if (loading()) {
        <div class="empty-state">
          <div class="spinner"></div>
          <p>Loading sections…</p>
        </div>
      } @else {
        <div class="sections-list">
          @for (s of sections(); track s.id) {
            <div class="section-card" [class.section-hidden]="!s.isVisible">
              <div class="section-card-header">
                <div class="section-info">
                  <div class="section-title-row">
                    <span class="section-badge">{{ sectionLabel(s.sectionKey) }}</span>
                    <code class="section-key">{{ s.sectionKey }}</code>
                  </div>
                  <p class="section-desc">{{ sectionDesc(s.sectionKey) }}</p>
                </div>
                <label class="toggle-label compact">
                  <div class="toggle" [class.on]="s.isVisible" (click)="s.isVisible = !s.isVisible">
                    <div class="toggle-thumb"></div>
                  </div>
                  <span>{{ s.isVisible ? 'Visible' : 'Hidden' }}</span>
                </label>
              </div>

              <div class="section-fields" [class.section-fields-dim]="!s.isVisible">
                <div class="form-row">
                  <div class="form-group">
                    <label>Heading / Title</label>
                    <input [(ngModel)]="s.title" placeholder="Main heading for this section" />
                  </div>
                  <div class="form-group">
                    <label>Subheading</label>
                    <input [(ngModel)]="s.subtitle" placeholder="Supporting line below the heading" />
                  </div>
                </div>
                <div class="form-group">
                  <label>Body Content</label>
                  <textarea [(ngModel)]="s.content" rows="3" placeholder="Additional body text (optional, supports HTML)"></textarea>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label>Display Order</label>
                    <input type="number" [(ngModel)]="s.displayOrder" min="0" />
                    <span class="field-hint">Lower = shown higher on the page.</span>
                  </div>
                </div>
              </div>

              <div class="section-footer">
                @if (savingKey() === s.sectionKey) {
                  <span class="saving-text">Saving…</span>
                } @else if (savedKey() === s.sectionKey) {
                  <span class="saved-text">✓ Saved</span>
                }
                <button class="btn-primary btn-sm-action" (click)="save(s)" [disabled]="savingKey() === s.sectionKey">
                  Save Section
                </button>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .page-sub { color: #64748b; margin: .25rem 0 0; font-size: .875rem; }

    .sections-list { display: flex; flex-direction: column; gap: 1rem; max-width: 840px; }

    .section-card {
      background: #fff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden;
      transition: opacity .2s;
      &.section-hidden { opacity: .65; }
    }

    .section-card-header {
      display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem;
      padding: 1.25rem 1.25rem .75rem;
    }

    .section-info { flex: 1; }
    .section-title-row { display: flex; align-items: center; gap: .625rem; margin-bottom: .375rem; }

    .section-badge {
      font-size: .8rem; font-weight: 700; color: #0f172a; background: #f0fdf4;
      border: 1px solid #bbf7d0; padding: 2px 10px; border-radius: 20px;
    }

    .section-key {
      font-size: .75rem; color: #64748b; background: #f8fafc;
      border: 1px solid #e2e8f0; padding: 2px 8px; border-radius: 4px;
    }

    .section-desc { font-size: .8rem; color: #64748b; margin: 0; line-height: 1.5; }

    .section-fields {
      padding: 0 1.25rem 1rem;
      transition: opacity .2s;
      &.section-fields-dim { opacity: .5; pointer-events: none; }
    }

    .section-footer {
      display: flex; align-items: center; justify-content: flex-end; gap: .75rem;
      padding: .75rem 1.25rem; background: #f8fafc; border-top: 1px solid #f1f5f9;
    }

    .saving-text { color: #64748b; font-size: .8rem; }
    .saved-text  { color: #16a34a; font-size: .8rem; font-weight: 600; }

    .btn-sm-action {
      padding: .4rem 1rem; font-size: .8rem;
    }

    .toggle-label.compact { flex-direction: column; align-items: center; gap: .25rem; flex-shrink: 0;
      span { font-size: .7rem; color: #64748b; }
    }
  `]
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
