import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomepageSection } from '../../core/models/cms.models';
import { NoticeDto } from '../../core/models/discount.models';
import { CmsService } from '../../core/services/cms.service';
import { DiscountService } from '../../core/services/discount.service';
import { HowItWorksComponent } from './sections/how-it-works/how-it-works';
import { ProductShowcaseComponent } from './sections/product-showcase/product-showcase';
import { PromoSectionComponent } from './sections/promo-section/promo-section';
import { StatsSectionComponent } from './sections/stats-section/stats-section';
import { ImageUrlService } from '../../core/services/image-url.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    ProductShowcaseComponent,
    HowItWorksComponent,
    StatsSectionComponent,
    PromoSectionComponent,
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class HomeComponent implements OnInit {
  private cms         = inject(CmsService);
  private discountSvc = inject(DiscountService);
  protected imgSvc    = inject(ImageUrlService);

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
    return this.imgSvc.resolve(url);
  }
}
