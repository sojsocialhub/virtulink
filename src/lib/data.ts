
import { ProductPlan, Product } from './types';

export const NETWORKS = ['Airtel'];

export const DATA_PLANS: ProductPlan[] = [
  { id: 'mtn-1gb', name: 'MTN 1GB - 30 Days', price: 300, network: 'MTN', type: 'data' },
  { id: 'mtn-2gb', name: 'MTN 2GB - 30 Days', price: 600, network: 'MTN', type: 'data' },
  { id: 'airtel-1gb', name: 'Airtel 1.5GB - 30 Days', price: 450, network: 'Airtel', type: 'data' },
  { id: 'glo-2gb', name: 'Glo 2.9GB - 30 Days', price: 500, network: 'Glo', type: 'data' },
];

export const ADMIN_BANK_DETAILS = {
  accountName: 'Samuel Ayomide Oluwadare',
  accountNumber: '9120964447',
  bankName: 'OPay',
  swiftCode: 'N/A'
};

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'vn-us-1',
    name: 'US Premium Virtual Number',
    type: 'virtual number',
    price: 15.00,
    description: 'High-quality US virtual number for WhatsApp, Telegram, and Google verification.',
    imageUrl: 'https://picsum.photos/seed/virtulink2/600/400',
    features: ['OTP Supported', 'Instant Activation', '99.9% Success Rate']
  },
  {
    id: 'sl-fb-1',
    name: 'Facebook Social Log (Aged)',
    type: 'social_log',
    price: 5.50,
    description: 'Aged Facebook account with high trust score for marketing and business use.',
    imageUrl: 'https://picsum.photos/seed/virtulink1/600/400',
    features: ['High Trust Score', 'Profile Photo Included', '2FA Enabled']
  },
  {
    id: 'esim-eu-1',
    name: 'Europe Travel eSIM (5GB)',
    type: 'eSIM',
    price: 25.00,
    description: 'Seamless connectivity across 35+ European countries with high-speed 5G data.',
    imageUrl: 'https://picsum.photos/seed/virtulink3/600/400',
    features: ['High Speed 5G', 'No Roaming Fees', 'Instant QR Setup']
  },
  {
    id: 'vpn-sg-1',
    name: 'SafeGuard Pro VPN (1 Month)',
    type: 'VPN subscription',
    price: 10.00,
    description: 'Secure your digital life with ultra-fast servers and military-grade encryption.',
    imageUrl: 'https://picsum.photos/seed/virtulink4/600/400',
    features: ['No Logs Policy', 'Multi-device Support', '24/7 Support']
  }
];
