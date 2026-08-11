import { UserSubscription } from './subscription.models';

// export interface ApiResponse {
//   success: boolean;
//   message?: string;
//   data: UserSubscription;
// }

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: string[];
}
