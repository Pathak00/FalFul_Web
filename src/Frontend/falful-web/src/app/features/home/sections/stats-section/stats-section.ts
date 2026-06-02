import { Component, Input, OnInit, inject } from '@angular/core';
import { HomepageSection } from '../../../../core/models/cms.models';
import { ApiService } from '../../../../core/services/api.service';

interface Stat { value: number; suffix: string; label: string; icon: string; }

const STAT_ICONS = ['😊', '📦', '🍑', '🏙️'];

const DEFAULTS: Stat[] = [
  { value: 2400, suffix: '+',  label: 'Happy Customers',  icon: '😊' },
  { value: 15,   suffix: 'k+', label: 'Orders Delivered', icon: '📦' },
  { value: 50,   suffix: '+',  label: 'Fruit Varieties',  icon: '🍑' },
  { value: 5,    suffix: '',   label: 'Cities Covered',   icon: '🏙️' },
];

@Component({
  selector: 'app-stats-section',
  standalone: true,
  templateUrl: './stats-section.html',
  styleUrl: './stats-section.scss'
})
export class StatsSectionComponent implements OnInit {
  @Input() sectionData: HomepageSection | undefined;

  private api = inject(ApiService);

  stats: Stat[] = DEFAULTS;

  // Initialise with real fallback values — never shows 0 on load
  displayValues: string[] = DEFAULTS.map(s => s.value + s.suffix);

  ngOnInit(): void {
    this.api.get<{ value: number; suffix: string; label: string }[]>(
      '/api/settings/homepage-stats'
    ).subscribe({
      next: data => {
        this.stats = data.map((s, i) => ({
          value:  s.value,
          suffix: s.suffix,
          label:  s.label,
          icon:   STAT_ICONS[i] ?? '⭐',
        }));
        // Show final values immediately, then animate up from 0
        this.displayValues = this.stats.map(s => s.value + s.suffix);
        this.animateCounters();
      },
      // On error keep the defaults already displayed
    });
  }

  private animateCounters(): void {
    this.stats.forEach((stat, i) => {
      const duration  = 1400;
      const steps     = 55;
      const increment = stat.value / steps;
      let step = 0;

      const timer = setInterval(() => {
        step++;
        const current = Math.min(Math.round(increment * step), stat.value);
        this.displayValues[i] = current + stat.suffix;
        if (step >= steps) clearInterval(timer);
      }, duration / steps);
    });
  }
}
