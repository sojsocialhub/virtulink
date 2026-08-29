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

    const {
      serviceId,
      reference,
      targetLink,
      quantity,
      comments
    } = body;

    if (!serviceId || !reference) {
      return NextResponse.json(
        { status: false, message: 'Missing BOOST information.' },
        { status: 400 }
      );
    }

    if (!targetLink || !String(targetLink).trim()) {
      return NextResponse.json(
        { status: false, message: 'Target link is required.' },
        { status: 400 }
      );
    }

    const requestedQuantity = Number(quantity);

    if (!Number.isFinite(requestedQuantity) || requestedQuantity <= 0) {
      return NextResponse.json(
        { status: false, message: 'Invalid quantity.' },
        { status: 400 }
      );
    }

    const db = getAdminDb();

    const purchaseRef = db.collection('boost_orders').doc();
    const transactionRef = db.collection('transactions').doc();

    let finalAmount = 0;

    await db.runTransaction(async (transaction) => {
      const userRef = db.collection('users').doc(userId);
      const serviceRef = db.collection('social_services').doc(serviceId);

      const [userSnap, serviceSnap] = await Promise.all([
        transaction.get(userRef),
        transaction.get(serviceRef)
      ]);

      if (!userSnap.exists) {
        throw new Error('Customer account not found.');
      }

      if (!serviceSnap.exists) {
        throw new Error('BOOST service not found.');
      }

      const userData = userSnap.data() || {};
      const serviceData = serviceSnap.data() || {};

      if (
        serviceData.category !== 'boost' ||
        serviceData.active !== true
      ) {
        throw new Error('BOOST service unavailable.');
      }

      const baseQuantity = Number(serviceData.quantity || 0);

      const basePrice = Number(
        serviceData.sellingPrice ??
        serviceData.sellingprice ??
        0
      );

      if (baseQuantity <= 0 || basePrice <= 0) {
        throw new Error('Invalid BOOST service pricing.');
      }

      finalAmount = Math.ceil(
        (basePrice / baseQuantity) * requestedQuantity
      );

      const walletBalance = Number(userData.walletBalance || 0);

      if (walletBalance < finalAmount) {
        throw new Error('Insufficient wallet balance.');
      }

      transaction.update(userRef, {
        walletBalance: walletBalance - finalAmount
      });

      transaction.set(purchaseRef, {
        userId,
        userEmail,
        serviceId,

        platform: serviceData.platform,
        service: serviceData.service,

        targetLink: String(targetLink).trim(),
        quantity: requestedQuantity,
        comments: String(comments || '').trim(),

        amount: finalAmount,

        deliveryTime:
          serviceData.deliveryTime ??
          serviceData.deliverytime ??
          'Pending',

        status: 'Pending',
        paymentMethod: 'Wallet',
        reference,

        createdAt: FieldValue.serverTimestamp()
      });

      transaction.set(transactionRef, {
        userId,
        userEmail,

        type: 'boost',

        service: serviceData.service,

        productName:
          `${serviceData.platform} ${serviceData.service} (${requestedQuantity})`,

        productId: serviceId,

        amount: finalAmount,

        paymentMethod: 'Wallet',
        reference,

        status: 'Pending',

        date: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp(),

        purchaseId: purchaseRef.id
      });
    });

    return NextResponse.json({
      status: true,
      message: 'BOOST order created successfully.',
      amount: finalAmount
    });

  } catch (error: any) {
    return NextResponse.json(
      {
        status: false,
        message: error.message || 'BOOST purchase failed.'
      },
      { status: 500 }
    );
  }
}
