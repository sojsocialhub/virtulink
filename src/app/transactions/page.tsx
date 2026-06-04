
'use client';

import { useMemo } from 'react';
import { History, Smartphone, PlusCircle, ArrowLeft, Loader2, Search, Filter } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useFirestore, useUser, useCollection } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';

export default function TransactionsPage() {
  const db = useFirestore();
  const { user } = useUser();

  const transactionsQuery = useMemo(() => {
    if (!db || !user) return null;
    return query(
      collection(db, 'transactions'),
      where('userId', '==', user.uid),
      orderBy('date', 'desc')
    );
  }, [db, user]);

  const { data: transactions, loading } = useCollection(transactionsQuery);

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <Link href="/dashboard" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-2">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to Dashboard
          </Link>
          <h1 className="text-3xl font-black font-headline tracking-tight text-primary">Transaction History</h1>
          <p className="text-muted-foreground">Detailed logs of all your activities on S.O.J VTU Hub.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="font-bold">
            <Filter className="mr-2 h-4 w-4" /> Filter
          </Button>
        </div>
      </div>

      <Card className="border-none ring-1 ring-border shadow-sm overflow-hidden bg-card">
        <div className="p-4 border-b bg-muted/30">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search transactions..." className="pl-10 h-10 bg-background" />
          </div>
        </div>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-20 gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-muted-foreground font-medium">Fetching your records...</p>
            </div>
          ) : transactions && transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b text-left">
                    <th className="px-6 py-4 font-black uppercase tracking-wider text-[10px] text-muted-foreground">Type</th>
                    <th className="px-6 py-4 font-black uppercase tracking-wider text-[10px] text-muted-foreground">Details</th>
                    <th className="px-6 py-4 font-black uppercase tracking-wider text-[10px] text-muted-foreground">Amount</th>
                    <th className="px-6 py-4 font-black uppercase tracking-wider text-[10px] text-muted-foreground">Date</th>
                    <th className="px-6 py-4 font-black uppercase tracking-wider text-[10px] text-muted-foreground text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {transactions.map((tx: any) => (
                    <tr key={tx.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${tx.type === 'funding' ? 'bg-green-100 text-green-600' : 'bg-primary/10 text-primary'}`}>
                            {tx.type === 'funding' ? <PlusCircle className="h-4 w-4" /> : <Smartphone className="h-4 w-4" />}
                          </div>
                          <span className="font-bold capitalize">{tx.type.replace('_', ' ')}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {tx.service || tx.network || 'Wallet Funding'} {tx.phoneNumber ? `(${tx.phoneNumber})` : ''}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-bold ${tx.type === 'funding' ? 'text-green-600' : 'text-foreground'}`}>
                          {tx.type === 'funding' ? '+' : '-'}₦{tx.amount.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground text-xs">
                        {tx.date ? new Date(tx.date).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Badge 
                          variant="secondary"
                          className={
                            tx.status === 'Completed' ? 'bg-green-50 text-green-700' :
                            'bg-yellow-50 text-yellow-700'
                          }
                        >
                          {tx.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-20 gap-4 text-center">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                <History className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-bold">No transactions found</h3>
                <p className="text-muted-foreground max-w-xs mx-auto">You haven't made any purchases or funded your wallet yet.</p>
              </div>
              <Link href="/dashboard">
                <Button variant="outline" className="font-bold">Return to Dashboard</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
