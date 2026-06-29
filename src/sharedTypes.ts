/**
 * Mobile-local copy of the shared API DTOs and enum constants.
 *
 * This keeps the Expo app deployable/buildable by itself, without depending on
 * the monorepo-only @fubooks/shared-types workspace package.
 */
export const FUTO_LEVELS = ['L100', 'L200', 'L300', 'L400', 'L500', 'L600'] as const;
export type FutoLevel = (typeof FUTO_LEVELS)[number];

export const FUTO_FACULTIES = ['SEET', 'SICT', 'SOBS', 'SOHT', 'SOES', 'SMAT'] as const;
export type Faculty = (typeof FUTO_FACULTIES)[number];

export const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN'] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export type OrderStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
export type KycStatus = 'NOT_STARTED' | 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface BookDTO {
  id: string;
  title: string;
  author: string;
  courseCode: string;
  level: FutoLevel;
  faculty: Faculty;
  price: string;
  stock: number;
  imageUrl: string | null;
  createdAt: string;
}

export interface UserProfileDTO {
  id: string;
  fullName: string | null;
  email: string | null;
  matricNumber: string | null;
  level: FutoLevel | null;
  faculty: Faculty | null;
  kycStatus: KycStatus;
  accountNumber: string | null;
  bankName: string | null;
  accountReference: string | null;
  hasDeliveryDetails: boolean;
}

export interface WalletDTO {
  balance: string;
  currency: 'NGN';
}

export interface DeliveryDetailsDTO {
  fullName: string;
  phoneNumber: string;
  hostelOrAddress: string;
  campusArea: string | null;
  alternatePhoneNumber: string | null;
}

export interface CreateOrderRequest {
  bookId: string;
  deliveryDetails: DeliveryDetailsDTO;
}

export interface OrderDTO {
  id: string;
  bookId: string;
  bookTitle: string;
  pricePaid: string;
  status: OrderStatus;
  createdAt: string;
}

export interface InitiateFundingResponse {
  accountNumber: string;
  bankName: string;
  accountName: string;
  accountReference: string;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
  };
}

export interface LevelRevenuePoint {
  level: FutoLevel;
  totalOrders: number;
  totalRevenue: string;
}

export interface FacultyDistributionPoint {
  faculty: Faculty;
  totalOrders: number;
  percentage: number;
}

export type AdminAccessLevel = 'FULL' | 'CATALOG_ONLY' | 'ORDERS_ONLY' | 'READ_ONLY';

export interface AdminDTO {
  id: string;
  email: string;
  fullName: string;
  role: AdminRole;
  accessLevel: AdminAccessLevel;
  isActive: boolean;
  createdAt: string;
}
