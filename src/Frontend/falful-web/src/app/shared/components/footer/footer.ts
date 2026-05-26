import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  template: `
    <footer class="footer">
      <div class="footer-content">
        <div class="footer-brand">
          <span class="logo-icon">🍎</span>
          <span class="logo-text">FalFul</span>
          <p>Fresh fruits delivered to your door.</p>
        </div>
        <div class="footer-links">
          <h4>Quick Links</h4>
          <a routerLink="/">Home</a>
          <a routerLink="/products">Products</a>
          <a routerLink="/auth/register">Sign Up</a>
        </div>
        <div class="footer-links">
          <h4>Company</h4>
          <a routerLink="/about">About Us</a>
          <a routerLink="/contact">Contact</a>
          <a routerLink="/faq">FAQ</a>
        </div>
        <div class="footer-links">
          <h4>Legal</h4>
          <a routerLink="/privacy">Privacy Policy</a>
          <a routerLink="/terms">Terms & Conditions</a>
          <a routerLink="/delivery-info">Delivery Info</a>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; {{ year }} FalFul. All rights reserved.</p>
      </div>
    </footer>
  `,
  styleUrl: './footer.scss'
})
export class FooterComponent {
  readonly year = new Date().getFullYear();
}
