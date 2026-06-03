
export type TransactionType = 'airtime' | 'data' | 'funding' | 'social_log' | 'number';
export type TransactionStatus = 'Pending' | 'Completed' | 'Failed';
export type FundRequestStatus = 'pending' | 'approved' | 'rejected';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  walletBalance: number;
  isAdmin: boolean;
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

export interface FundRequest {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  proofImage?: string;
  status: FundRequestStatus;
  date: string;
}

export interface ProductPlan {
  id: string;
  name: string;
  price: number;
  network: string;
  type: 'airtime' | 'data';
}
