'use client';

import {
  Smartphone,
  Globe,
  MessageSquare,
  History,
  PlusCircle,
  Loader2,
  Wallet,
  Rocket,
  Phone,
  ArrowUpRight,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  useFirestore,
  useUser,
  useDoc,
  useCollection,
  useMemoFirebase,
} from '@/firebase';
import {
  doc,
  collection,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';

export default function Dashboard() {
  const db = useFirestore();
  const { user } = useUser();

  const userDocRef = useMemoFirebase(
    () => (db && user ? doc(db, 'users', user.uid) : null),
    [db, user]
  );

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

  const { data: recentTransactions, loading: txLoading } =
    useCollection(transactionsQuery);

  const walletBalance = userData?.walletBalance || 0;

  const quickActions = [
    {
      label: 'Airtime',
      icon: Smartphone,
      iconClass: 'bg-blue-50 text-blue-600',
      href: '/purchase/airtime',
    },
    {
      label: 'Data',
      icon: Globe,
      iconClass: 'bg-green-50 text-green-600',
      href: '/purchase/data',
    },
    {
      label: 'Marketplace 🏷️🛒',
      icon: MessageSquare,
      iconClass: 'bg-purple-50 text-purple-600',
      href: '/purchase/social',
    },
    {
      label: 'Virtual Numbers',
      icon: Phone,
      iconClass: 'bg-orange-50 text-orange-600',
      href: '/purchase/number',
    },
    {
      label: 'BOOST',
      icon: Rocket,
      iconClass: 'bg-pink-50 text-pink-600',
      href: '/purchase/boost',
    },
  ];

  return (
    <div className="flex-1 bg-slate-50">
      <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-7">

        {/* Welcome */}
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Dashboard
            </p>
            <h1 className="mt-1 truncate text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
              Hello, {userData?.name || user?.email?.split('@')[0] || 'User'} 👋
            </h1>
          </div>

          <Link href="/fund-wallet" className="shrink-0">
            <Button className="h-9 rounded-lg px-3 text-xs font-bold shadow-sm sm:h-10 sm:px-4 sm:text-sm">
              <PlusCircle className="mr-1.5 h-4 w-4" />
              Fund Wallet
            </Button>
          </Link>
        </div>

        {/* Compact Wallet */}
        <Card className="mb-6 overflow-hidden rounded-2xl border-0 bg-primary text-white shadow-md">
          <CardContent className="relative p-5 sm:p-6">
            <div className="absolute -right-5 -top-8 opacity-10">
              <Wallet className="h-32 w-32 sm:h-40 sm:w-40" />
            </div>

            <div className="relative">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-primary-foreground/75">
                <Wallet className="h-4 w-4" />
                Available Balance
              </div>

              {userLoading ? (
                <Loader2 className="h-7 w-7 animate-spin" />
              ) : (
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                      ₦{Number(walletBalance).toLocaleString()}
                    </p>
                    <p className="mt-0.5 text-[11px] text-primary-foreground/70">
                      Wallet balance
                    </p>
                  </div>

                  <Link href="/fund-wallet">
                    <Button
                      variant="secondary"
                      className="h-8 rounded-lg px-3 text-xs font-bold"
                    >
                      Add Money
                      <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Services */}
        <section className="mb-7">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 sm:text-lg">
                Our Services
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Choose a service to get started
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 md:grid-cols-5 md:gap-2">
            {quickActions.map((action) => (
              <Link key={action.label} href={action.href} className="group">
                <Card className="h-full rounded-lg border border-slate-200/80 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
                  <CardContent className="flex min-h-[68px] flex-col items-center justify-center p-1.5 text-center sm:min-h-[74px] sm:p-2">
                    <div
                      className={`mb-1 flex h-6 w-6 items-center justify-center rounded-md ${action.iconClass}`}
                    >
                      <action.icon className="h-3.5 w-3.5" />
                    </div>

                    <span className="text-[8px] font-extrabold leading-tight text-slate-800 sm:text-[9px]">
                      {action.label}
                    </span>

                    <ChevronRight className="mt-0.5 h-2.5 w-2.5 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* Recent Transactions */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="flex items-center gap-1.5 text-base font-extrabold text-slate-900 sm:text-lg">
                <History className="h-4 w-4 text-primary" />
                Recent Transactions
              </h2>
            </div>

            <Link
              href="/transactions"
              className="flex items-center text-xs font-bold text-primary hover:underline"
            >
              View All
              <ChevronRight className="ml-0.5 h-3.5 w-3.5" />
            </Link>
          </div>

          <Card className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
            <CardContent className="p-0">
              {txLoading ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              ) : recentTransactions && recentTransactions.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {recentTransactions.map((tx: any) => {
                    const isFunding = tx.type === 'funding';

                    let formattedDate = 'Unknown date';

                    if (tx.date) {
                      try {
                        const date =
                          typeof tx.date === 'object' &&
                          typeof tx.date.toDate === 'function'
                            ? tx.date.toDate()
                            : new Date(tx.date);

                        if (!Number.isNaN(date.getTime())) {
                          formattedDate = date.toLocaleString(undefined, {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          });
                        }
                      } catch {
                        formattedDate = 'Unknown date';
                      }
                    }

                    return (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between gap-3 px-3 py-3 sm:px-4"
                      >
                        <div className="flex min-w-0 items-center gap-2.5">
                          <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                              isFunding
                                ? 'bg-green-50 text-green-600'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {isFunding ? (
                              <PlusCircle className="h-4 w-4" />
                            ) : (
                              <Smartphone className="h-4 w-4" />
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-xs font-bold capitalize text-slate-800 sm:text-sm">
                              {String(tx.type || 'transaction').replace('_', ' ')}
                            </p>
                            <p className="truncate text-[10px] text-muted-foreground sm:text-xs">
                              {formattedDate}
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          <p
                            className={`text-xs font-extrabold sm:text-sm ${
                              isFunding
                                ? 'text-green-600'
                                : 'text-slate-800'
                            }`}
                          >
                            {isFunding ? '+' : '-'}₦
                            {Number(tx.amount || 0).toLocaleString()}
                          </p>

                          <p className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                            {tx.status || 'pending'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="px-4 py-10 text-center">
                  <History className="mx-auto mb-2 h-7 w-7 text-slate-300" />
                  <p className="text-xs font-semibold text-muted-foreground">
                    No transactions yet.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

      </div>
    </div>
  );
}
