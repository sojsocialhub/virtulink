
import { ProductPlan } from './types';

export const NETWORKS = ['MTN', 'Airtel', 'Glo', '9mobile'];

export const DATA_PLANS: ProductPlan[] = [
  { id: 'mtn-1gb', name: 'MTN 1GB - 30 Days', price: 300, network: 'MTN', type: 'data' },
  { id: 'mtn-2gb', name: 'MTN 2GB - 30 Days', price: 600, network: 'MTN', type: 'data' },
  { id: 'airtel-1gb', name: 'Airtel 1.5GB - 30 Days', price: 450, network: 'Airtel', type: 'data' },
  { id: 'glo-2gb', name: 'Glo 2.9GB - 30 Days', price: 500, network: 'Glo', type: 'data' },
];

export const ADMIN_BANK_DETAILS = {
  accountName: 'SAMUEL AYOMIDE OLUWADARE',
  accountNumber: '1234567890',
  bankName: 'OPAY',
};
