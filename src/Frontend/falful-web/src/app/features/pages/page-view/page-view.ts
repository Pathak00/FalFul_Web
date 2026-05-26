import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PageDetail } from '../../../core/models/cms.models';
import { CmsService } from '../../../core/services/cms.service';

@Component({
  selector: 'app-page-view',
  standalone: true,
  template: `
    <div class="page-view">
      @if (loading()) {
        <div class="page-loading">
          <div class="spinner"></div>
        </div>
      } @else if (notFound()) {
        <div class="page-not-found">
          <h1>404</h1>
          <p>This page doesn't exist or hasn't been published yet.</p>
        </div>
      } @else if (page()) {
        <article class="cms-article">
          <header class="article-header">
            <h1>{{ page()!.title }}</h1>
          </header>
          <div class="article-body" [innerHTML]="page()!.content"></div>
        </article>
      }
    </div>
  `,
  styles: [`
    .page-view { max-width: 860px; margin: 3rem auto; padding: 0 1.5rem; }

    .page-loading {
      display: flex; justify-content: center; padding: 4rem;
      .spinner {
        width: 36px; height: 36px;
        border: 3px solid #e2e8f0; border-top-color: #16a34a;
        border-radius: 50%; animation: spin .7s linear infinite;
      }
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    .page-not-found {
      text-align: center; padding: 5rem 1rem;
      h1 { font-size: 5rem; color: #e2e8f0; margin: 0; }
      p { color: #64748b; }
    }

    .article-header {
      margin-bottom: 2rem; padding-bottom: 1.5rem; border-bottom: 1px solid #e2e8f0;
      h1 { font-size: 2rem; font-weight: 800; color: #0f172a; margin: 0; }
    }

    .article-body {
      font-size: 1rem; line-height: 1.75; color: #334155;
      h1, h2, h3 { color: #0f172a; margin: 1.5em 0 .5em; }
      p { margin: 0 0 1em; }
      a { color: #16a34a; text-decoration: underline; }
      img { max-width: 100%; border-radius: 8px; margin: 1rem 0; }
      ul, ol { padding-left: 1.5rem; margin: 0 0 1em; }
    }
  `]
})
export class PageViewComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private cms = inject(CmsService);

  page = signal<PageDetail | null>(null);
  loading = signal(true);
  notFound = signal(false);

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const slug = params.get('slug') ?? '';
      this.loading.set(true);
      this.notFound.set(false);
      this.cms.getPageBySlug(slug).subscribe({
        next: p => { this.page.set(p); this.loading.set(false); },
        error: () => { this.notFound.set(true); this.loading.set(false); }
      });
    });
  }
}
