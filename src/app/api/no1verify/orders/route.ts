import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const header = request.headers.get('authorization') || '';
    if (!header.startsWith('Bearer ')) {
      return NextResponse.json({ status: false, message: 'Authentication required.' }, { status: 401 });
    }
    const decoded = await getAdminAuth().verifyIdToken(header.substring(7));
    const snap = await getAdminDb().collection('no1verify_orders').where('userId', '==', decoded.uid).get();
    const orders = snap.docs
      .map((d) => {
        const o: any = d.data();
        const created = o.createdAt?.toMillis ? o.createdAt.toMillis() : 0;
        return {
          id: d.id,
          title: String(o.title || ''),
          price: Number(o.price || 0),
          status: String(o.status || ''),
          created,
          delivery: o.status === 'delivered' && Array.isArray(o.delivery) ? o.delivery : [],
        };
      })
      .sort((a, b) => b.created - a.created)
      .slice(0, 50);
    return NextResponse.json({ status: true, orders });
  } catch (error) {
    console.error('No1Verify orders error:', error);
    return NextResponse.json({ status: false, message: 'Unable to load orders.' }, { status: 500 });
  }
}
