import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HomepageSection } from '../../../core/models/cms.models';
import { CmsService } from '../../../core/services/cms.service';

@Component({
  selector: 'app-admin-sections',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="admin-page">
      <div class="page-header">
        <h1>Homepage Sections</h1>
      </div>
      <p class="page-desc">Edit or toggle visibility of homepage content sections.</p>

      @if (loading()) {
        <p class="loading-text">Loading…</p>
      } @else {
        <div class="sections-grid">
          @for (s of sections(); track s.id) {
            <div class="section-card" [class.section-hidden]="!s.isVisible">
              <div class="section-card-header">
                <span class="section-key">{{ s.sectionKey }}</span>
                <span class="badge" [class.badge-green]="s.isVisible" [class.badge-gray]="!s.isVisible">
                  {{ s.isVisible ? 'Visible' : 'Hidden' }}
                </span>
              </div>

              <div class="form-group">
                <label>Title</label>
                <input [(ngModel)]="s.title" />
              </div>
              <div class="form-group">
                <label>Subtitle</label>
                <input [(ngModel)]="s.subtitle" />
              </div>
              <div class="form-group">
                <label>Content</label>
                <textarea [(ngModel)]="s.content" rows="3"></textarea>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Display Order</label>
                  <input type="number" [(ngModel)]="s.displayOrder" />
                </div>
                <label class="checkbox-label" style="align-self:flex-end;margin-bottom:.75rem">
                  <input type="checkbox" [(ngModel)]="s.isVisible" /> Visible
                </label>
              </div>

              @if (savingKey() === s.sectionKey) {
                <p class="saving-text">Saving…</p>
              } @else if (savedKey() === s.sectionKey) {
                <p class="saved-text">Saved!</p>
              }

              <button class="btn-primary" (click)="save(s)" [disabled]="savingKey() === s.sectionKey">
                Save Section
              </button>
            </div>
          }
        </div>
      }
    </div>
  `,
  styleUrl: '../admin-shared.scss',
  styles: [`
    .page-desc { color: #64748b; margin: -.5rem 0 1.5rem; font-size: .875rem; }
    .sections-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 1.25rem; }
    .section-card { background: #fff; border-radius: 10px; padding: 1.25rem; border: 1px solid #e2e8f0; display: flex; flex-direction: column; gap: .75rem; }
    .section-card.section-hidden { opacity: .6; }
    .section-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: .25rem; }
    .section-key { font-family: monospace; font-size: .8rem; background: #f1f5f9; padding: 2px 8px; border-radius: 4px; color: #334155; }
    .saving-text { color: #64748b; font-size: .8rem; margin: 0; }
    .saved-text { color: #16a34a; font-size: .8rem; margin: 0; }
  `]
})
export class AdminSectionsComponent implements OnInit {
  private cms = inject(CmsService);

  sections = signal<HomepageSection[]>([]);
  loading = signal(true);
  savingKey = signal('');
  savedKey = signal('');

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.cms.getSections().subscribe({
      next: s => { this.sections.set(s); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  save(s: HomepageSection) {
    this.savingKey.set(s.sectionKey);
    this.savedKey.set('');
    this.cms.upsertSection({
      sectionKey: s.sectionKey, title: s.title, subtitle: s.subtitle,
      content: s.content, isVisible: s.isVisible, displayOrder: s.displayOrder
    }).subscribe({
      next: () => { this.savingKey.set(''); this.savedKey.set(s.sectionKey); setTimeout(() => this.savedKey.set(''), 2000); },
      error: () => this.savingKey.set('')
    });
  }
}
