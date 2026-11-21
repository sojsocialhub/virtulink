import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { no1verifyPlaceOrder, No1VerifyError } from '@/lib/no1verify';

export const dynamic = 'force-dynamic';

async function requireAdmin(request: Request) {
  const header = request.headers.get('authorization') || '';
  if (!header.startsWith('Bearer ')) return null;
  const decoded = await getAdminAuth().verifyIdToken(header.substring(7));
  const snap = await getAdminDb().collection('users').doc(decoded.uid).get();
  return snap.exists && snap.data()?.role === 'admin' ? decoded.uid : null;
}

export async function GET(request: Request) {
  try {
    if (!(await requireAdmin(request))) {
      return NextResponse.json({ status: false, message: 'Admin access required.' }, { status: 403 });
    }
    const snap = await getAdminDb().collection('no1verify_orders').where('status', 'in', ['processing', 'review']).get();
    const orders = snap.docs.map((d) => {
      const o: any = d.data();
      return {
        id: d.id, userEmail: String(o.userEmail || ''), title: String(o.title || ''), price: Number(o.price || 0),
        status: String(o.status || ''), reason: String(o.reviewReason || ''),
        created: o.createdAt?.toMillis ? o.createdAt.toMillis() : 0,
      };
    }).sort((a, b) => b.created - a.created);
    return NextResponse.json({ status: true, orders });
  } catch (error) {
    console.error('No1Verify admin orders error:', error);
    return NextResponse.json({ status: false, message: 'Unable to load orders.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!(await requireAdmin(request))) {
      return NextResponse.json({ status: false, message: 'Admin access required.' }, { status: 403 });
    }
    const body = await request.json();
    const id = String(body?.orderId || '');
    const action = String(body?.action || '');
    if (!/^[A-Za-z0-9_-]{8,40}$/.test(id) || !['resolve', 'refund'].includes(action)) {
      return NextResponse.json({ status: false, message: 'Invalid request.' }, { status: 400 });
    }
    const db = getAdminDb();
    const orderRef = db.collection('no1verify_orders').doc(id);
    const orderSnap = await orderRef.get();
    const order: any = orderSnap.data();
    if (!orderSnap.exists || !['processing', 'review'].includes(order?.status)) {
      return NextResponse.json({ status: false, message: 'This order is not waiting for review.' }, { status: 400 });
    }
    const userRef = db.collection('users').doc(String(order.userId));
    const refund = async (reason: string) => {
      await db.runTransaction(async (tx) => {
        const [u, o] = await Promise.all([tx.get(userRef), tx.get(orderRef)]);
        if (!o.exists || !['processing', 'review'].includes(o.data()?.status)) throw new Error('Order already handled.');
        tx.update(userRef, { walletBalance: Number(u.data()?.walletBalance || 0) + Number(order.price || 0) });
        tx.update(orderRef, { status: 'failed', refunded: true, failureReason: reason.slice(0, 200), resolvedAt: FieldValue.serverTimestamp() });
      });
    };
    if (action === 'refund') {
      await refund('Refunded by admin');
      return NextResponse.json({ status: true, message: 'Customer refunded.' });
    }
    try {
      const result = await no1verifyPlaceOrder(Number(order.productId), id);
      const placed = result?.data?.order;
      const delivery: string[] = Array.isArray(placed?.delivery) ? placed.delivery.map((d: any) => String(d)) : [];
      if (!placed || delivery.length === 0) throw new No1VerifyError('Delivery missing.', 'ambiguous');
      await orderRef.update({
        status: 'delivered', delivery, supplierOrderId: String(placed.id ?? ''),
        supplierChargeKobo: Number(placed.total_cents ?? 0), deliveredAt: FieldValue.serverTimestamp(),
      });
      return NextResponse.json({ status: true, message: 'Order delivered to the customer.' });
    } catch (error: any) {
      if (error instanceof No1VerifyError && error.kind === 'confirmed') {
        await refund(String(error.message));
        return NextResponse.json({ status: true, message: 'Supplier rejected the order. Customer refunded.' });
      }
      return NextResponse.json({ status: false, message: 'Still unknown. Try again later.' }, { status: 202 });
    }
  } catch (error) {
    console.error('No1Verify admin action error:', error);
    return NextResponse.json({ status: false, message: 'Action failed.' }, { status: 500 });
  }
}
