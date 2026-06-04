
export type TransactionType = 'airtime' | 'data' | 'funding' | 'social_log' | 'number';
export type TransactionStatus = 'Pending' | 'Completed' | 'Failed';
export type FundRequestStatus = 'pending' | 'approved' | 'rejected';
export type PurchaseRequestStatus = 'pending' | 'paid' | 'delivered' | 'rejected';
export type ProductType = 'virtual number' | 'eSIM' | 'VPN subscription' | 'social_log' | 'data' | 'airtime';
export type UserRole = 'user' | 'admin';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  walletBalance: number;
  role: UserRole;
  createdAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  service?: string;
  network?: string;
  phoneNumber?: string;
  amount: number;
  status: TransactionStatus;
  date: string;
}

export interface PurchaseRequest {
  id: string;
  userId: string;
  userEmail: string;
  productName: string;
  amount: number;
  senderName: string;
  reference: string;
  status: PurchaseRequestStatus;
  date: string;
}

export interface Product {
  id: string;
  name: string;
  type: ProductType;
  price: number;
  description: string;
  imageUrl: string;
  features: string[];
  network?: string;
}
