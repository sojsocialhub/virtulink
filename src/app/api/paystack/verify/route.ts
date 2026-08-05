
import { NextResponse } from 'next/server';

/**
 * Server-side API route to verify Paystack transactions using the Secret Key.
 * This prevents client-side manipulation of transaction outcomes.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const reference = searchParams.get('reference');
  const secretKey = process.env.PAYSTACK_SECRET_KEY;

  if (!reference) {
    return NextResponse.json({ status: false, message: 'Missing transaction reference' }, { status: 400 });
  }

  if (!secretKey) {
    console.error('PAYSTACK_SECRET_KEY is missing from environment variables.');
    return NextResponse.json({ status: false, message: 'Server configuration error' }, { status: 500 });
  }

  try {
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ 
        status: false, 
        message: data.message || 'Verification request to Paystack failed' 
      }, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Paystack Verification Internal Error:', error);
    return NextResponse.json({ 
      status: false, 
      message: error.message || 'Internal Server Error during verification' 
    }, { status: 500 });
  }
}
