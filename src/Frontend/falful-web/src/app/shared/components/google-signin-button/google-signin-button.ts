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
  template: `
    <div class="google-btn-wrapper">
      <div #googleBtn></div>
    </div>
  `,
  styles: [`
    .google-btn-wrapper {
      display: flex;
      justify-content: center;
      margin: 0.5rem 0;
    }
  `]
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
      // Force popup mode — prevents fallback redirect to /signin-google
      ux_mode: 'popup',
      callback: (response: { credential: string }) => {
        // Google callback runs outside Angular's zone; bring it back in
        this.ngZone.run(() => this.credential.emit(response.credential));
      }
    });

    google.accounts.id.renderButton(this.btnRef.nativeElement, {
      theme: 'outline',
      size: 'large',
      width: this.width,
      text: 'continue_with',
      shape: 'rectangular',
      logo_alignment: 'left'
    });
  }
}
