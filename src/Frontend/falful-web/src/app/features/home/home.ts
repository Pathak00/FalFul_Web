import { Component, inject, OnInit, signal } from '@angular/core';
import { HomepageSection } from '../../core/models/cms.models';
import { CmsService } from '../../core/services/cms.service';
import { FeaturesSectionComponent } from './sections/features-section/features-section';
import { HeroSectionComponent } from './sections/hero-section/hero-section';
import { HowItWorksComponent } from './sections/how-it-works/how-it-works';
import { ProductShowcaseComponent } from './sections/product-showcase/product-showcase';
import { PromoSectionComponent } from './sections/promo-section/promo-section';
import { StatsSectionComponent } from './sections/stats-section/stats-section';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    HeroSectionComponent,
    FeaturesSectionComponent,
    ProductShowcaseComponent,
    HowItWorksComponent,
    StatsSectionComponent,
    PromoSectionComponent,
  ],
  template: `
    @if (show('hero'))     { <app-hero-section     [sectionData]="get('hero')"     /> }
    @if (show('features')) { <app-features-section [sectionData]="get('features')" /> }
    @if (show('products')) { <app-product-showcase [sectionData]="get('products')" /> }
    @if (show('how'))      { <app-how-it-works     [sectionData]="get('how')"      /> }
    @if (show('stats'))    { <app-stats-section    [sectionData]="get('stats')"    /> }
    @if (show('promo'))    { <app-promo-section    [sectionData]="get('promo')"    /> }
  `
})
export class HomeComponent implements OnInit {
  private cms = inject(CmsService);

  private sectionsMap = signal<Map<string, HomepageSection>>(new Map());
  private loaded = signal(false);

  /** Returns section data if available */
  get(key: string): HomepageSection | undefined {
    return this.sectionsMap().get(key);
  }

  /** Show section if not yet loaded (default visible) OR if key is in visible set */
  show(key: string): boolean {
    return !this.loaded() || this.sectionsMap().has(key);
  }

  ngOnInit() {
    this.cms.getVisibleSections().subscribe({
      next: sections => {
        this.sectionsMap.set(new Map(sections.map(s => [s.sectionKey, s])));
        this.loaded.set(true);
      },
      error: () => this.loaded.set(true) // on error, keep all sections visible
    });
  }
}
