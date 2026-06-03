import { Product } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'vn-1',
    name: 'US Premium Virtual Number',
    type: 'virtual number',
    price: 15.00,
    description: 'A high-quality virtual number for receiving SMS and calls from anywhere in the world.',
    features: ['Instant Activation', 'SMS Support', 'No Contract', 'High Privacy'],
    imageUrl: 'https://picsum.photos/seed/virtulink2/600/400'
  },
  {
    id: 'esim-1',
    name: 'Europe Travel eSIM - 10GB',
    type: 'eSIM',
    price: 25.00,
    description: 'Seamless data connectivity across all EU countries with high-speed 4G/5G coverage.',
    features: ['10GB Data', '30 Days Validity', 'Hotspot Ready', 'Dual SIM Support'],
    imageUrl: 'https://picsum.photos/seed/virtulink3/600/400'
  },
  {
    id: 'vpn-1',
    name: 'SafeGuard Pro VPN - 1 Year',
    type: 'VPN subscription',
    price: 49.99,
    description: 'Ultimate privacy protection with military-grade encryption and global server network.',
    features: ['50+ Locations', 'Unlimited Bandwidth', 'No Logs Policy', '5 Device Support'],
    imageUrl: 'https://picsum.photos/seed/virtulink4/600/400'
  }
];

export const BANK_DETAILS = {
  accountName: 'VirtuLink Digital Services',
  accountNumber: '1234-5678-9012',
  bankName: 'TrustCore International',
  swiftCode: 'TCOREXYZ',
};