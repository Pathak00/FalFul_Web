import { Component } from '@angular/core';
import { HeroSectionComponent } from './sections/hero-section/hero-section';
import { FeaturesSectionComponent } from './sections/features-section/features-section';
import { ProductShowcaseComponent } from './sections/product-showcase/product-showcase';
import { HowItWorksComponent } from './sections/how-it-works/how-it-works';
import { StatsSectionComponent } from './sections/stats-section/stats-section';
import { PromoSectionComponent } from './sections/promo-section/promo-section';

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
    <app-hero-section />
    <app-features-section />
    <app-product-showcase />
    <app-how-it-works />
    <app-stats-section />
    <app-promo-section />
  `
})
export class HomeComponent {}
