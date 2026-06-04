
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  
  if (!secretKey) {
    console.error('DEBUG: PAYSTACK_SECRET_KEY is missing from environment variables.');
    return NextResponse.json({ 
      status: false, 
      message: 'Paystack configuration error: PAYSTACK_SECRET_KEY is not set.' 
    }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { email, amount, callback_url } = body;

    console.log('DEBUG: Received init request:', { email, amount, callback_url });

    if (!email || !amount || isNaN(amount)) {
      return NextResponse.json({ 
        status: false, 
        message: 'Invalid email or amount' 
      }, { status: 400 });
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
    
    console.log('DEBUG: Paystack API Response:', data);

    if (!response.ok) {
      return NextResponse.json({ 
        status: false, 
        message: data.message || 'Paystack initialization failed' 
      }, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('DEBUG: Paystack Init Route Error:', error);
    return NextResponse.json({ 
      status: false, 
      message: error.message || 'Internal Server Error' 
    }, { status: 500 });
  }
}
