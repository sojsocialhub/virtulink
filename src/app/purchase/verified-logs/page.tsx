'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Loader2, Search, Copy } from 'lucide-react';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

type Item = {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  forSale: boolean;
  stock: number;
  outOfStock: boolean;
};

export default function VerifiedLogsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useUser();
  const { toast } = useToast();
  const [buyingId, setBuyingId] = useState<number | null>(null);
  const [delivered, setDelivered] = useState<{ title: string; delivery: string[]; orderId: string } | null>(null);
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    fetch(`/api/no1verify/products?page=${page}&q=${encodeURIComponent(query)}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (!data.status) {
          setError(data.message || 'Unable to load products.');
          setItems([]);
          return;
        }
        setItems(data.items || []);
        setPages(Number(data.pagination?.pages) || 1);
        setTotal(Number(data.pagination?.total) || 0);
      })
      .catch(() => {
        if (!cancelled) setError('Unable to load products.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [page, query]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch('/api/no1verify/orders', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
        const data = await res.json();
        if (!cancelled && data.status) setOrders(data.orders || []);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [user, delivered, buyingId]);

  const buy = async (item: Item) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Login required', description: 'Please log in to buy.' });
      return;
    }
    if (!window.confirm(`Buy "${item.title.slice(0, 60)}" for ₦${item.price.toLocaleString()}? This will be taken from your wallet.`)) return;
    setBuyingId(item.id);
    const reference = `VL-NV-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    try {
      const token = await user.getIdToken();

      const res = await fetch('/api/no1verify/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ productId: item.id, reference }),
      });
      const data = await res.json();
      if (data.status) {
        setDelivered({ title: data.title, delivery: data.delivery || [], orderId: data.orderId });
        toast({ title: 'Purchase successful', description: 'Your account details are shown below.' });
      } else if (data.pending) {
        toast({ title: 'Order processing', description: data.message });
      } else {
        toast({ variant: 'destructive', title: 'Purchase failed', description: data.message || 'Please try again.' });
      }
    } catch {
      toast({ variant: 'destructive', title: 'Connection problem', description: 'Please check My Orders before trying again. Do not pay twice.' });
    } finally {
      setBuyingId(null);
    }
  };

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    setPage(1);
    setQuery(search.trim());
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <Link
        href="/dashboard"
        className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-6"
      >
        <ChevronLeft className="mr-1 h-4 w-4" />
        Back to Dashboard
      </Link>

      <header className="mb-6">
        <h1 className="text-4xl font-black font-headline text-primary">Verified Logs</h1>
        <p className="text-muted-foreground">
          Browse available accounts. {total > 0 ? `${total.toLocaleString()} products found.` : ''}
        </p>
      </header>

      {delivered && (
        <Card className="mb-8 border-2 border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-2xl font-black text-green-700">Purchase Successful</CardTitle>
            <CardDescription>{delivered.title}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="whitespace-pre-wrap break-all rounded-lg border bg-white p-3 text-sm">{delivered.delivery.join('\n')}</div>
            <Button type="button" variant="outline" onClick={() => { navigator.clipboard.writeText(delivered.delivery.join('\n')); toast({ title: 'Copied', description: 'Account details copied.' }); }}>
              <Copy className="mr-2 h-4 w-4" />
              Copy All Details
            </Button>
            <p className="break-all text-xs text-muted-foreground">Order ID: {delivered.orderId}</p>
          </CardContent>
        </Card>
      )}

      <form onSubmit={submitSearch} className="mb-8 flex gap-2">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search e.g. Instagram, Twitter, Google"
        />
        <Button type="submit" className="font-bold">
          <Search className="mr-2 h-4 w-4" />
          Search
        </Button>
      </form>

      {loading ? (
        <div className="flex justify-center p-20">
          <Loader2 className="animate-spin h-12 w-12 text-primary" />
        </div>
      ) : error ? (
        <div className="text-center py-16 text-destructive font-medium">{error}</div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">No products found.</div>
      ) : (

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {items.map((item) => (
            <Card key={item.id} className="flex flex-col border-none ring-1 ring-border rounded-2xl bg-white">
              <CardHeader className="pb-2">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <Badge variant="secondary">{item.category || 'Account'}</Badge>
                  <Badge variant={item.outOfStock ? 'destructive' : 'default'}>
                    {item.outOfStock ? 'Out of stock' : `${item.stock} in stock`}
                  </Badge>
                </div>

                <CardTitle className="text-base font-bold leading-snug">{item.title}</CardTitle>
                {item.description && (
                  <CardDescription className="line-clamp-3 text-sm">{item.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="mt-auto flex items-center justify-between pt-2">
                <span className="text-xs text-muted-foreground">ID {item.id}</span>
                <span className="text-lg font-black text-primary">{item.forSale ? `₦${item.price.toLocaleString()}` : 'Unavailable'}</span>
              </CardContent>
              {item.forSale && (
                <div className="px-6 pb-6">
                  <Button className="h-12 w-full font-black" disabled={buyingId !== null} onClick={() => buy(item)}>
                    {buyingId === item.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {buyingId === item.id ? 'Processing...' : 'Buy Account'}
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {!loading && !error && pages > 1 && (
        <div className="mt-8 flex items-center justify-between">
          <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => Math.max(p - 1, 1))}>
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">Page {page} of {pages}</span>
          <Button variant="outline" disabled={page >= pages} onClick={() => setPage((p) => Math.min(p + 1, pages))}>
            Next
          </Button>
        </div>
      )}

      {user && orders.length > 0 && (
        <div className="mt-12">
          <h2 className="mb-4 text-2xl font-black text-primary">My Orders</h2>
          <div className="space-y-4">
            {orders.map((o) => (
              <Card key={o.id} className="border-none ring-1 ring-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{o.title}</CardTitle>
                  <CardDescription>₦{Number(o.price).toLocaleString()} · {o.status === 'delivered' ? 'Delivered' : o.status === 'failed' ? 'Refunded' : 'Processing'}</CardDescription>
                </CardHeader>
                {o.delivery.length > 0 && (
                  <CardContent className="space-y-2">
                    <div className="whitespace-pre-wrap break-all rounded-lg border bg-white p-3 text-sm">{o.delivery.join('\n')}</div>
                    <Button type="button" variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(o.delivery.join('\n')); toast({ title: 'Copied', description: 'Account details copied.' }); }}>
                      <Copy className="mr-1 h-4 w-4" />
                      Copy
                    </Button>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
