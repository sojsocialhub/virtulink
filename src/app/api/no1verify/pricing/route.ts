import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { normalizeSettings } from '@/lib/no1verify-pricing';

export const dynamic = 'force-dynamic';

async function requireAdmin(request: Request) {
  const header = request.headers.get('authorization') || '';
  if (!header.startsWith('Bearer ')) return null;
  const decoded = await getAdminAuth().verifyIdToken(header.substring(7));
  const snap = await getAdminDb().collection('users').doc(decoded.uid).get();
  return snap.exists && snap.data()?.role === 'admin' ? decoded.uid : null;
}

const settingsRef = () => getAdminDb().collection('no1verify_settings').doc('pricing');

export async function GET(request: Request) {
  try {
    if (!(await requireAdmin(request))) {
      return NextResponse.json({ status: false, message: 'Admin access required.' }, { status: 403 });
    }
    const snap = await settingsRef().get();
    return NextResponse.json({ status: true, settings: normalizeSettings(snap.exists ? snap.data() : {}) });
  } catch (error) {
    console.error('No1Verify pricing read error:', error);
    return NextResponse.json({ status: false, message: 'Unable to load pricing settings.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!(await requireAdmin(request))) {
      return NextResponse.json({ status: false, message: 'Admin access required.' }, { status: 403 });
    }
    const body = await request.json();
    const pct = Number(body?.markupPercent);
    if (!Number.isFinite(pct) || pct < 0 || pct > 1000) {
      return NextResponse.json({ status: false, message: 'Markup must be a number from 0 to 1000.' }, { status: 400 });
    }
    const settings = normalizeSettings({ markupPercent: pct, overrides: body?.overrides });
    await settingsRef().set({ ...settings, updatedAt: new Date().toISOString() });
    return NextResponse.json({ status: true, settings });
  } catch (error) {
    console.error('No1Verify pricing save error:', error);
    return NextResponse.json({ status: false, message: 'Unable to save pricing settings.' }, { status: 500 });
  }
}
