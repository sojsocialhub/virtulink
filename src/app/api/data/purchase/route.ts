import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import crypto from 'crypto';

const OGDAMS_URL = 'https://simhosting.ogdams.ng/api/v1';

const NETWORK_IDS: Record<string, number> = {
  MTN: 1,
  Airtel: 2,
  Glo: 3,
  '9mobile': 4,
};

/*
 * Customer selling prices.
 * Add more Ogdams plan IDs here as you configure their prices.
 */
const SELL_PRICES: Record<string, number> = {
  '9000': 120,
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

    if (!NETWORK_IDS[network]) {
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

    const apiKey = process.env.OGDAMS_API_KEY?.trim();

    if (!apiKey) {
      console.error('OGDAMS_API_KEY is not configured.');

      return NextResponse.json(
        {
          status: false,
          message: 'Data service is temporarily unavailable.',
        },
        { status: 500 }
      );
    }

    /*
     * Verify that the selected plan exists on Ogdams.
     */
    const plansResponse = await fetch(
      `${OGDAMS_URL}/get/data/plans`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: 'application/json',
        },
        cache: 'no-store',
      }
    );

    const plansText = await plansResponse.text();

    let plansData: any;

    try {
      plansData = JSON.parse(plansText);
    } catch {
      console.error(
        'Ogdams plans returned invalid JSON:',
        plansText
      );

      return NextResponse.json(
        {
          status: false,
          message: 'Unable to verify the selected data plan.',
        },
        { status: 502 }
      );
    }

    if (!plansResponse.ok || plansData?.status === false) {
      console.error(
        'Ogdams plans error:',
        JSON.stringify(plansData)
      );

      return NextResponse.json(
        {
          status: false,
          message: 'Unable to verify the selected data plan.',
        },
        { status: 502 }
      );
    }

    const allPlans = Array.isArray(plansData)
      ? plansData
      : Array.isArray(plansData?.data)
        ? plansData.data
        : Array.isArray(plansData?.plans)
          ? plansData.plans
          : [];

    const selectedPlan = allPlans.find(
      (plan: any) =>
        String(
          plan?.planId ??
          plan?.plan_id ??
          plan?.id ??
          ''
        ) === variationCode
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

    const planId = Number(
      selectedPlan?.planId ??
      selectedPlan?.plan_id ??
      selectedPlan?.id
    );

    if (!Number.isFinite(planId)) {
      return NextResponse.json(
        {
          status: false,
          message: 'Invalid data plan received from Ogdams.',
        },
        { status: 400 }
      );
    }

    /*
     * Do not trust the price sent by the browser.
     * The selling price comes from our server-side price table.
     */
    const amount = SELL_PRICES[String(planId)];

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        {
          status: false,
          message:
            'This data plan is not currently available for purchase.',
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
      second: '2-digit',
      hour12: false,
    }).formatToParts(now);

    const dateParts = Object.fromEntries(
      lagosParts.map(({ type, value }) => [type, value])
    );

    const requestId =
      `${dateParts.year}${dateParts.month}${dateParts.day}` +
      `${dateParts.hour}${dateParts.minute}${dateParts.second}` +
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
     * Send the data purchase directly to Ogdams.
     */
    const ogdamsResponse = await fetch(
      `${OGDAMS_URL}/vend/data`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          Accept: 'application/json',
        },
        body: JSON.stringify({
          networkId: NETWORK_IDS[network],
          planId,
          phoneNumber,
          reference: requestId,
        }),
        cache: 'no-store',
      }
    );

    const ogdamsText = await ogdamsResponse.text();

    let ogdamsData: any;

    try {
      ogdamsData = JSON.parse(ogdamsText);
    } catch {
      console.error(
        'Ogdams purchase returned invalid JSON:',
        ogdamsText
      );

      return NextResponse.json(
        {
          status: false,
          message:
            'Data purchase could not be confirmed. Your wallet has not been deducted.',
          requestId,
        },
        { status: 502 }
      );
    }

    console.log(
      'Ogdams Data Response:',
      JSON.stringify(ogdamsData, null, 2)
    );

    /*
     * Ogdams may return HTTP 202 while the transaction is being processed.
     * Do not falsely tell the customer the data was delivered.
     */
    const providerSuccess =
      ogdamsResponse.ok &&
      ogdamsData?.status === true;

    if (!providerSuccess) {
      return NextResponse.json(
        {
          status: false,
          pending: false,
          message:
            ogdamsData?.message ||
            ogdamsData?.response_description ||
            'Data purchase failed. Your wallet has not been deducted.',
          requestId,
        },
        { status: 400 }
      );
    }

    /*
     * Ogdams accepted the transaction.
     * Record it as Pending and deduct the wallet atomically.
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
        service: String(
          selectedPlan?.name ||
          selectedPlan?.planName ||
          'Data Bundle'
        ),
        network,
        phoneNumber,
        amount,
        variationCode,
        planId,
        networkId: NETWORK_IDS[network],
        paymentMethod: 'Wallet',
        reference: requestId,
        provider: 'Ogdams',
        providerReference:
          ogdamsData?.reference ||
          ogdamsData?.data?.reference ||
          ogdamsData?.ref ||
          '',
        status: 'Pending',
        date: now.toISOString(),
        createdAt: FieldValue.serverTimestamp(),
      });
    });

    return NextResponse.json(
      {
        status: true,
        pending: true,
        message:
          `${selectedPlan?.name || 'Data bundle'} purchase has been received and is being processed.`,
        requestId,
        amount,
        network,
        phoneNumber,
      },
      { status: 202 }
    );
  } catch (error: any) {
    console.error('Data Purchase Error:', error);

    return NextResponse.json(
      {
        status: false,
        message:
          error?.message ||
          'Unable to complete the data purchase.',
      },
      { status: 500 }
    );
  }
}
