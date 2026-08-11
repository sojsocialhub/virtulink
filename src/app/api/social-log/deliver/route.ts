import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: Request) {
  try {
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
    const { productId, reference } = body;

    if (!productId || !reference) {
      return NextResponse.json(
        {
          status: false,
          message: 'Missing product or payment information.'
        },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const purchaseRef = db.collection('purchase_requests').doc();
    const transactionRef = db.collection('transactions').doc();

    let deliveredAccount: Record<string, any> | null = null;
    let finalAmount = 0;
    let finalProductName = '';

    await db.runTransaction(async (transaction) => {
      const userRef = db.collection('users').doc(userId);
      const productRef = db.collection('Sociallogs').doc(productId);

      const existingPaymentQuery = await db
        .collection('purchase_requests')
        .where('reference', '==', reference)
        .limit(1)
        .get();

      if (!existingPaymentQuery.empty) {
        throw new Error('This payment has already been processed.');
      }

      const [userSnap, productSnap] = await Promise.all([
        transaction.get(userRef),
        transaction.get(productRef)
      ]);

      if (!userSnap.exists) {
        throw new Error('Customer account was not found.');
      }

      if (!productSnap.exists) {
        throw new Error('This Social Log product no longer exists.');
      }

      const userData = userSnap.data() || {};
      const productData = productSnap.data() || {};

      finalProductName = String(productData.name || 'Social Account');
      finalAmount = Number(productData.price);

      if (!Number.isFinite(finalAmount) || finalAmount <= 0) {
        throw new Error('This product has an invalid price.');
      }

      const inventoryQuery = await db
        .collection('social_log_inventory')
        .where('productId', '==', productId)
        .where('status', '==', 'available')
        .limit(1)
        .get();

      if (inventoryQuery.empty) {
        throw new Error('This product is currently out of stock.');
      }

      const inventoryDoc = inventoryQuery.docs[0];
      const inventoryRef = inventoryDoc.ref;

      const inventorySnap = await transaction.get(inventoryRef);

      if (!inventorySnap.exists) {
        throw new Error('Inventory item no longer exists.');
      }

      const inventoryData = inventorySnap.data() || {};

      if (inventoryData.status !== 'available') {
        throw new Error('This account has already been sold.');
      }

      const walletBalance = Number(userData.walletBalance || 0);

      if (walletBalance < finalAmount) {
        throw new Error(
          `Insufficient wallet balance. Price: ₦${finalAmount.toLocaleString()}, Balance: ₦${walletBalance.toLocaleString()}.`
        );
      }

      deliveredAccount = {
        username: inventoryData.username || '',
        email: inventoryData.email || '',
        password: inventoryData.password || '',
        extraDetails: inventoryData.extraDetails || ''
      };

      const newBalance = walletBalance - finalAmount;

      transaction.update(userRef, {
        walletBalance: newBalance
      });

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
        productName: finalProductName,
        amount: finalAmount,
        paymentMethod: 'Wallet',
        reference,
        status: 'delivered',
        account: deliveredAccount,
        date: new Date().toISOString(),
        createdAt: FieldValue.serverTimestamp()
      });

      transaction.set(transactionRef, {
        userId,
        userEmail,
        type: 'social_log',
        service: 'Social Log',
        productName: finalProductName,
        productId,
        amount: finalAmount,
        paymentMethod: 'Wallet',
        reference,
        status: 'Completed',
        date: new Date().toISOString(),
        createdAt: FieldValue.serverTimestamp(),
        purchaseId: purchaseRef.id
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
          error?.message ||
          'Unable to complete the Social Log purchase.'
      },
      { status: 500 }
    );
  }
}
