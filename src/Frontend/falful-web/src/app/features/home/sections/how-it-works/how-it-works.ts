import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HomepageSection } from '../../../../core/models/cms.models';
import { ScrollAnimateDirective } from '../../../../shared/directives/scroll-animate.directive';

@Component({
  selector: 'app-how-it-works',
  standalone: true,
  imports: [RouterLink, ScrollAnimateDirective],
  templateUrl: './how-it-works.html',
  styleUrl: './how-it-works.scss'
})
export class HowItWorksComponent {
  @Input() sectionData: HomepageSection | undefined;

  journey = [
    { num: '01', icon: '🌱', label: 'Orchard',    title: 'Farm Selection',      desc: 'Hand-selected partner farms across Nepal & India, verified for quality.' },
    { num: '02', icon: '🧺', label: 'Harvest',    title: 'Picked at Peak',       desc: 'Harvested at peak ripeness within 24 hours of your order placement.' },
    { num: '03', icon: '🏭', label: 'Sorting',    title: 'Quality Graded',       desc: 'Inspected, graded, and chilled to lock in flavour and freshness.' },
    { num: '04', icon: '📦', label: 'Packing',    title: 'Eco Packaging',        desc: 'Zero plastic — 100% compostable materials protect every piece.' },
    { num: '05', icon: '🚚', label: 'Dispatch',   title: 'Cold-Chain Express',   desc: 'Temperature-controlled logistics ensure nothing wilts in transit.' },
    { num: '06', icon: '🍽️', label: 'Your Table', title: 'Grove to Door',        desc: 'Delivered within 48 hours of harvest. Taste the difference.' },
  ];
}
