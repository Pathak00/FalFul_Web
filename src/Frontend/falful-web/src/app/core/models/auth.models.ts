export interface RegisterUserRequest {
  fullName: string;
  email?: string;
  phoneNumber?: string;
  password?: string;
}

export interface RegisterOrganizationRequest {
  ownerFullName: string;
  ownerEmail: string;
  ownerPhone: string;
  password: string;
  organizationName: string;
  organizationType: string;
  organizationDescription?: string;
  address?: string;
}

export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface UserInfo {
  id: number;
  fullName: string;
  email?: string;
  phoneNumber?: string;
  userType: string;
  profileImageUrl?: string;
  role: string;
  permissions: string[];
  portalType: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: UserInfo;
}
