import { Component, HostListener, OnInit, signal } from '@angular/core';
import { NgStyle } from '@angular/common';

@Component({
  selector: 'app-cursor',
  standalone: true,
  imports: [NgStyle],
  template: `
    @if (visible()) {
      <div class="cursor-outer"
           [ngStyle]="{ transform: 'translate(' + outerX() + 'px, ' + outerY() + 'px)', width: hovered() ? '56px' : '40px', height: hovered() ? '56px' : '40px' }">
      </div>
      <div class="cursor-dot"
           [ngStyle]="{ transform: 'translate(' + dotX() + 'px, ' + dotY() + 'px)' }">
      </div>
    }
  `,
  styleUrl: './cursor.scss',
})
export class CursorComponent implements OnInit {
  visible  = signal(false);
  hovered  = signal(false);

  dotX   = signal(0);
  dotY   = signal(0);
  outerX = signal(0);
  outerY = signal(0);

  private outerLerpX = 0;
  private outerLerpY = 0;
  private rafId = 0;
  private isMobile = false;

  ngOnInit(): void {
    this.isMobile = window.matchMedia('(pointer: coarse)').matches;
    if (this.isMobile) return;
    this.startLerp();
  }

  @HostListener('window:mousemove', ['$event'])
  onMouseMove(e: MouseEvent): void {
    if (this.isMobile) return;
    this.visible.set(true);
    this.dotX.set(e.clientX - 4);
    this.dotY.set(e.clientY - 4);
    this.outerLerpX = e.clientX - 20;
    this.outerLerpY = e.clientY - 20;
  }

  @HostListener('window:mouseleave')
  onMouseLeave(): void { this.visible.set(false); }

  @HostListener('document:mouseenter')
  onDocumentEnter(): void { if (!this.isMobile) this.visible.set(true); }

  @HostListener('document:mouseover', ['$event'])
  onHoverIn(e: MouseEvent): void {
    const el = e.target as HTMLElement;
    this.hovered.set(!!(el.closest('a, button, [role="button"], input, textarea, select, label')));
  }

  private startLerp(): void {
    const tick = () => {
      const factor = 0.12;
      const cx = this.outerX();
      const cy = this.outerY();
      const nx = cx + (this.outerLerpX - cx) * factor;
      const ny = cy + (this.outerLerpY - cy) * factor;
      if (Math.abs(nx - cx) > 0.05 || Math.abs(ny - cy) > 0.05) {
        this.outerX.set(nx);
        this.outerY.set(ny);
      }
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }
}
