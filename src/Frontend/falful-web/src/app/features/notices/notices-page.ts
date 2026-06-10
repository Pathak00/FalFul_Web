import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { DiscountService } from '../../core/services/discount.service';
import { ImageUrlService } from '../../core/services/image-url.service';
import { NoticeDto } from '../../core/models/discount.models';

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
  templateUrl: './notices-page.html',
  styleUrl: './notices-page.scss'
})
export class NoticesPageComponent implements OnInit {
  private discountSvc = inject(DiscountService);
  private sanitizer   = inject(DomSanitizer);
  private imgSvc      = inject(ImageUrlService);

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
    return this.imgSvc.resolve(url);
  }

  isPdf(url: string)  { return url?.toLowerCase().endsWith('.pdf') ?? false; }

  typeColor(t: number) { return TYPE_COLOR[t] ?? TYPE_COLOR[1]; }
  typeBg(t: number)    { return TYPE_BG[t]    ?? TYPE_BG[1];    }
  typeIcon(t: number)  { return TYPE_ICON[t]  ?? TYPE_ICON[1];  }
}
