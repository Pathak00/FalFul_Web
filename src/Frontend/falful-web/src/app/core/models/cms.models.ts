export interface PageListItem {
  id: number;
  title: string;
  slug: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface PageDetail extends PageListItem {
  content?: string;
  metaTitle?: string;
  metaDescription?: string;
}

export interface CreatePageRequest {
  title: string;
  slug: string;
  content?: string;
  metaTitle?: string;
  metaDescription?: string;
  isPublished: boolean;
}

export interface UpdatePageRequest extends CreatePageRequest {
  id: number;
}

export interface Banner {
  id: number;
  title: string;
  subtitle?: string;
  buttonText?: string;
  buttonLink?: string;
  imageUrl?: string;
  position: string;
  isActive: boolean;
  displayOrder: number;
  startDate?: string;
  endDate?: string;
}

export interface CreateBannerRequest {
  title: string;
  subtitle?: string;
  buttonText?: string;
  buttonLink?: string;
  imageUrl?: string;
  position: string;
  isActive: boolean;
  displayOrder: number;
  startDate?: string;
  endDate?: string;
}

export interface UpdateBannerRequest extends CreateBannerRequest {
  id: number;
}

export interface HomepageSection {
  id: number;
  sectionKey: string;
  title?: string;
  subtitle?: string;
  content?: string;
  isVisible: boolean;
  displayOrder: number;
}

export interface UpsertSectionRequest {
  sectionKey: string;
  title?: string;
  subtitle?: string;
  content?: string;
  isVisible: boolean;
  displayOrder: number;
}
