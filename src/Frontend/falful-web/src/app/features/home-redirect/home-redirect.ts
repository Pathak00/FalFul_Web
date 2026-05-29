import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HomeRouteService } from '../../core/services/home-route.service';

@Component({
  standalone: true,
  template: '',
})
export class HomeRedirectComponent {
  constructor() {
    const router = inject(Router);
    const homeRoute = inject(HomeRouteService);
    router.navigate([homeRoute.route()], { replaceUrl: true });
  }
}
