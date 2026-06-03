export type ProductType = 'virtual number' | 'eSIM' | 'VPN subscription';

export interface Product {
  id: string;
  name: string;
  type: ProductType;
  price: number;
  description: string;
  features: string[];
  imageUrl: string;
}

export type OrderStatus = 'Pending' | 'Paid' | 'Completed';

export interface Order {
  id: string;
  userId: string;
  productId: string;
  productName: string;
  amount: number;
  status: OrderStatus;
  createdAt: string;
  paymentScreenshot?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
}