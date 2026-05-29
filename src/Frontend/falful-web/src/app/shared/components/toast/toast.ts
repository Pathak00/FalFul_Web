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
  template: `
    <div class="toast-container">
      @for (t of svc.toasts(); track t.id) {
        <div class="toast toast-{{ t.type }}" role="alert">
          <i class="bi {{ icon(t.type) }} toast-icon"></i>
          <span class="toast-msg">{{ t.message }}</span>
          <button class="toast-close" (click)="svc.dismiss(t.id)" aria-label="Dismiss">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      bottom: 1.5rem;
      right: 1.5rem;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: .625rem;
      width: 360px;
      max-width: calc(100vw - 3rem);
      pointer-events: none;
    }

    .toast {
      display: flex;
      align-items: flex-start;
      gap: .625rem;
      background: #fff;
      border-radius: 10px;
      padding: .875rem 1rem;
      box-shadow: 0 4px 24px rgba(0,0,0,.13), 0 1px 6px rgba(0,0,0,.07);
      border-left: 4px solid transparent;
      pointer-events: all;
      animation: toastIn .22s ease;
    }

    .toast-success { border-left-color: #16a34a; .toast-icon { color: #16a34a; } }
    .toast-error   { border-left-color: #dc2626; .toast-icon { color: #dc2626; } }
    .toast-warn    { border-left-color: #d97706; .toast-icon { color: #d97706; } }
    .toast-info    { border-left-color: #3b82f6; .toast-icon { color: #3b82f6; } }

    .toast-icon { font-size: .95rem; flex-shrink: 0; margin-top: .1rem; }

    .toast-msg {
      flex: 1;
      font-size: .845rem;
      color: #1e293b;
      line-height: 1.5;
    }

    .toast-close {
      background: none;
      border: none;
      cursor: pointer;
      color: #94a3b8;
      padding: 0 0 0 .25rem;
      flex-shrink: 0;
      line-height: 1;
      font-size: .75rem;
      transition: color .1s;
      &:hover { color: #475569; }
    }

    @keyframes toastIn {
      from { opacity: 0; transform: translateX(16px); }
      to   { opacity: 1; transform: translateX(0); }
    }
  `]
})
export class ToastComponent {
  readonly svc = inject(ToastService);
  icon(type: ToastType): string { return ICONS[type]; }
}
