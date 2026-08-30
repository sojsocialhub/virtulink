'use client';

import { Smartphone, Globe, MessageSquare, History, PlusCircle, Loader2, Wallet, Rocket } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useFirestore, useUser, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where, orderBy, limit } from 'firebase/firestore';

export default function Dashboard() {
  const db = useFirestore();
  const { user } = useUser();

  const userDocRef = useMemoFirebase(() => (db && user ? doc(db, 'users', user.uid) : null), [db, user]);
  const { data: userData, loading: userLoading } = useDoc(userDocRef);

  const transactionsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, 'transactions'),
      where('userId', '==', user.uid),
      orderBy('date', 'desc'),
      limit(5)
    );
  }, [db, user]);

  const { data: recentTransactions, loading: txLoading } = useCollection(transactionsQuery);

  const walletBalance = userData?.walletBalance || 0;

  const quickActions = [
    { label: 'Buy Airtime', icon: Smartphone, color: 'bg-blue-100 text-blue-600', href: '/purchase/airtime' },
    { label: 'Buy Data', icon: Globe, color: 'bg-green-100 text-green-600', href: '/purchase/data' },
    { label: 'Social Log', icon: MessageSquare, color: 'bg-purple-100 text-purple-600', href: '/purchase/social' },
    { label: 'Buy Number', icon: Smartphone, color: 'bg-orange-100 text-orange-600', href: '/purchase/number' },
    { label: 'BOOST 🚀', icon: Rocket, color: 'bg-pink-100 text-pink-600', href: '/purchase/boost' },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">
            Hello, {userData?.name || user?.email?.split('@')[0] || 'User'} 👋
          </h1>
          <p className="text-muted-foreground">Welcome back to S.O.J VTU Hub</p>
        </div>
        <Link href="/fund-wallet">
          <Button className="bg-primary hover:bg-primary/90 font-bold rounded-full px-6">
            <PlusCircle className="mr-2 h-4 w-4" /> Fund Wallet
          </Button>
        </Link>
      </header>

      {/* Wallet Card */}
      <Card className="bg-primary text-white border-none shadow-xl mb-10 overflow-hidden relative">
        <div className="absolute right-0 top-0 opacity-10 pointer-events-none">
          <Wallet className="w-48 h-48 -mr-12 -mt-12" />
        </div>
        <CardContent className="p-8">
          <p className="text-primary-foreground/80 font-medium mb-1">Available Balance</p>
          {userLoading ? (
            <Loader2 className="h-8 w-8 animate-spin" />
          ) : (
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold">₦{walletBalance.toLocaleString()}</span>
              <span className="text-sm opacity-80">.00</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {quickActions.map((action) => (
          <Link key={action.label} href={action.href}>
            <Card className="hover:ring-1 hover:ring-primary transition-all cursor-pointer h-full border-none shadow-sm ring-1 ring-border">
              <CardContent className="p-6 flex flex-col items-center justify-center text-center gap-3">
                <div className={`p-3 rounded-2xl ${action.color}`}>
                  <action.icon className="h-6 w-6" />
                </div>
                <span className="text-sm font-bold">{action.label}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent Transactions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <History className="h-5 w-5 text-primary" /> Recent Transactions
          </h2>
          <Link href="/transactions" className="text-primary text-sm font-bold hover:underline">View All</Link>
        </div>
        
        <div className="space-y-3">
          {txLoading ? (
            <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" /></div>
          ) : recentTransactions && recentTransactions.length > 0 ? (
            recentTransactions.map((tx: any) => (
              <Card key={tx.id} className="border-none ring-1 ring-border shadow-sm">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${tx.type === 'funding' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                      {tx.type === 'funding' ? <PlusCircle className="h-4 w-4" /> : <Smartphone className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="font-bold text-sm capitalize">{tx.type.replace('_', ' ')}</p>
                      <p className="text-xs text-muted-foreground">
                        {(() => {
                          if (!tx.date) return 'Unknown date';

                          try {
                            const date =
                              typeof tx.date === 'object' &&
                              typeof tx.date.toDate === 'function'
                                ? tx.date.toDate()
                                : new Date(tx.date);

                            return Number.isNaN(date.getTime())
                              ? 'Unknown date'
                              : date.toLocaleString(undefined, {
                                  dateStyle: 'medium',
                                  timeStyle: 'short'
                                });
                          } catch {
                            return 'Unknown date';
                          }
                        })()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${tx.type === 'funding' ? 'text-green-600' : 'text-foreground'}`}>
                      {tx.type === 'funding' ? '+' : '-'}₦{tx.amount.toLocaleString()}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">{tx.status}</p>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="text-center py-8 text-muted-foreground text-sm border border-dashed rounded-xl">
              No transactions yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
