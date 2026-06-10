import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  Output,
  ViewChild,
  inject,
} from '@angular/core';
import { environment } from '../../../../environments/environment';

declare const google: any;

@Component({
  selector: 'app-google-signin-button',
  standalone: true,
  templateUrl: './google-signin-button.html',
  styleUrl: './google-signin-button.scss'
})
export class GoogleSignInButtonComponent implements AfterViewInit {
  @ViewChild('googleBtn', { static: true }) btnRef!: ElementRef;
  @Output() credential = new EventEmitter<string>();
  @Input() width = 340;

  private ngZone = inject(NgZone);

  ngAfterViewInit(): void {
    if (typeof google === 'undefined') {
      console.warn('Google Identity Services script not loaded yet — retrying in 500ms.');
      setTimeout(() => this.ngAfterViewInit(), 500);
      return;
    }

    google.accounts.id.initialize({
      client_id: environment.googleClientId,
      ux_mode: 'popup',
      callback: (response: { credential: string }) => {
        this.ngZone.run(() => this.credential.emit(response.credential));
      }
    });

    // Use the actual wrapper width so the button never overflows its container.
    // Google clamps its width to [200, 400]; we stay within that range.
    const containerWidth = this.btnRef.nativeElement.parentElement?.offsetWidth ?? this.width;
    const renderWidth = Math.max(200, Math.min(400, containerWidth));

    google.accounts.id.renderButton(this.btnRef.nativeElement, {
      theme: 'outline',
      size: 'large',
      width: renderWidth,
      text: 'continue_with',
      shape: 'rectangular',
      logo_alignment: 'left'
    });
  }
}
