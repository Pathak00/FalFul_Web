export interface AdminUser {
  id: number;
  fullName: string;
  email?: string;
  phoneNumber?: string;
  userType: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  adminUsers: number;
  totalPages: number;
  publishedPages: number;
  totalBanners: number;
  activeBanners: number;
  visibleSections: number;
}

export interface SetUserActiveRequest {
  userId: number;
  isActive: boolean;
}

export interface SetUserTypeRequest {
  userId: number;
  userType: number;
}

export interface AdminResetPasswordRequest {
  userId: number;
  newPassword: string;
}
