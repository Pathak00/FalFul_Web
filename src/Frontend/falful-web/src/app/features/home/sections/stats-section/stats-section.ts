import { Component, ElementRef, Input, OnDestroy, OnInit } from '@angular/core';
import { HomepageSection } from '../../../../core/models/cms.models';

interface Stat { value: number; suffix: string; label: string; icon: string; }

@Component({
  selector: 'app-stats-section',
  standalone: true,
  templateUrl: './stats-section.html',
  styleUrl: './stats-section.scss'
})
export class StatsSectionComponent implements OnInit, OnDestroy {
  @Input() sectionData: HomepageSection | undefined;

  stats: Stat[] = [
    { value: 2400, suffix: '+', label: 'Happy Customers',  icon: '😊' },
    { value: 15,   suffix: 'k+', label: 'Orders Delivered', icon: '📦' },
    { value: 50,   suffix: '+', label: 'Fruit Varieties',   icon: '🍑' },
    { value: 5,    suffix: '',  label: 'Cities Covered',    icon: '🏙️' },
  ];

  displayValues: string[] = [];

  private observer!: IntersectionObserver;
  private animated = false;

  constructor(private el: ElementRef) {
    this.displayValues = this.stats.map(() => '0');
  }

  ngOnInit(): void {
    this.observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !this.animated) {
          this.animated = true;
          this.animateCounters();
        }
      },
      { threshold: 0.4 }
    );
    this.observer.observe(this.el.nativeElement);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  private animateCounters(): void {
    this.stats.forEach((stat, i) => {
      const duration = 1600;
      const steps = 60;
      const increment = stat.value / steps;
      let current = 0;
      let step = 0;

      const timer = setInterval(() => {
        step++;
        current = Math.min(Math.round(increment * step), stat.value);
        this.displayValues[i] = current + stat.suffix;
        if (step >= steps) clearInterval(timer);
      }, duration / steps);
    });
  }
}
