import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomepageSection } from '../../core/models/cms.models';
import { NoticeDto } from '../../core/models/discount.models';
import { CmsService } from '../../core/services/cms.service';
import { DiscountService } from '../../core/services/discount.service';
import { FeaturesSectionComponent } from './sections/features-section/features-section';
import { HeroSectionComponent } from './sections/hero-section/hero-section';
import { HowItWorksComponent } from './sections/how-it-works/how-it-works';
import { ProductShowcaseComponent } from './sections/product-showcase/product-showcase';
import { PromoSectionComponent } from './sections/promo-section/promo-section';
import { StatsSectionComponent } from './sections/stats-section/stats-section';
import { MarqueeSectionComponent } from './sections/marquee-section/marquee-section';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    HeroSectionComponent,
    FeaturesSectionComponent,
    ProductShowcaseComponent,
    HowItWorksComponent,
    StatsSectionComponent,
    PromoSectionComponent,
    MarqueeSectionComponent,
  ],
  template: `
    @if (show('hero'))     { <app-hero-section     [sectionData]="get('hero')"     /> }
    @if (show('features')) { <app-features-section [sectionData]="get('features')" /> }
    <app-marquee-section />
    @if (show('products')) { <app-product-showcase [sectionData]="get('products')" /> }
    @if (show('how'))      { <app-how-it-works     [sectionData]="get('how')"      /> }
    @if (show('stats'))    { <app-stats-section    [sectionData]="get('stats')"    /> }
    @if (show('promo'))    { <app-promo-section    [sectionData]="get('promo')"    /> }

    <!-- Promotional popup overlay — shows for all visitors on home page load, once per session -->
    @if (popup()) {
      <div class="promo-overlay" (click)="closePopup()">
        <div class="promo-box" (click)="$event.stopPropagation()">
          <button class="promo-close" (click)="closePopup()" aria-label="Close">
            <i class="bi bi-x-lg"></i>
          </button>
          <img [src]="imgUrl(popup()!.imageUrl!)" [alt]="popup()!.title" class="promo-img" />
          @if (popup()!.title || popup()!.message) {
            <div class="promo-body">
              @if (popup()!.title)   { <h3 class="promo-title">{{ popup()!.title }}</h3> }
              @if (popup()!.message) { <p  class="promo-msg">{{ popup()!.message }}</p> }
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    /* ── Promotional popup ──────────────────────────────────── */
    .promo-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,.6); backdrop-filter: blur(2px);
      display: flex; align-items: center; justify-content: center;
      z-index: 2000; padding: 1rem; animation: poFadeIn .3s ease;
    }
    @keyframes poFadeIn { from { opacity: 0 } to { opacity: 1 } }

    .promo-box {
      position: relative; background: #fff; border-radius: 18px;
      overflow: hidden; max-width: 540px; width: 100%;
      box-shadow: 0 24px 80px rgba(0,0,0,.35);
      animation: poSlideUp .35s cubic-bezier(.22,.68,0,1.2);
    }
    @keyframes poSlideUp {
      from { transform: translateY(40px) scale(.96); opacity: 0 }
      to   { transform: translateY(0)    scale(1);   opacity: 1 }
    }

    .promo-close {
      position: absolute; top: .75rem; right: .75rem;
      background: rgba(0,0,0,.5); border: none; border-radius: 50%;
      color: #fff; width: 34px; height: 34px;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; font-size: .95rem; z-index: 1; transition: background .15s;
      &:hover { background: rgba(0,0,0,.75); }
    }

    .promo-img {
      width: 100%; max-height: 360px; object-fit: cover; display: block;
    }

    .promo-body {
      padding: 1.25rem 1.5rem 1.6rem;
      .promo-title { margin: 0 0 .4rem; font-size: 1.15rem; font-weight: 800; color: #0f172a; }
      .promo-msg   { margin: 0; color: #475569; font-size: .9rem; line-height: 1.55; }
    }
  `]
})
export class HomeComponent implements OnInit {
  private cms         = inject(CmsService);
  private discountSvc = inject(DiscountService);
  private readonly apiBase = environment.apiUrl;

  private sectionsMap = signal<Map<string, HomepageSection>>(new Map());
  private loaded = signal(false);

  private popupQueue = signal<NoticeDto[]>([]);
  readonly popup = computed(() => this.popupQueue()[0] ?? null);

  get(key: string): HomepageSection | undefined {
    return this.sectionsMap().get(key);
  }

  show(key: string): boolean {
    return !this.loaded() || this.sectionsMap().has(key);
  }

  ngOnInit() {
    this.cms.getVisibleSections().subscribe({
      next: sections => {
        this.sectionsMap.set(new Map(sections.map(s => [s.sectionKey, s])));
        this.loaded.set(true);
      },
      error: () => this.loaded.set(true)
    });

    this.discountSvc.getActiveNotices().subscribe({
      next: notices => {
        const queue = notices.filter(
          n => !!n.imageUrl && sessionStorage.getItem(`promo_seen_${n.id}`) !== '1'
        );
        this.popupQueue.set(queue);
      },
      error: () => {}
    });
  }

  closePopup() {
    const n = this.popup();
    if (n) sessionStorage.setItem(`promo_seen_${n.id}`, '1');
    this.popupQueue.update(q => q.slice(1));
  }

  imgUrl(url: string): string {
    return url.startsWith('http') ? url : `${this.apiBase}${url}`;
  }
}
