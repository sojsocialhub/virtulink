import { NextResponse } from 'next/server';

const VTPASS_VARIATIONS_URL =
  'https://sandbox.vtpass.com/api/service-variations';

const NETWORK_SERVICE_IDS: Record<string, string> = {
  MTN: 'mtn-data',
  Airtel: 'airtel-data',
  Glo: 'glo-data',
  '9mobile': 'etisalat-data',
};

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const apiKey = process.env.VTPASS_API_KEY?.trim();
    const publicKey = process.env.VTPASS_PUBLIC_KEY?.trim();

    if (!apiKey || !publicKey) {
      return NextResponse.json(
        {
          status: false,
          message: 'VTpass credentials are not configured.',
        },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const network = String(searchParams.get('network') || '').trim();

    const serviceID = NETWORK_SERVICE_IDS[network];

    if (!serviceID) {
      return NextResponse.json(
        {
          status: false,
          message: 'Invalid network selected.',
        },
        { status: 400 }
      );
    }

    const url =
      `${VTPASS_VARIATIONS_URL}?serviceID=${encodeURIComponent(serviceID)}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'api-key': apiKey,
        'public-key': publicKey,
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    const text = await response.text();

    let data: any;

    try {
      data = JSON.parse(text);
    } catch {
      return NextResponse.json(
        {
          status: false,
          message: `VTpass returned an invalid response (HTTP ${response.status}).`,
        },
        { status: 502 }
      );
    }

    if (!response.ok || data?.response_description !== '000') {
      return NextResponse.json(
        {
          status: false,
          message:
            data?.response_description ||
            `VTpass request failed (HTTP ${response.status}).`,
        },
        { status: 502 }
      );
    }

    const variations = Array.isArray(data?.content?.variations)
      ? data.content.variations
      : [];

    const plans = variations
      .map((plan: any) => ({
        id: String(plan.variation_code || ''),
        variationCode: String(plan.variation_code || ''),
        name: String(plan.name || ''),
        price: Number(plan.variation_amount || 0),
        fixedPrice: plan.fixedPrice === 'Yes',
        network,
        description: 'VTpass data bundle',
      }))
      .filter(
        (plan: any) =>
          plan.id &&
          plan.variationCode &&
          plan.name &&
          Number.isFinite(plan.price) &&
          plan.price > 0
      );

    return NextResponse.json({
      status: true,
      network,
      serviceID,
      plans,
    });
  } catch (error: any) {
    console.error('Data Plans Error:', error);

    return NextResponse.json(
      {
        status: false,
        message:
          error?.message ||
          'Unable to connect to VTpass. Please try again.',
      },
      { status: 502 }
    );
  }
}
