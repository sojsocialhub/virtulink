'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, Plus, Trash2, ShieldCheck } from 'lucide-react';
import { doc } from 'firebase/firestore';
import { useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function No1VerifyPricingPage() {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const userDocRef = useMemoFirebase(() => (db && user ? doc(db, 'users', user.uid) : null), [db, user]);
  const { data: userData, loading: loadingProfile } = useDoc(userDocRef);
  const isAdmin = userData?.role === 'admin';
  const [markup, setMarkup] = useState('30');
  const [rows, setRows] = useState<{ id: string; price: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user || !isAdmin) return;
    let cancelled = false;
    (async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch('/api/no1verify/pricing', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
        const data = await res.json();
        if (cancelled || !data.status) return;
        setMarkup(String(data.settings.markupPercent));
        setRows(Object.entries(data.settings.overrides || {}).map(([id, price]) => ({ id, price: String(price) })));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user, isAdmin]);

  const save = async () => {
    if (!user) return;
    const pct = Number(markup);
    if (!Number.isFinite(pct) || pct < 0 || pct > 1000) {
      toast({ variant: 'destructive', title: 'Invalid markup', description: 'Enter a number from 0 to 1000.' });
      return;
    }
    const overrides: Record<string, number> = {};
    for (const row of rows) {
      const id = row.id.trim();
      const price = Number(row.price);
      if (!id && !row.price.trim()) continue;
      if (!/^\d+$/.test(id) || !Number.isFinite(price) || price <= 0) {
        toast({ variant: 'destructive', title: 'Check fixed prices', description: 'Each row needs a numeric product ID and a price above zero.' });
        return;
      }
      overrides[id] = price;
    }
    setSaving(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/no1verify/pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ markupPercent: pct, overrides }),
      });
      const data = await res.json();
      if (!data.status) throw new Error(data.message || 'Save failed.');
      toast({ title: 'Pricing saved', description: `Markup is now ${data.settings.markupPercent}%.` });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Could not save', description: error?.message || 'Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const [pending, setPending] = useState<any[]>([]);
  const [busyId, setBusyId] = useState('');

  const loadPending = async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/no1verify/admin-orders', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
      const data = await res.json();
      if (data.status) setPending(data.orders || []);
    } catch {}
  };

  useEffect(() => { if (user && isAdmin) loadPending(); }, [user, isAdmin]);

  const act = async (orderId: string, action: 'resolve' | 'refund') => {
    if (!user) return;
    if (action === 'refund' && !window.confirm('Refund this customer? Only do this if the account was NOT delivered.')) return;
    setBusyId(orderId);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/no1verify/admin-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ orderId, action }),
      });
      const data = await res.json();
      toast({ variant: data.status ? 'default' : 'destructive', title: data.status ? 'Done' : 'Not completed', description: data.message });
      await loadPending();
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not reach the server.' });
    } finally {
      setBusyId('');
    }
  };

  if (loadingProfile) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen p-10 text-center">
        <ShieldCheck className="mx-auto h-16 w-16 text-destructive" />
        <h1 className="mt-4 text-2xl font-black">Access Denied</h1>
        <p className="mt-2 text-muted-foreground">This area is reserved for administrators.</p>
        <Link href="/admin"><Button className="mt-6">Back to Admin</Button></Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <Link href="/admin" className="mb-4 inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary">
        <ArrowLeft className="mr-1 h-4 w-4" />
        Back to Admin Hub
      </Link>
      <h1 className="text-3xl font-black text-primary">Verified Logs Pricing</h1>
      <p className="mb-6 mt-1 text-muted-foreground">Set your markup on top of the No1Verify cost. Customers only see your selling price.</p>
      <Card className="mb-6">
        <CardHeader><CardTitle>Default markup (%)</CardTitle></CardHeader>
        <CardContent>
          <Input type="number" min="0" max="1000" value={markup} onChange={(e) => setMarkup(e.target.value)} />
          <p className="mt-2 text-xs text-muted-foreground">Applied to every product unless you set a fixed price below.</p>
        </CardContent>
      </Card>
      <Card className="mb-6">
        <CardHeader><CardTitle>Fixed prices (optional)</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">Use a product ID and a price in naira. A fixed price below the cost is raised to the cost.</p>
          {rows.map((row, index) => (
            <div key={index} className="flex gap-2">
              <Input placeholder="Product ID" inputMode="numeric" value={row.id} onChange={(e) => setRows(rows.map((r, i) => i === index ? { ...r, id: e.target.value } : r))} />
              <Input placeholder="Price (naira)" inputMode="numeric" value={row.price} onChange={(e) => setRows(rows.map((r, i) => i === index ? { ...r, price: e.target.value } : r))} />
              <Button type="button" variant="ghost" size="icon" onClick={() => setRows(rows.filter((_, i) => i !== index))}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" onClick={() => setRows([...rows, { id: '', price: '' }])}>
            <Plus className="mr-2 h-4 w-4" />
            Add fixed price
          </Button>
        </CardContent>
      </Card>
      {pending.length > 0 && (
        <Card className="mb-6 border-amber-300">
          <CardHeader><CardTitle>Orders needing review ({pending.length})</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {pending.map((o) => (
              <div key={o.id} className="rounded-lg border p-3 text-sm">
                <p className="font-bold">{o.title}</p>
                <p className="text-muted-foreground">{o.userEmail} · ₦{Number(o.price).toLocaleString()} · {o.status}</p>
                {o.reason && <p className="mt-1 text-xs text-muted-foreground">{o.reason}</p>}
                <div className="mt-3 flex gap-2">
                  <Button size="sm" disabled={busyId === o.id} onClick={() => act(o.id, 'resolve')}>Resolve</Button>
                  <Button size="sm" variant="outline" disabled={busyId === o.id} onClick={() => act(o.id, 'refund')}>Refund</Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      <Button onClick={save} disabled={saving || loading} className="h-12 w-full font-black">
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {saving ? 'Saving...' : 'Save pricing'}
      </Button>
    </div>
  );
}
