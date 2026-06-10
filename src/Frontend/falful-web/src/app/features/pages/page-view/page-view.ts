import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PageDetail } from '../../../core/models/cms.models';
import { CmsService } from '../../../core/services/cms.service';

@Component({
  selector: 'app-page-view',
  standalone: true,
  templateUrl: './page-view.html',
  styleUrl: './page-view.scss'
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
