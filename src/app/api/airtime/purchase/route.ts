import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import crypto from 'crypto';

const VTPASS_URL = 'https://sandbox.vtpass.com/api/pay';

const NETWORK_SERVICE_IDS: Record<string, string> = {
  MTN: 'mtn',
  Airtel: 'airtel',
  Glo: 'glo',
  '9mobile': 'etisalat',
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

    if (!NETWORK_SERVICE_IDS[network]) {
      return NextResponse.json(
        { status: false, message: 'Invalid network selected.' },
        { status: 400 }
      );
    }

    if (!/^0\d{10}$/.test(phoneNumber)) {
      return NextResponse.json(
        {
          status: false,
          message: 'Enter a valid Nigerian phone number, e.g. 08012345678.'
        },
        { status: 400 }
      );
    }

    if (!Number.isFinite(amount) || amount < 100) {
      return NextResponse.json(
        { status: false, message: 'Minimum airtime is ₦100.' },
        { status: 400 }
      );
    }

    if (!Number.isInteger(amount)) {
      return NextResponse.json(
        { status: false, message: 'Airtime amount must be a whole number.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.VTPASS_API_KEY;
    const secretKey = process.env.VTPASS_SECRET_KEY;

    if (!apiKey || !secretKey) {
      console.error('VTpass credentials are not configured.');
      return NextResponse.json(
        { status: false, message: 'Airtime service is temporarily unavailable.' },
        { status: 500 }
      );
    }

    const db = getAdminDb();
    const userRef = db.collection('users').doc(userId);
    const lagosDate = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Africa/Lagos',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(new Date());

    const dateParts = Object.fromEntries(
      lagosDate.map(({ type, value }) => [type, value])
    );

    const requestId =
      `${dateParts.year}${dateParts.month}${dateParts.day}` +
      `${dateParts.hour}${dateParts.minute}` +
      crypto.randomBytes(6).toString('hex');

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
          message: `Insufficient wallet balance. Price: ₦${amount.toLocaleString()}, Balance: ₦${walletBalance.toLocaleString()}.`
        },
        { status: 400 }
      );
    }

    const vtpassResponse = await fetch(VTPASS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
        'secret-key': secretKey,
      },
      body: JSON.stringify({
        request_id: requestId,
        serviceID: NETWORK_SERVICE_IDS[network],
        amount,
        phone: phoneNumber,
      }),
      cache: 'no-store',
    });

    const vtpassData = await vtpassResponse.json();

    console.log('VTpass Airtime Response:', {
      httpStatus: vtpassResponse.status,
      code: vtpassData?.code,
      responseDescription: vtpassData?.response_description,
      requestId,
    });

    const providerStatus =
      vtpassData?.content?.transactions?.status || '';

    const providerCode = String(vtpassData?.code || '');

    if (
      !vtpassResponse.ok ||
      providerCode !== '000' ||
      providerStatus !== 'delivered'
    ) {
      const isPending =
        providerStatus === 'pending' ||
        providerCode === '099' ||
        /pending/i.test(String(vtpassData?.response_description || ''));

      return NextResponse.json(
        {
          status: false,
          pending: isPending,
          message: isPending
            ? 'Your airtime purchase is still being processed. Your wallet has not been deducted.'
            : vtpassData?.response_description ||
              'Airtime purchase failed. Your wallet has not been deducted.',
          requestId,
        },
        { status: isPending ? 202 : 400 }
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
          'Your wallet balance changed while this purchase was processing. Please contact support before trying again.'
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
        reference: requestId,
        provider: 'VTpass',
        providerTransactionId:
          vtpassData?.content?.transactions?.transactionId || '',
        status: 'Completed',
        date: new Date().toISOString(),
        createdAt: FieldValue.serverTimestamp(),
      });
    });

    return NextResponse.json({
      status: true,
      message: `₦${amount.toLocaleString()} ${network} airtime sent to ${phoneNumber}.`,
      requestId,
      transactionId:
        vtpassData?.content?.transactions?.transactionId || null,
    });
  } catch (error: any) {
    console.error('Airtime Purchase Error:', error);

    return NextResponse.json(
      {
        status: false,
        message:
          error?.message || 'Unable to complete the airtime purchase.',
      },
      { status: 500 }
    );
  }
}
