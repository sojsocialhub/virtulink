import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const reference = searchParams.get('reference');
  const authorization = request.headers.get('authorization');
  const secretKey = process.env.PAYSTACK_SECRET_KEY;

  if (!reference) {
    return NextResponse.json(
      { status: false, message: 'Missing transaction reference' },
      { status: 400 }
    );
  }

  if (!authorization?.startsWith('Bearer ')) {
    return NextResponse.json(
      { status: false, message: 'Authentication required' },
      { status: 401 }
    );
  }

  if (!secretKey) {
    console.error('PAYSTACK_SECRET_KEY is missing from environment variables.');
    return NextResponse.json(
      { status: false, message: 'Server configuration error' },
      { status: 500 }
    );
  }

  try {
    const idToken = authorization.substring('Bearer '.length);
    const decodedToken = await getAdminAuth().verifyIdToken(idToken);
    const userId = decodedToken.uid;

    const existingTx = await getAdminDb()
      .collection('transactions')
      .where('reference', '==', reference)
      .where('userId', '==', userId)
      .limit(1)
      .get();

    if (!existingTx.empty) {
      const txData = existingTx.docs[0].data();

      return NextResponse.json({
        status: true,
        data: {
          status: 'success',
          amount: Number(txData.amount) * 100,
          reference,
        },
        alreadyProcessed: true,
      });
    }

    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          status: false,
          message: data.message || 'Verification request to Paystack failed',
        },
        { status: response.status }
      );
    }

    if (!data.status || data.data?.status !== 'success') {
      return NextResponse.json({
        status: false,
        message: data.message || 'Paystack could not confirm this transaction.',
      });
    }

    const paystackEmail = data.data?.customer?.email?.toLowerCase();
    const userEmail = decodedToken.email?.toLowerCase();

    if (!paystackEmail || !userEmail || paystackEmail !== userEmail) {
      return NextResponse.json({
        status: false,
        message: "This payment does not belong to the authenticated user.",
      }, { status: 403 });
    }

    const paidAmount = Number(data.data.amount) / 100;

    if (!Number.isFinite(paidAmount) || paidAmount <= 0) {
      return NextResponse.json(
        { status: false, message: 'Invalid payment amount.' },
        { status: 400 }
      );
    }

    const userRef = getAdminDb().collection('users').doc(userId);
    const transactionRef = getAdminDb().collection('transactions').doc();

    await getAdminDb().runTransaction(async (transaction) => {
      const userSnap = await transaction.get(userRef);

      if (!userSnap.exists) {
        throw new Error('User account not found.');
      }

      const userData = userSnap.data() || {};
      const currentBalance = Number(userData.walletBalance || 0);

      transaction.update(userRef, {
        walletBalance: currentBalance + paidAmount,
      });

      transaction.set(transactionRef, {
        userId,
        type: 'funding',
        amount: paidAmount,
        status: 'Completed',
        service: 'Paystack Instant Funding',
        date: new Date().toISOString(),
        reference,
        method: 'Paystack',
        createdAt: FieldValue.serverTimestamp(),
      });
    });

    return NextResponse.json({
      status: true,
      data: {
        status: 'success',
        amount: data.data.amount,
        reference,
      },
    });
  } catch (error: any) {
    console.error('Paystack Verification Internal Error:', error);

    return NextResponse.json(
      {
        status: false,
        message: error?.message || 'Internal Server Error during verification',
      },
      { status: 500 }
    );
  }
}
