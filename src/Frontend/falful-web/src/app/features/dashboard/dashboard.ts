import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="dashboard">
      <div class="dashboard-header">
        <h1>Welcome, {{ user()?.fullName }} 👋</h1>
        <p>{{ user()?.userType }} Dashboard</p>
      </div>
      <div class="coming-soon">
        <span>🚧</span>
        <h2>Dashboard Coming Soon</h2>
        <p>Full dashboard will be available in Phase 7.</p>
        <a routerLink="/" class="btn">Back to Home</a>
      </div>
    </div>
  `,
  styles: [`
    .dashboard { padding: 3rem 2rem; max-width: 1200px; margin: 0 auto; }
    .dashboard-header h1 { font-size: 2rem; font-weight: 800; color: #1a1a2e; }
    .dashboard-header p { color: #888; margin-top: 0.25rem; }
    .coming-soon {
      margin-top: 3rem;
      text-align: center;
      padding: 4rem;
      background: #f9f9f9;
      border-radius: 20px;
      span { font-size: 3rem; }
      h2 { margin: 1rem 0 0.5rem; color: #1a1a2e; }
      p { color: #888; margin-bottom: 1.5rem; }
    }
    .btn {
      text-decoration: none;
      background: linear-gradient(135deg, #2d9348, #48c774);
      color: white;
      padding: 0.75rem 1.5rem;
      border-radius: 10px;
      font-weight: 600;
    }
  `]
})
export class DashboardComponent {
  private authService = inject(AuthService);
  readonly user = this.authService.currentUser;
}
