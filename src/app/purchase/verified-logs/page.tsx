'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Loader2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

type Item = {
  id: number;
  title: string;
  description: string;
  category: string;
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
              <CardContent className="mt-auto pt-2" />
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
    </div>
  );
}
