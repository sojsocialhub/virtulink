import { NextResponse } from 'next/server';

const OGDAMS_URL = 'https://simhosting.ogdams.ng/api/v1';

const NETWORK_IDS: Record<string, number> = {
  MTN: 1,
  Airtel: 2,
  Glo: 3,
  '9mobile': 4,
};

/*
 * Customer selling prices.
 * Plan 9000 = Airtel 150MB Awoof = ₦120
 */
const SELL_PRICES: Record<string, number> = {
  '9000': 120,
};

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
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

    const { searchParams } = new URL(request.url);
    const network = String(searchParams.get('network') || '').trim();

    const networkId = NETWORK_IDS[network];

    if (!networkId) {
      return NextResponse.json(
        {
          status: false,
          message: 'Invalid network selected.',
        },
        { status: 400 }
      );
    }

    const response = await fetch(
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

    const text = await response.text();

    let data: any;

    try {
      data = JSON.parse(text);
    } catch {
      console.error(
        'Ogdams plans returned invalid JSON:',
        text
      );

      return NextResponse.json(
        {
          status: false,
          message:
            `Ogdams returned an invalid response (HTTP ${response.status}).`,
        },
        { status: 502 }
      );
    }

    if (!response.ok || data?.status === false) {
      console.error(
        'Ogdams plans error:',
        JSON.stringify(data)
      );

      return NextResponse.json(
        {
          status: false,
          message:
            data?.message ||
            'Unable to load data plans.',
        },
        { status: 502 }
      );
    }

    const allPlans = Array.isArray(data)
      ? data
      : Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data?.plans)
          ? data.plans
          : [];

    const plans = allPlans
      .map((plan: any) => {
        const planId = String(
          plan?.planId ??
          plan?.plan_id ??
          plan?.id ??
          ''
        );

        const planNetworkId = Number(
          plan?.networkId ??
          plan?.network_id ??
          plan?.network ??
          0
        );

        const sellPrice = SELL_PRICES[planId];

        return {
          id: planId,
          variationCode: planId,
          name: String(
            plan?.name ||
            plan?.planName ||
            plan?.plan_name ||
            ''
          ),
          price: sellPrice,
          fixedPrice: true,
          network,
          description: 'Ogdams data bundle',
          providerPrice: Number(
            plan?.price ??
            plan?.amount ??
            plan?.sellingPrice ??
            0
          ),
          planNetworkId,
        };
      })
      .filter(
        (plan: any) =>
          plan.id &&
          plan.name &&
          plan.planNetworkId === networkId &&
          Number.isFinite(plan.price) &&
          plan.price > 0
      );

    return NextResponse.json({
      status: true,
      network,
      networkId,
      plans,
    });
  } catch (error: any) {
    console.error('Data Plans Error:', error);

    return NextResponse.json(
      {
        status: false,
        message:
          error?.message ||
          'Unable to connect to Ogdams.',
      },
      { status: 502 }
    );
  }
}
