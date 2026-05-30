import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class RiderService {
  constructor(private api: ApiService) {}

  getMyDeliveries(): Observable<any[]> {
    return this.api.get<any[]>('/api/rider/deliveries');
  }

  getDeliveryDetail(id: number): Observable<any> {
    return this.api.get<any>(`/api/rider/deliveries/${id}`);
  }

  updateStatus(id: number, status: number, trackingNotes?: string): Observable<void> {
    return this.api.put<void>(`/api/rider/deliveries/${id}/status`, { status, trackingNotes });
  }

  logAttempt(id: number, dto: {
    wasSuccessful: boolean;
    failureReason?: number;
    failureNotes?: string;
    nextAction?: number;
    rescheduledDate?: string;
    rescheduledTimeSlot?: string;
  }): Observable<void> {
    return this.api.post<void>(`/api/rider/deliveries/${id}/attempts`, dto);
  }

  completeDelivery(id: number, dto: {
    collectedAmount: number;
    proofPhotoUrl?: string;
    collectionRemarks?: string;
  }): Observable<void> {
    return this.api.post<void>(`/api/rider/deliveries/${id}/complete`, dto);
  }
}
