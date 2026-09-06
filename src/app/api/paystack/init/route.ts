import { NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase-admin';

export async function POST(request: Request) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;

  if (!secretKey) {
    console.error('PAYSTACK_SECRET_KEY is missing from environment variables.');
    return NextResponse.json(
      {
        status: false,
        message: 'Paystack configuration error.',
      },
      { status: 500 }
    );
  }

  try {
    const authorization = request.headers.get('authorization');

    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json(
        {
          status: false,
          message: 'Authentication required.',
        },
        { status: 401 }
      );
    }

    const idToken = authorization.substring('Bearer '.length);
    const decodedToken = await getAdminAuth().verifyIdToken(idToken);

    const email = decodedToken.email;

    if (!email) {
      return NextResponse.json(
        {
          status: false,
          message: 'Your account does not have an email address.',
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const amount = Number(body.amount);

    if (!Number.isFinite(amount) || amount < 100) {
      return NextResponse.json(
        {
          status: false,
          message: 'Minimum funding amount is ₦100.',
        },
        { status: 400 }
      );
    }

    const amountInKobo = Math.round(amount * 100);

    const response = await fetch(
      'https://api.paystack.co/transaction/initialize',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          amount: amountInKobo,
          callback_url:
            'https://virtulink.vercel.app/fund-wallet/success',
        }),
        cache: 'no-store',
      }
    );

    const data = await response.json();

    if (!response.ok || !data.status) {
      console.error('Paystack initialization failed:', data.message);

      return NextResponse.json(
        {
          status: false,
          message: data.message || 'Paystack initialization failed.',
        },
        { status: response.status || 500 }
      );
    }

    return NextResponse.json({
      status: true,
      data: {
        authorization_url: data.data?.authorization_url,
        access_code: data.data?.access_code,
        reference: data.data?.reference,
      },
    });
  } catch (error: any) {
    console.error('Paystack initialization error:', error?.message);

    return NextResponse.json(
      {
        status: false,
        message: 'Unable to initialize Paystack payment.',
      },
      { status: 500 }
    );
  }
}
