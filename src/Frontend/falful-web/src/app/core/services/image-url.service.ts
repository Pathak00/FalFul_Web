import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ImageUrlService {
  resolve(path: string | undefined | null): string {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${environment.apiUrl}${path}`;
  }
}
