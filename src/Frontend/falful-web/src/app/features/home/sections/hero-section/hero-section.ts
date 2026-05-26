import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HomepageSection } from '../../../../core/models/cms.models';

@Component({
  selector: 'app-hero-section',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './hero-section.html',
  styleUrl: './hero-section.scss'
})
export class HeroSectionComponent {
  @Input() sectionData: HomepageSection | undefined;
}
