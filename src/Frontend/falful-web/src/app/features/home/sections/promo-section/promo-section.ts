import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ScrollAnimateDirective } from '../../../../shared/directives/scroll-animate.directive';

@Component({
  selector: 'app-promo-section',
  standalone: true,
  imports: [RouterLink, ScrollAnimateDirective],
  templateUrl: './promo-section.html',
  styleUrl: './promo-section.scss'
})
export class PromoSectionComponent {
  promos = [
    { emoji: '🥭', title: 'Summer Mango Fest', badge: 'Limited Time', desc: 'Get 20% off all mango varieties this season.', cta: 'Shop Mangoes', color: 'amber' },
    { emoji: '📦', title: 'Free Delivery Weekend', badge: 'This Weekend', desc: 'Zero delivery charges on orders above NPR 500.', cta: 'Order Now', color: 'green' },
  ];
}
