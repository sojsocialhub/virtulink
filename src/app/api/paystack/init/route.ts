
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  
  if (!secretKey) {
    console.error('PAYSTACK_SECRET_KEY is missing from environment variables');
    return NextResponse.json({ error: 'Paystack configuration error. Please contact admin.' }, { status: 500 });
  }

  try {
    const { email, amount, callback_url } = await request.json();

    if (!email || !amount || isNaN(amount)) {
      return NextResponse.json({ error: 'Invalid email or amount' }, { status: 400 });
    }

    // Paystack expects amount in kobo (Naira * 100)
    const amountInKobo = Math.round(Number(amount) * 100);

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: amountInKobo,
        callback_url,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      return NextResponse.json({ status: false, message: data.message || 'Paystack initialization failed' }, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Paystack Init Route Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
