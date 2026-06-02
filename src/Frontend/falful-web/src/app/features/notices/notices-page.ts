import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { DiscountService } from '../../core/services/discount.service';
import { NoticeDto } from '../../core/models/discount.models';
import { environment } from '../../../environments/environment';

const TYPE_COLOR: Record<number, string> = { 1: '#2d9348', 2: '#f59e0b', 3: '#16a34a', 4: '#ef4444' };
const TYPE_BG:    Record<number, string> = { 1: '#f0faf3', 2: '#fffbeb', 3: '#dcfce7', 4: '#fef2f2' };
const TYPE_ICON:  Record<number, string> = {
  1: 'bi-info-circle-fill',
  2: 'bi-exclamation-triangle-fill',
  3: 'bi-check-circle-fill',
  4: 'bi-x-circle-fill'
};

interface LightboxState { url: string; safeUrl: SafeResourceUrl; type: 'image' | 'pdf'; title: string; }

@Component({
  selector: 'app-notices-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="np-page">

      <!-- ── Hero ───────────────────────────────────────────── -->
      <div class="np-hero">
        <div class="np-hero-inner">
          <span class="np-eyebrow">
            <i class="bi bi-megaphone-fill"></i> Live Updates
          </span>
          <h1>Promotions &amp; Notices</h1>
          <p>Stay up to date with our latest deals, flash sales, and important announcements.</p>
        </div>
        <div class="np-hero-wave">
          <svg viewBox="0 0 1440 60" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z" fill="#f4f4f5"/>
          </svg>
        </div>
      </div>

      <!-- ── Body ───────────────────────────────────────────── -->
      <div class="np-body">

        @if (loading()) {
          <div class="np-state">
            <div class="np-spinner"></div>
            <span>Loading notices…</span>
          </div>

        } @else if (notices().length === 0) {
          <div class="np-state np-empty">
            <div class="np-empty-icon"><i class="bi bi-megaphone"></i></div>
            <h3>Nothing here right now</h3>
            <p>Check back soon — we'll post flash sales, discount codes, and announcements here.</p>
          </div>

        } @else {
          <div class="np-grid">
            @for (n of notices(); track n.id) {

              @if (n.imageUrl && isPdf(n.imageUrl)) {
                <!-- ── PDF notice ──────────────────────────── -->
                <div class="np-card np-card--pdf" [style.--tc]="typeColor(n.noticeType)">
                  <div class="np-card-pdf-thumb" (click)="openLightbox(n)">
                    <i class="bi bi-file-earmark-pdf-fill"></i>
                    <span class="np-pdf-label">PDF Document</span>
                    <span class="np-pdf-hint">Click to view</span>
                  </div>
                  <div class="np-card-content">
                    <div class="np-meta">
                      <span class="np-badge" [style.background]="typeBg(n.noticeType)" [style.color]="typeColor(n.noticeType)">
                        <i class="bi {{ typeIcon(n.noticeType) }}"></i> {{ n.noticeTypeLabel }}
                      </span>
                      @if (n.endDate) {
                        <span class="np-expiry"><i class="bi bi-clock"></i> Until {{ n.endDate }}</span>
                      }
                    </div>
                    <h2 class="np-card-title">{{ n.title }}</h2>
                    <p class="np-card-msg">{{ n.message }}</p>
                    <button class="np-btn-view" (click)="openLightbox(n)">
                      <i class="bi bi-eye"></i> View PDF
                    </button>
                  </div>
                </div>

              } @else if (n.imageUrl) {
                <!-- ── Image notice ────────────────────────── -->
                <div class="np-card np-card--img" [style.--tc]="typeColor(n.noticeType)">
                  <div class="np-card-thumb" (click)="openLightbox(n)">
                    <img [src]="fileUrl(n.imageUrl)" [alt]="n.title" loading="lazy" />
                    <div class="np-thumb-overlay">
                      <span><i class="bi bi-arrows-fullscreen"></i> View Full</span>
                    </div>
                  </div>
                  <div class="np-card-content">
                    <div class="np-meta">
                      <span class="np-badge" [style.background]="typeBg(n.noticeType)" [style.color]="typeColor(n.noticeType)">
                        <i class="bi {{ typeIcon(n.noticeType) }}"></i> {{ n.noticeTypeLabel }}
                      </span>
                      @if (n.endDate) {
                        <span class="np-expiry"><i class="bi bi-clock"></i> Until {{ n.endDate }}</span>
                      }
                    </div>
                    <h2 class="np-card-title">{{ n.title }}</h2>
                    <p class="np-card-msg">{{ n.message }}</p>
                    <button class="np-btn-view" (click)="openLightbox(n)">
                      <i class="bi bi-arrows-fullscreen"></i> View Full Image
                    </button>
                  </div>
                </div>

              } @else {
                <!-- ── Text-only notice ────────────────────── -->
                <div class="np-card np-card--text" [style.--tc]="typeColor(n.noticeType)" [style.--bg]="typeBg(n.noticeType)">
                  <div class="np-card-text-accent"></div>
                  <div class="np-card-content">
                    <div class="np-meta">
                      <span class="np-badge" [style.background]="typeBg(n.noticeType)" [style.color]="typeColor(n.noticeType)">
                        <i class="bi {{ typeIcon(n.noticeType) }}"></i> {{ n.noticeTypeLabel }}
                      </span>
                      @if (n.endDate) {
                        <span class="np-expiry"><i class="bi bi-clock"></i> Until {{ n.endDate }}</span>
                      }
                    </div>
                    <h2 class="np-card-title">{{ n.title }}</h2>
                    <p class="np-card-msg">{{ n.message }}</p>
                  </div>
                </div>
              }

            }
          </div>
        }

      </div>
    </div>

    <!-- ── Lightbox overlay ──────────────────────────────────── -->
    @if (lightbox()) {
      <div class="lb-overlay" (click)="closeLightbox()">
        <div class="lb-panel" [class.lb-panel--pdf]="lightbox()!.type === 'pdf'" (click)="$event.stopPropagation()">
          <div class="lb-header">
            <span class="lb-title">{{ lightbox()!.title }}</span>
            <div class="lb-actions">
              <a [href]="lightbox()!.url" target="_blank" rel="noopener" class="lb-btn" title="Open in new tab">
                <i class="bi bi-box-arrow-up-right"></i>
              </a>
              <button class="lb-btn lb-btn--close" (click)="closeLightbox()" title="Close">
                <i class="bi bi-x-lg"></i>
              </button>
            </div>
          </div>
          <div class="lb-body">
            @if (lightbox()!.type === 'image') {
              <img [src]="lightbox()!.url" class="lb-img" [alt]="lightbox()!.title" />
            } @else {
              <iframe [src]="lightbox()!.safeUrl" class="lb-pdf" title="PDF viewer"></iframe>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    /* ── Page shell ──────────────────────────────────────────── */
    .np-page { min-height: 70vh; background: var(--gray-100, #f4f4f5); }

    /* ── Hero ────────────────────────────────────────────────── */
    .np-hero {
      background: var(--gradient-hero, linear-gradient(135deg, #0d2e15 0%, #1a5c2a 40%, #2d9348 100%));
      color: #fff; padding: 3.5rem 1.5rem 0; text-align: center; position: relative;
    }
    .np-hero-inner { max-width: 580px; margin: 0 auto; padding-bottom: 3rem; }

    .np-eyebrow {
      display: inline-flex; align-items: center; gap: .4rem;
      background: rgba(255,255,255,.15); border: 1px solid rgba(255,255,255,.25);
      border-radius: 999px; padding: .3rem 1rem;
      font-size: .75rem; font-weight: 700; letter-spacing: .06em;
      text-transform: uppercase; margin-bottom: 1rem;
    }
    .np-hero h1 {
      font-family: var(--font-heading, 'Plus Jakarta Sans', sans-serif);
      font-size: clamp(1.6rem, 4vw, 2.4rem); font-weight: 800; margin: 0 0 .7rem;
    }
    .np-hero p { margin: 0; opacity: .75; font-size: .95rem; line-height: 1.65; }

    .np-hero-wave { display: block; line-height: 0; margin-top: -1px;
      svg { width: 100%; height: 48px; display: block; }
    }

    /* ── Body ────────────────────────────────────────────────── */
    .np-body { max-width: 1060px; margin: 0 auto; padding: 2rem 1.25rem 4rem; }

    /* ── States ──────────────────────────────────────────────── */
    .np-state {
      display: flex; flex-direction: column; align-items: center;
      gap: 1rem; padding: 5rem 2rem; color: var(--gray-500, #71717a);
    }
    .np-spinner {
      width: 38px; height: 38px; border: 3px solid #e4e4e7;
      border-top-color: var(--color-primary, #2d9348);
      border-radius: 50%; animation: spin .7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .np-empty { text-align: center; }
    .np-empty-icon {
      width: 80px; height: 80px; border-radius: 50%;
      background: var(--green-50, #f0faf3); margin: 0 auto 1.25rem;
      display: flex; align-items: center; justify-content: center;
      i { font-size: 2rem; color: var(--color-primary, #2d9348); opacity: .5; }
    }
    .np-empty h3 { margin: 0 0 .5rem; font-size: 1.15rem; color: var(--gray-700, #3f3f46); }
    .np-empty p  { margin: 0; font-size: .9rem; }

    /* ── Grid ────────────────────────────────────────────────── */
    .np-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
      align-items: start;
    }

    /* ── Card base ───────────────────────────────────────────── */
    .np-card {
      background: #fff; border-radius: 14px; overflow: hidden;
      box-shadow: 0 1px 4px rgba(0,0,0,.06), 0 4px 16px rgba(0,0,0,.05);
      border-top: 3px solid var(--tc, var(--color-primary, #2d9348));
      transition: box-shadow .2s, transform .2s;
      display: flex; flex-direction: column;
      &:hover {
        box-shadow: 0 4px 16px rgba(0,0,0,.1), 0 12px 40px rgba(0,0,0,.08);
        transform: translateY(-3px);
      }
    }

    /* ── Image card thumbnail ────────────────────────────────── */
    .np-card-thumb {
      position: relative; overflow: hidden; cursor: pointer;
      aspect-ratio: 16/9; flex-shrink: 0;
      img {
        width: 100%; height: 100%; object-fit: cover; display: block;
        transition: transform .35s ease;
      }
      &:hover img { transform: scale(1.04); }
    }
    .np-thumb-overlay {
      position: absolute; inset: 0;
      background: rgba(0,0,0,0); display: flex; align-items: center;
      justify-content: center; transition: background .2s;
      span {
        background: rgba(0,0,0,.65); color: #fff; border-radius: 999px;
        padding: .35rem .9rem; font-size: .8rem; font-weight: 600;
        display: flex; align-items: center; gap: .35rem;
        opacity: 0; transform: scale(.9); transition: opacity .2s, transform .2s;
      }
    }
    .np-card-thumb:hover .np-thumb-overlay { background: rgba(0,0,0,.18); }
    .np-card-thumb:hover .np-thumb-overlay span { opacity: 1; transform: scale(1); }

    /* ── PDF card thumbnail ──────────────────────────────────── */
    .np-card-pdf-thumb {
      background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: .4rem; padding: 2rem 1rem; cursor: pointer;
      border-bottom: 1px solid #fecaca; transition: background .2s;
      i { font-size: 2.75rem; color: #dc2626; }
      &:hover { background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); }
    }
    .np-pdf-label { font-size: .8rem; font-weight: 700; color: #991b1b; }
    .np-pdf-hint  { font-size: .72rem; color: #b91c1c; opacity: .7; }

    /* ── Shared card content area ────────────────────────────── */
    .np-card-content { padding: 1.1rem 1.25rem 1.3rem; flex: 1; display: flex; flex-direction: column; gap: .5rem; }

    /* Text card left accent bar */
    .np-card--text {
      flex-direction: row;
      .np-card-text-accent {
        width: 4px; flex-shrink: 0; background: var(--tc, #2d9348);
        border-radius: 0 2px 2px 0;
      }
      .np-card-content { padding-left: 1rem; }
    }

    /* ── Card content details ────────────────────────────────── */
    .np-meta { display: flex; flex-wrap: wrap; align-items: center; gap: .45rem; }

    .np-badge {
      display: inline-flex; align-items: center; gap: .28rem;
      font-size: .7rem; font-weight: 700; padding: .22rem .6rem;
      border-radius: 999px; letter-spacing: .02em;
    }
    .np-expiry {
      display: inline-flex; align-items: center; gap: .25rem;
      font-size: .72rem; color: var(--gray-500, #71717a); font-style: italic;
    }

    .np-card-title {
      margin: 0; font-size: 1rem; font-weight: 700;
      font-family: var(--font-heading, sans-serif); color: var(--gray-900, #18181b);
      line-height: 1.35;
    }
    .np-card-msg {
      margin: 0; font-size: .875rem; color: var(--gray-500, #71717a);
      line-height: 1.6; flex: 1;
    }

    .np-btn-view {
      align-self: flex-start; margin-top: .25rem;
      background: none; border: 1.5px solid var(--tc, var(--color-primary, #2d9348));
      color: var(--tc, var(--color-primary, #2d9348));
      border-radius: 999px; padding: .3rem .85rem;
      font-size: .78rem; font-weight: 600; cursor: pointer;
      display: inline-flex; align-items: center; gap: .35rem;
      transition: background .15s, color .15s;
      &:hover { background: var(--tc, #2d9348); color: #fff; }
    }

    /* ── Lightbox ────────────────────────────────────────────── */
    .lb-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,.82);
      backdrop-filter: blur(4px); z-index: 3000;
      display: flex; align-items: center; justify-content: center;
      padding: 1rem; animation: lbFade .2s ease;
    }
    @keyframes lbFade { from { opacity: 0 } to { opacity: 1 } }

    .lb-panel {
      background: #1a1a1a; border-radius: 14px; overflow: hidden;
      max-width: 860px; width: 100%; max-height: 90vh;
      display: flex; flex-direction: column;
      box-shadow: 0 32px 80px rgba(0,0,0,.6);
      animation: lbUp .25s cubic-bezier(.22,.68,0,1.1);
    }
    @keyframes lbUp {
      from { transform: translateY(20px) scale(.97); opacity: 0 }
      to   { transform: translateY(0)    scale(1);   opacity: 1 }
    }
    .lb-panel--pdf { max-width: 960px; }

    .lb-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: .75rem 1rem; background: #111; flex-shrink: 0;
    }
    .lb-title { color: #e2e8f0; font-size: .875rem; font-weight: 600; truncate: ellipsis; overflow: hidden; white-space: nowrap; }

    .lb-actions { display: flex; align-items: center; gap: .4rem; flex-shrink: 0; }
    .lb-btn {
      background: rgba(255,255,255,.1); border: none; border-radius: 8px;
      color: #cbd5e1; width: 34px; height: 34px;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; font-size: .9rem; transition: background .15s, color .15s;
      text-decoration: none;
      &:hover { background: rgba(255,255,255,.2); color: #fff; }
    }
    .lb-btn--close:hover { background: #ef4444; color: #fff; }

    .lb-body { flex: 1; overflow: auto; display: flex; align-items: center; justify-content: center; min-height: 0; }

    .lb-img {
      max-width: 100%; max-height: 80vh; object-fit: contain;
      display: block; margin: auto;
    }
    .lb-pdf {
      width: 100%; height: 80vh; border: none; display: block; background: #fff;
    }

    /* ── Responsive ──────────────────────────────────────────── */
    @media (max-width: 600px) {
      .np-grid { grid-template-columns: 1fr; }
      .np-card--text { flex-direction: column;
        .np-card-text-accent { width: 100%; height: 3px; border-radius: 0; }
        .np-card-content { padding-left: 1.25rem; }
      }
      .lb-panel { border-radius: 10px; }
    }
  `]
})
export class NoticesPageComponent implements OnInit {
  private discountSvc = inject(DiscountService);
  private sanitizer   = inject(DomSanitizer);
  private readonly apiBase = environment.apiUrl;

  notices  = signal<NoticeDto[]>([]);
  loading  = signal(true);
  lightbox = signal<LightboxState | null>(null);

  ngOnInit() {
    this.discountSvc.getActiveNotices().subscribe({
      next: list => { this.notices.set(list); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  openLightbox(n: NoticeDto) {
    const url  = this.fileUrl(n.imageUrl!);
    const type = this.isPdf(n.imageUrl!) ? 'pdf' : 'image';
    const safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
    this.lightbox.set({ url, safeUrl, type, title: n.title });
  }

  closeLightbox() { this.lightbox.set(null); }

  fileUrl(url: string): string {
    return url.startsWith('http') ? url : `${this.apiBase}${url}`;
  }

  isPdf(url: string)  { return url?.toLowerCase().endsWith('.pdf') ?? false; }

  typeColor(t: number) { return TYPE_COLOR[t] ?? TYPE_COLOR[1]; }
  typeBg(t: number)    { return TYPE_BG[t]    ?? TYPE_BG[1];    }
  typeIcon(t: number)  { return TYPE_ICON[t]  ?? TYPE_ICON[1];  }
}
