import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

const SMM_API_URL = process.env.SMM_API_URL;
const SMM_API_KEY = process.env.SMM_API_KEY;

export async function POST(request: Request) {
  try {
    const authorization = request.headers.get('authorization');

    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json(
        { status: false, message: 'Authentication required.' },
        { status: 401 }
      );
    }

    if (!SMM_API_URL || !SMM_API_KEY) {
      return NextResponse.json(
        {
          status: false,
          message: 'BOOST provider is not configured.'
        },
        { status: 503 }
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
    const userRef = db.collection('users').doc(userId);
    const serviceRef = db.collection('social_services').doc(serviceId);

    // Read customer and service before sending to the external provider.
    const [userSnap, serviceSnap] = await Promise.all([
      userRef.get(),
      serviceRef.get()
    ]);

    if (!userSnap.exists) {
      return NextResponse.json(
        { status: false, message: 'Customer account not found.' },
        { status: 404 }
      );
    }

    if (!serviceSnap.exists) {
      return NextResponse.json(
        { status: false, message: 'BOOST service not found.' },
        { status: 404 }
      );
    }

    const userData = userSnap.data() || {};
    const serviceData = serviceSnap.data() || {};

    if (
      serviceData.category !== 'boost' ||
      serviceData.active !== true
    ) {
      return NextResponse.json(
        { status: false, message: 'BOOST service unavailable.' },
        { status:400 }
      );
    }

    const providerServiceId =
      serviceData.providerServiceId ??
      serviceData.provider_service_id;

    if (
      providerServiceId === undefined ||
      providerServiceId === null ||
      String(providerServiceId).trim() === ''
    ) {
      return NextResponse.json(
        {
          status: false,
          message:
            'This BOOST service has not been connected to an SMM provider service yet.'
        },
        { status: 400 }
      );
    }

    const baseQuantity = Number(serviceData.quantity || 0);

    const basePrice = Number(
      serviceData.sellingPrice ??
      serviceData.sellingprice ??
      0
    );

    if (baseQuantity <= 0 || basePrice <= 0) {
      return NextResponse.json(
        { status: false, message: 'Invalid BOOST service pricing.' },
        { status: 400 }
      );
    }

    const finalAmount = Math.ceil(
      (basePrice / baseQuantity) * requestedQuantity
    );

    const walletBalance = Number(userData.walletBalance || 0);

    if (walletBalance < finalAmount) {
      return NextResponse.json(
        { status: false, message: 'Insufficient wallet balance.' },
        { status: 400 }
      );
    }

    // Send order to SMM Provider.
    const formData = new URLSearchParams({
      key: SMM_API_KEY,
      action: 'add',
      service: String(providerServiceId),
      link: String(targetLink).trim(),
      quantity: String(requestedQuantity)
    });

    // Only send comments when the customer entered them.
    if (comments && String(comments).trim()) {
      formData.append('comments', String(comments).trim());
    }

    const providerResponse = await fetch(SMM_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString(),
      cache: 'no-store'
    });

    const providerData = await providerResponse.json().catch(() => ({}));

    if (
      !providerResponse.ok ||
      providerData.error ||
      !providerData.order
    ) {
      console.error('SMM Provider order failed:', providerData);

      return NextResponse.json(
        {
          status: false,
          message:
            providerData.error ||
            'BOOST provider could not accept this order.'
        },
        { status: 400 }
      );
    }

    const providerOrderId = String(providerData.order);

    const purchaseRef = db.collection('boost_orders').doc();
    const transactionRef = db.collection('transactions').doc();

    // Provider accepted the order. Now safely deduct wallet and save records.
    await db.runTransaction(async (transaction) => {
      const latestUserSnap = await transaction.get(userRef);

      if (!latestUserSnap.exists) {
        throw new Error('Customer account not found.');
      }

      const latestUserData = latestUserSnap.data() || {};
      const latestBalance = Number(
        latestUserData.walletBalance || 0
      );

      if (latestBalance < finalAmount) {
        throw new Error(
          'Insufficient wallet balance. Your BOOST order was not charged.'
        );
      }

      transaction.update(userRef, {
        walletBalance: latestBalance - finalAmount
      });

      transaction.set(purchaseRef, {
        userId,
        userEmail,
        serviceId,
        providerServiceId: String(providerServiceId),
        providerOrderId,

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
        providerStatus: 'Pending',
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
        providerOrderId,

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
      message: 'BOOST order sent successfully.',
      amount: finalAmount,
      providerOrderId
    });

  } catch (error: any) {
    console.error('BOOST purchase error:', error);

    return NextResponse.json(
      {
        status: false,
        message: error.message || 'BOOST purchase failed.'
      },
      { status: 500 }
    );
  }
}
