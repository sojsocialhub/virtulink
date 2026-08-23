import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import crypto from 'crypto';

const VTPASS_URL = 'https://sandbox.vtpass.com/api/pay';
const VTPASS_VARIATIONS_URL = 'https://sandbox.vtpass.com/api/service-variations';

const NETWORK_SERVICE_IDS: Record<string, string> = {
  MTN: 'mtn-data',
  Airtel: 'airtel-data',
  Glo: 'glo-data',
  '9mobile': 'etisalat-data',
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
    const variationCode = String(body.variationCode || '').trim();
    const phoneNumber = String(body.phoneNumber || '').trim();

    if (!NETWORK_SERVICE_IDS[network]) {
      return NextResponse.json(
        { status: false, message: 'Invalid network selected.' },
        { status: 400 }
      );
    }

    if (!variationCode) {
      return NextResponse.json(
        { status: false, message: 'Please select a data plan.' },
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

    const apiKey = process.env.VTPASS_API_KEY;
    const publicKey = process.env.VTPASS_PUBLIC_KEY;
    const secretKey = process.env.VTPASS_SECRET_KEY;

    if (!apiKey || !publicKey || !secretKey) {
      console.error('VTpass credentials are not configured.');

      return NextResponse.json(
        {
          status: false,
          message: 'Data service is temporarily unavailable.',
        },
        { status: 500 }
      );
    }

    /*
     * Get the real plan information from VTpass.
     * This prevents the browser from being able to change the price.
     */
    const serviceID = NETWORK_SERVICE_IDS[network];

    const variationsResponse = await fetch(
      `${VTPASS_VARIATIONS_URL}?serviceID=${encodeURIComponent(serviceID)}`,
      {
        headers: {
          'api-key': apiKey,
          'public-key': publicKey,
        },
        cache: 'no-store',
      }
    );

    const variationsData = await variationsResponse.json();

    if (
      !variationsResponse.ok ||
      variationsData?.response_description !== '000'
    ) {
      return NextResponse.json(
        {
          status: false,
          message: 'Unable to verify the selected data plan.',
        },
        { status: 502 }
      );
    }

    const variations = Array.isArray(variationsData?.content?.variations)
      ? variationsData.content.variations
      : [];

    const selectedPlan = variations.find(
      (plan: any) =>
        String(plan.variation_code || '') === variationCode
    );

    if (!selectedPlan) {
      return NextResponse.json(
        {
          status: false,
          message: 'The selected data plan is no longer available.',
        },
        { status: 400 }
      );
    }

    const amount = Number(selectedPlan.variation_amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        {
          status: false,
          message: 'Invalid data plan price received from VTpass.',
        },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const userRef = db.collection('users').doc(userId);

    const now = new Date();

    const lagosParts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Africa/Lagos',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(now);

    const dateParts = Object.fromEntries(
      lagosParts.map(({ type, value }) => [type, value])
    );

    const requestId =
      `${dateParts.year}${dateParts.month}${dateParts.day}` +
      `${dateParts.hour}${dateParts.minute}` +
      crypto.randomBytes(6).toString('hex');

    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return NextResponse.json(
        {
          status: false,
          message: 'Customer account was not found.',
        },
        { status: 404 }
      );
    }

    const userData = userSnap.data() || {};
    const walletBalance = Number(userData.walletBalance || 0);

    if (walletBalance < amount) {
      return NextResponse.json(
        {
          status: false,
          message:
            `Insufficient wallet balance. Price: ₦${amount.toLocaleString()}, ` +
            `Balance: ₦${walletBalance.toLocaleString()}.`,
        },
        { status: 400 }
      );
    }

    /*
     * Send the actual purchase to VTpass.
     */
    const vtpassResponse = await fetch(VTPASS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
        'secret-key': secretKey,
      },
      body: JSON.stringify({
        request_id: requestId,
        serviceID,
        billersCode: phoneNumber,
        variation_code: variationCode,
        phone: phoneNumber,
        amount,
      }),
      cache: 'no-store',
    });

    const vtpassData = await vtpassResponse.json();

    console.log('VTpass FULL DATA RESPONSE:', JSON.stringify(vtpassData, null, 2));

    console.log('VTpass Data Response:', {
      httpStatus: vtpassResponse.status,
      code: vtpassData?.code,
      responseDescription: vtpassData?.response_description,
      requestId,
      network,
      variationCode,
    });

    const providerStatus =
      String(vtpassData?.content?.transactions?.status || '').toLowerCase();

    const providerCode = String(vtpassData?.code || '');

    /*
     * Do not deduct the customer's wallet unless VTpass confirms delivery.
     */
    if (
      !vtpassResponse.ok ||
      providerCode !== '000' ||
      providerStatus !== 'delivered'
    ) {
      const isPending =
        providerStatus === 'pending' ||
        providerCode === '099' ||
        /pending/i.test(
          String(vtpassData?.response_description || '')
        );

      return NextResponse.json(
        {
          status: false,
          pending: isPending,
          message: isPending
            ? 'Your data purchase is still being processed. Your wallet has not been deducted.'
            : vtpassData?.response_description ||
              'Data purchase failed. Your wallet has not been deducted.',
          requestId,
        },
        {
          status: isPending ? 202 : 400,
        }
      );
    }

    /*
     * VTpass delivered successfully.
     * Now perform the wallet deduction and transaction creation atomically.
     */
    const transactionRef = db.collection('transactions').doc();

    await db.runTransaction(async (transaction) => {
      const freshUserSnap = await transaction.get(userRef);

      if (!freshUserSnap.exists) {
        throw new Error('Customer account was not found.');
      }

      const freshUserData = freshUserSnap.data() || {};
      const freshWalletBalance = Number(
        freshUserData.walletBalance || 0
      );

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
        type: 'data',
        service: String(selectedPlan.name || 'Data Bundle'),
        network,
        phoneNumber,
        amount,
        variationCode,
        serviceID,
        paymentMethod: 'Wallet',
        reference: requestId,
        provider: 'VTpass',
        providerTransactionId:
          vtpassData?.content?.transactions?.transactionId || '',
        status: 'Completed',
        date: now.toISOString(),
        createdAt: FieldValue.serverTimestamp(),
      });
    });

    return NextResponse.json({
      status: true,
      message:
        `${selectedPlan.name} has been sent to ${phoneNumber}.`,
      requestId,
      transactionId:
        vtpassData?.content?.transactions?.transactionId || null,
      amount,
      network,
    });
  } catch (error: any) {
    console.error('Data Purchase Error:', error);

    return NextResponse.json(
      {
        status: false,
        message:
          error?.message || 'Unable to complete the data purchase.',
      },
      { status: 500 }
    );
  }
}
