import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { SubscriptionProduct } from '../models/subscription.models';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/genericResponse.models';
import { UserSubscription } from '../models/subscription.models';

@Injectable({
  providedIn: 'root',
})
export class SubscriptionService {
  constructor(private api: ApiService) {}

  getSubscription(subscriptionobj: SubscriptionProduct): Observable<ApiResponse<UserSubscription>> {
    return this.api.post<ApiResponse<UserSubscription>>('/api/subscription', subscriptionobj);
  }

  getuserSuscription(): Observable<ApiResponse<UserSubscription>> {
    return this.api.get<ApiResponse<UserSubscription>>('/api/subscription/GetUserSubsPlan');
  }

  CreateSubscription(
    subscriptionobj: SubscriptionProduct,
  ): Observable<ApiResponse<UserSubscription>> {
    return this.api.post<ApiResponse<UserSubscription>>(
      '/api/subscription/Create',
      subscriptionobj,
    );
  }

  ChangePlan(subscriptionobj: SubscriptionProduct): Observable<ApiResponse<UserSubscription>> {
    return this.api.post<ApiResponse<UserSubscription>>(
      '/api/subscription/Change',
      subscriptionobj,
    );
  }
}
