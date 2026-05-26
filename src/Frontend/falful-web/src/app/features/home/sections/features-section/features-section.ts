import { Component } from '@angular/core';
import { ScrollAnimateDirective } from '../../../../shared/directives/scroll-animate.directive';

@Component({
  selector: 'app-features-section',
  standalone: true,
  imports: [ScrollAnimateDirective],
  templateUrl: './features-section.html',
  styleUrl: './features-section.scss'
})
export class FeaturesSectionComponent {
  features = [
    { icon: '🚚', title: 'Same-Day Delivery', desc: 'Order before noon, receive by evening in Kathmandu Valley.' },
    { icon: '⚖️',  title: 'Buy by the KG',    desc: 'Order exactly what you need — no waste, no compromise.' },
    { icon: '✂️',  title: 'Cut & Ready',       desc: 'Pre-cut and prepped fruits, ready to eat on arrival.' },
    { icon: '🎁',  title: 'Custom Boxes',      desc: 'Build your own mix — choose any fruits, any quantity.' },
    { icon: '🌿',  title: '100% Organic',      desc: 'Sourced directly from verified local and regional farms.' },
    { icon: '🔄',  title: 'Easy Reorder',      desc: 'Save your favourites and reorder in one tap.' },
  ];
}
