import { NextResponse } from 'next/server';
import { no1verifyProducts, No1VerifyError } from '@/lib/no1verify';
import { getAdminDb } from '@/lib/firebase-admin';
import { normalizeSettings, sellingPriceNaira } from '@/lib/no1verify-pricing';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10) || 1, 1);
    const q = (searchParams.get('q') || '').slice(0, 80);

    const result = await no1verifyProducts({ page, limit: 20, q });
    const settingsSnap = await getAdminDb().collection('no1verify_settings').doc('pricing').get();
    const settings = normalizeSettings(settingsSnap.exists ? settingsSnap.data() : {});

    const items = result.items
      .filter((p: any) => p && p.is_active !== false)
      .map((p: any) => {
        const stock = Number(p.stock_value || 0);
        const price = sellingPriceNaira(p.id, p.market_price_cents, settings);
        return {
          id: p.id,
          title: String(p.title || ''),
          description: String(p.description || '').slice(0, 300),
          category: String(p.provider_category || ''),
          price,
          stock,
          outOfStock: Boolean(p.is_out_of_stock) || stock <= 0,
          forSale: price > 0 && !p.is_out_of_stock && stock > 0,
        };
      });

    return NextResponse.json({ status: true, items, pagination: result.pagination });
  } catch (error: any) {
    console.error('No1Verify products error:', error);
    const message =
      error instanceof No1VerifyError
        ? 'The product catalog is temporarily unavailable.'
        : 'Unable to load products.';
    return NextResponse.json({ status: false, message }, { status: 502 });
  }
}
