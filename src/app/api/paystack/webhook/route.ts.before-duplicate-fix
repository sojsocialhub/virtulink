import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase-admin';

export async function POST(request: Request) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;

  if (!secretKey) {
    return NextResponse.json(
      { status: false, message: 'Server configuration error' },
      { status: 500 }
    );
  }

  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-paystack-signature');

    if (!signature) {
      return NextResponse.json(
        { status: false, message: 'Missing Paystack signature' },
        { status: 401 }
      );
    }

    const expectedSignature = crypto
      .createHmac('sha512', secretKey)
      .update(rawBody)
      .digest('hex');

    if (
      !crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      )
    ) {
      return NextResponse.json(
        { status: false, message: 'Invalid Paystack signature' },
        { status: 401 }
      );
    }

    const event = JSON.parse(rawBody);

    if (event.event !== 'charge.success') {
      return NextResponse.json({ status: true, message: 'Event ignored' });
    }

    const payment = event.data;
    const reference = payment?.reference;

    if (!reference || payment?.status !== 'success') {
      return NextResponse.json({ status: true, message: 'Payment not successful' });
    }

    const email = payment.customer?.email?.toLowerCase();
    const amount = Number(payment.amount) / 100;

    if (!email || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { status: false, message: 'Invalid payment data' },
        { status: 400 }
      );
    }

    const db = getAdminDb();

    const existing = await db
      .collection('transactions')
      .where('reference', '==', reference)
      .limit(1)
      .get();

    if (!existing.empty) {
      return NextResponse.json({
        status: true,
        message: 'Payment already processed'
      });
    }

    const users = await db
      .collection('users')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (users.empty) {
      console.error('Paystack webhook: user not found for email:', email);

      return NextResponse.json(
        { status: false, message: 'User account not found' },
        { status: 404 }
      );
    }

    const userRef = users.docs[0].ref;
    const transactionRef = db.collection('transactions').doc();

    await db.runTransaction(async (transaction) => {
      const userSnap = await transaction.get(userRef);

      if (!userSnap.exists) {
        throw new Error('User account not found.');
      }

      const userData = userSnap.data() || {};
      const currentBalance = Number(userData.walletBalance || 0);

      transaction.update(userRef, {
        walletBalance: currentBalance + amount,
      });

      transaction.set(transactionRef, {
        userId: userRef.id,
        type: 'funding',
        amount,
        status: 'Completed',
        service: 'Paystack Instant Funding',
        date: new Date().toISOString(),
        reference,
        method: 'Paystack',
        createdAt: FieldValue.serverTimestamp(),
      });
    });

    console.log(
      `Paystack webhook credited ₦${amount} to user ${userRef.id}. Reference: ${reference}`
    );

    return NextResponse.json({
      status: true,
      message: 'Payment processed successfully'
    });
  } catch (error: any) {
    console.error('Paystack Webhook Error:', error);

    return NextResponse.json(
      {
        status: false,
        message: error?.message || 'Webhook processing failed'
      },
      { status: 500 }
    );
  }
}
