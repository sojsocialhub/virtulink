
import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: Request) {
  try {
    // Verify the logged-in customer
    const authorization = request.headers.get('authorization');

    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json(
        { status: false, message: 'Authentication required.' },
        { status: 401 }
      );
    }

    const idToken = authorization.substring('Bearer '.length);
    const decodedToken = await getAdminAuth().verifyIdToken(idToken);
    const userId = decodedToken.uid;
    const userEmail = decodedToken.email || '';

    const body = await request.json();
    const { productId, productName, amount, reference } = body;

    if (!productId || !productName || !reference) {
      return NextResponse.json(
        {
          status: false,
          message: 'Missing product or payment information.'
        },
        { status: 400 }
      );
    }

    const db = getAdminDb();

    // Make sure this Paystack reference has not already been used.
    const existingPayment = await db
      .collection('purchase_requests')
      .where('reference', '==', reference)
      .limit(1)
      .get();

    if (!existingPayment.empty) {
      return NextResponse.json(
        {
          status: false,
          message: 'This payment has already been processed.'
        },
        { status: 409 }
      );
    }

    const inventoryQuery = await db
      .collection('social_log_inventory')
      .where('productId', '==', productId)
      .where('status', '==', 'available')
      .limit(1)
      .get();

    if (inventoryQuery.empty) {
      return NextResponse.json(
        {
          status: false,
          message: 'This product is currently out of stock.'
        },
        { status: 404 }
      );
    }

    const inventoryDoc = inventoryQuery.docs[0];
    const inventoryRef = inventoryDoc.ref;

    const purchaseRef = db.collection('purchase_requests').doc();

    let deliveredAccount: Record<string, any> | null = null;

    await db.runTransaction(async (transaction) => {
      // Re-read the inventory item inside the transaction.
      const inventorySnap = await transaction.get(inventoryRef);

      if (!inventorySnap.exists) {
        throw new Error('Inventory item no longer exists.');
      }

      const inventoryData = inventorySnap.data() || {};

      // Prevent two customers from receiving the same account.
      if (inventoryData.status !== 'available') {
        throw new Error('This account has already been sold.');
      }

      deliveredAccount = {
        username: inventoryData.username || '',
        email: inventoryData.email || '',
        password: inventoryData.password || '',
        extraDetails: inventoryData.extraDetails || ''
      };

      transaction.update(inventoryRef, {
        status: 'sold',
        soldTo: userId,
        soldToEmail: userEmail,
        soldAt: FieldValue.serverTimestamp(),
        purchaseId: purchaseRef.id
      });

      transaction.set(purchaseRef, {
        userId,
        userEmail,
        productId,
        productName,
        amount: Number(amount) || 0,
        paymentMethod: 'Paystack',
        reference,
        status: 'delivered',
        account: deliveredAccount,
        date: new Date().toISOString(),
        createdAt: FieldValue.serverTimestamp()
      });
    });

    return NextResponse.json({
      status: true,
      message: 'Social Log delivered successfully.',
      purchaseId: purchaseRef.id,
      account: deliveredAccount
    });
  } catch (error: any) {
    console.error('Social Log Delivery Error:', error);

    return NextResponse.json(
      {
        status: false,
        message:
          error?.message || 'Unable to deliver the Social Log.'
      },
      { status: 500 }
    );
  }
}
