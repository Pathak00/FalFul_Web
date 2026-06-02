export interface AdminNavItem {
  id: number;
  label: string;
  route: string;
  icon?: string;
  parentId?: number;
  groupLabel?: string;
  displayOrder: number;
  isVisible: boolean;
  requiredPermission?: string;
  isSystem: boolean;
  /** null=all portals, 'admin'=admin portal only, 'rider'=rider portal only */
  portalScope?: string | null;
}

export interface UpdateAdminNavItemRequest {
  label: string;
  icon?: string;
  groupLabel?: string;
  displayOrder: number;
  isVisible: boolean;
  /** Only applied by the server for custom (non-system) items. */
  requiredPermission?: string;
  /** Only applied by the server for custom (non-system) items. */
  portalScope?: string;
}

export interface CreateAdminNavItemRequest {
  label: string;
  route: string;
  icon?: string;
  groupLabel?: string;
  displayOrder: number;
  isVisible: boolean;
  requiredPermission?: string;
  /** null=all portals, 'admin'=admin portal only, 'rider'=rider portal only */
  portalScope: string;
}

export interface AdminUser {
  id: number;
  fullName: string;
  email?: string;
  phoneNumber?: string;
  userType: string;
  roleName?: string;
  portalType: 'customer' | 'rider' | 'admin';
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

export interface AdminCreateUserRequest {
  fullName: string;
  email?: string;
  phoneNumber?: string;
  password: string;
  roleId?: number;
}
