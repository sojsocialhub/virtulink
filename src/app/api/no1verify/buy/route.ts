import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { no1verifyProduct, no1verifyWalletKobo, no1verifyPlaceOrder, No1VerifyError } from '@/lib/no1verify';
import { normalizeSettings, sellingPriceNaira } from '@/lib/no1verify-pricing';

export const dynamic = 'force-dynamic';

const fail = (message: string, status = 400) =>
  NextResponse.json({ status: false, message }, { status });

class UserFacing extends Error {}

export async function POST(request: Request) {
  try {
    const header = request.headers.get('authorization') || '';
    if (!header.startsWith('Bearer ')) return fail('Authentication required.', 401);
    const decoded = await getAdminAuth().verifyIdToken(header.substring(7));
    const userId = decoded.uid;
    const body = await request.json();
    const productId = Number(body?.productId);
    const reference = String(body?.reference || '');
    if (!Number.isInteger(productId) || productId <= 0 || !/^[A-Za-z0-9_-]{8,40}$/.test(reference)) {
      return fail('Invalid request.');
    }
    const db = getAdminDb();

    const product = await no1verifyProduct(productId);
    if (!product || product.is_active === false) return fail('This product is not available.');
    if (product.is_out_of_stock || Number(product.stock_value) <= 0) return fail('This product is out of stock.');
    const costKobo = Number(product.market_price_cents) || 0;
    const settingsSnap = await db.collection('no1verify_settings').doc('pricing').get();
    const settings = normalizeSettings(settingsSnap.exists ? settingsSnap.data() : {});
    const price = sellingPriceNaira(productId, costKobo, settings);
    if (price <= 0) return fail('This product is not for sale.');
    const supplierKobo = await no1verifyWalletKobo();
    if (supplierKobo < costKobo) return fail('This product is temporarily unavailable. Please try again later.');
    const orderRef = db.collection('no1verify_orders').doc(reference);
    const userRef = db.collection('users').doc(userId);
    const title = String(product.title || 'Verified Log').slice(0, 200);

    await db.runTransaction(async (tx) => {
      const [userSnap, orderSnap] = await Promise.all([tx.get(userRef), tx.get(orderRef)]);
      if (orderSnap.exists) throw new UserFacing('This purchase was already submitted.');
      if (!userSnap.exists) throw new UserFacing('Customer account was not found.');
      const balance = Number(userSnap.data()?.walletBalance || 0);
      if (balance < price) throw new UserFacing('Insufficient wallet balance. Please fund your wallet.');
      tx.update(userRef, { walletBalance: balance - price });
      tx.set(orderRef, {
        userId, userEmail: decoded.email || '', productId, title, price,
        costKobo, status: 'processing', reference, createdAt: FieldValue.serverTimestamp(),
      });
    });

    try {
      const result = await no1verifyPlaceOrder(productId, reference);
      const order = result?.data?.order;
      const delivery: string[] = Array.isArray(order?.delivery) ? order.delivery.map((d: any) => String(d)) : [];
      if (!order || delivery.length === 0) throw new No1VerifyError('Delivery missing.', 'ambiguous');
      await orderRef.update({
        status: 'delivered', delivery, supplierOrderId: String(order.id ?? ''),
        supplierChargeKobo: Number(order.total_cents ?? 0), deliveredAt: FieldValue.serverTimestamp(),
      });
      return NextResponse.json({ status: true, orderId: reference, title, price, delivery });

    } catch (error: any) {
      if (error instanceof No1VerifyError && error.kind === 'confirmed') {
        await db.runTransaction(async (tx) => {
          const [u, o] = await Promise.all([tx.get(userRef), tx.get(orderRef)]);
          if (!o.exists || o.data()?.status !== 'processing') return;
          tx.update(userRef, { walletBalance: Number(u.data()?.walletBalance || 0) + price });
          tx.update(orderRef, { status: 'failed', refunded: true, failureReason: String(error.message).slice(0, 200), failureCode: error.code || '' });
        });
        return fail('Your order could not be completed and your wallet was refunded.', 502);
      }
      await orderRef.update({
        status: 'review', reviewReason: String(error?.message || 'Unknown result').slice(0, 200),
        reviewAt: FieldValue.serverTimestamp(),
      }).catch(() => {});
      return NextResponse.json({
        status: false, pending: true, orderId: reference,
        message: 'Your order is being processed. Check your orders shortly, or contact support with this order number.',
      }, { status: 202 });
    }
  } catch (error: any) {
    if (error instanceof UserFacing) return fail(error.message);
    console.error('No1Verify buy error:', error);
    return fail('Unable to complete your purchase.', 500);
  }
}
