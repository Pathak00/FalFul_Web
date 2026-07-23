import { Component, inject } from '@angular/core';
import { ToastService, ToastType } from '../../../core/services/toast.service';

const ICONS: Record<ToastType, string> = {
  success: 'bi-check-circle-fill',
  error:   'bi-exclamation-circle-fill',
  warn:    'bi-exclamation-triangle-fill',
  info:    'bi-info-circle-fill',
};

@Component({
  selector: 'app-toast',
  standalone: true,
  templateUrl: './toast.html',
  styleUrl: './toast.scss'
})
export class ToastComponent {
  readonly svc = inject(ToastService);
  icon(type: ToastType): string { return ICONS[type]; }
}
