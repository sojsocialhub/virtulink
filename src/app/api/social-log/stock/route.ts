import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productIds = searchParams.get('productIds');

    if (!productIds) {
      return NextResponse.json(
        { status: false, message: 'Product IDs are required.' },
        { status: 400 }
      );
    }

    const ids = productIds
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean)
      .slice(0, 100);

    const db = getAdminDb();
    const stock: Record<string, number> = {};

    await Promise.all(
      ids.map(async (productId) => {
        const snapshot = await db
          .collection('social_log_inventory')
          .where('productId', '==', productId)
          .where('status', '==', 'available')
          .get();

        stock[productId] = snapshot.size;
      })
    );

    return NextResponse.json({
      status: true,
      stock,
    });
  } catch (error: any) {
    console.error('Social Log Stock Error:', error);

    return NextResponse.json(
      {
        status: false,
        message: error?.message || 'Unable to check product stock.',
      },
      { status: 500 }
    );
  }
}
