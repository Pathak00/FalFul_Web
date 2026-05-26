import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ScrollAnimateDirective } from '../../../../shared/directives/scroll-animate.directive';

@Component({
  selector: 'app-how-it-works',
  standalone: true,
  imports: [RouterLink, ScrollAnimateDirective],
  templateUrl: './how-it-works.html',
  styleUrl: './how-it-works.scss'
})
export class HowItWorksComponent {
  steps = [
    { num: '01', icon: '🔍', title: 'Browse & Select', desc: 'Explore our fresh catalogue. Filter by type, season, or price. Every item is in stock and ready.' },
    { num: '02', icon: '🛒', title: 'Customise Your Order', desc: 'Choose weight, cut style, or build a custom box. Add delivery instructions or schedule for later.' },
    { num: '03', icon: '💳', title: 'Pay Securely', desc: 'Pay via eSewa, Khalti, card, or cash on delivery. All transactions are fully encrypted.' },
    { num: '04', icon: '🚀', title: 'Get It Fresh', desc: 'Your order is packed and dispatched the same day. Track it live right to your door.' },
  ];
}
