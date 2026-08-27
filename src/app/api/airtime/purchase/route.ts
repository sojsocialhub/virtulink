import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import crypto from 'crypto';

const CONNECTBRIDGE_URL = 'https://connectbridge.com.ng/api/airtime';

const NETWORK_IDS: Record<string, string> = {
  Airtel: '2',
};

export async function POST(request: Request) {
  try {
    const authorization = request.headers.get('authorization');

    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json(
        { status: false, message: 'Authentication required.' },
        { status: 401 }
      );
    }

    const idToken = authorization.substring('Bearer '.length);
    const decodedToken = await getAdminAuth().verifyIdToken(idToken);
    const userId = decodedToken.uid;
    const userEmail = decodedToken.email || '';

    const body = await request.json();
    const network = String(body.network || '').trim();
    const phoneNumber = String(body.phoneNumber || '').trim();
    const amount = Number(body.amount);

    if (!NETWORK_IDS[network]) {
      return NextResponse.json(
        { status: false, message: 'Invalid network selected.' },
        { status: 400 }
      );
    }

    if (!/^0\d{10}$/.test(phoneNumber)) {
      return NextResponse.json(
        {
          status: false,
          message: 'Enter a valid Nigerian phone number, e.g. 08012345678.',
        },
        { status: 400 }
      );
    }

    if (!Number.isFinite(amount) || amount < 100 || !Number.isInteger(amount)) {
      return NextResponse.json(
        { status: false, message: 'Enter a valid airtime amount of at least ₦100.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.CONNECTBRIDGE_API_KEY?.trim();

    if (!apiKey) {
      console.error('Connect Bridge API key is not configured.');
      return NextResponse.json(
        { status: false, message: 'Airtime service is temporarily unavailable.' },
        { status: 500 }
      );
    }

    const db = getAdminDb();
    const userRef = db.collection('users').doc(userId);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return NextResponse.json(
        { status: false, message: 'Customer account was not found.' },
        { status: 404 }
      );
    }

    const userData = userSnap.data() || {};
    const walletBalance = Number(userData.walletBalance || 0);

    if (walletBalance < amount) {
      return NextResponse.json(
        {
          status: false,
          message: `Insufficient wallet balance. Price: ₦${amount.toLocaleString()}, Balance: ₦${walletBalance.toLocaleString()}.`,
        },
        { status: 400 }
      );
    }

    const localRequestId =
      `AIR${Date.now()}${crypto.randomBytes(4).toString('hex')}`;

    const providerResponse = await fetch(CONNECTBRIDGE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Token ${apiKey}`,
      },
      body: JSON.stringify({
        amount: String(amount),
        network: NETWORK_IDS[network],
        phone: phoneNumber,
        Ported_number: true,
      }),
      cache: 'no-store',
    });

    const providerData = await providerResponse.json();

    console.log('Connect Bridge Airtime Response:', {
      httpStatus: providerResponse.status,
      status: providerData?.status,
      providerStatus: providerData?.Status,
      localRequestId,
    });

    const successful =
      providerResponse.ok &&
      String(providerData?.status).toLowerCase() === 'success' &&
      String(providerData?.Status).toLowerCase() === 'successful';

    if (!successful) {
      return NextResponse.json(
        {
          status: false,
          message:
            providerData?.message ||
            providerData?.response ||
            'Airtime purchase failed. Your wallet has not been deducted.',
          requestId: localRequestId,
        },
        { status: 400 }
      );
    }

    const transactionRef = db.collection('transactions').doc();

    await db.runTransaction(async (transaction) => {
      const freshUserSnap = await transaction.get(userRef);

      if (!freshUserSnap.exists) {
        throw new Error('Customer account was not found.');
      }

      const freshUserData = freshUserSnap.data() || {};
      const freshWalletBalance = Number(freshUserData.walletBalance || 0);

      if (freshWalletBalance < amount) {
        throw new Error(
          'Your wallet balance changed while this purchase was processing.'
        );
      }

      transaction.update(userRef, {
        walletBalance: freshWalletBalance - amount,
      });

      transaction.set(transactionRef, {
        userId,
        userEmail,
        type: 'airtime',
        service: 'Airtime',
        network,
        phoneNumber,
        amount,
        paymentMethod: 'Wallet',
        reference: providerData?.['request-id'] || localRequestId,
        provider: 'Connect Bridge',
        providerTransactionId: providerData?.['request-id'] || '',
        status: 'Completed',
        date: new Date().toISOString(),
        createdAt: FieldValue.serverTimestamp(),
      });
    });

    return NextResponse.json({
      status: true,
      message:
        providerData?.message ||
        `₦${amount.toLocaleString()} ${network} airtime sent to ${phoneNumber}.`,
      requestId: providerData?.['request-id'] || localRequestId,
    });
  } catch (error: any) {
    console.error('Airtime Purchase Error:', error);

    return NextResponse.json(
      {
        status: false,
        message: error?.message || 'Unable to complete the airtime purchase.',
      },
      { status: 500 }
    );
  }
}
