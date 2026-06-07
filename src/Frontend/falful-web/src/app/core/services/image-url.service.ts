import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ImageUrlService {
  resolve(path: string | undefined | null): string {
    if (!path) return '';
    // Already a full URL (legacy records not yet cleaned up, or external images)
    if (path.startsWith('http')) return path;
    // Normalize: strip any accidental leading slash so we always join with '/'
    const relative = path.startsWith('/') ? path.slice(1) : path;
    return `${environment.apiUrl}/${relative}`;
  }
}
