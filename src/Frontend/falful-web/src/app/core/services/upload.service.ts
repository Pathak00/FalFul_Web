import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UploadService {
  private http = inject(HttpClient);

  upload(file: File): Observable<string> {
    const form = new FormData();
    form.append('file', file);
    return this.http
      .post<{ url: string }>(`${environment.apiUrl}/api/upload`, form)
      .pipe(map(r => r.url));
  }

  /** Deletes a previously uploaded file. Fire-and-forget; errors are swallowed. */
  deleteUpload(relativeUrl: string): void {
    if (!relativeUrl?.startsWith('uploads/')) return;
    const filename = relativeUrl.replace(/^uploads\//, '');
    this.http.delete(`${environment.apiUrl}/api/upload/${encodeURIComponent(filename)}`)
      .subscribe({ error: () => {} });
  }
}
