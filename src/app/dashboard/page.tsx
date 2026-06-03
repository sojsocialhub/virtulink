
"use client";

import { Wallet, Smartphone, Globe, MessageSquare, History, PlusCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function Dashboard() {
  // Mock balance
  const walletBalance = 5250;

  const quickActions = [
    { label: 'Buy Airtime', icon: Smartphone, color: 'bg-blue-100 text-blue-600', href: '/purchase/airtime' },
    { label: 'Buy Data', icon: Globe, iconColor: 'text-green-600', color: 'bg-green-100 text-green-600', href: '/purchase/data' },
    { label: 'Social Log', icon: MessageSquare, color: 'bg-purple-100 text-purple-600', href: '/purchase/social' },
    { label: 'Buy Number', icon: Smartphone, color: 'bg-orange-100 text-orange-600', href: '/purchase/number' },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">Hello, Samuel 👋</h1>
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
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold">₦{walletBalance.toLocaleString()}</span>
            <span className="text-sm opacity-80">.00</span>
          </div>
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
          {[
            { id: 1, type: 'Data Purchase', amount: -600, date: 'Today, 2:45 PM', status: 'Completed' },
            { id: 2, type: 'Wallet Funding', amount: 5000, date: 'Yesterday, 10:15 AM', status: 'Completed' },
            { id: 3, type: 'Airtime', amount: -200, date: 'Oct 20, 11:00 AM', status: 'Completed' },
          ].map((tx) => (
            <Card key={tx.id} className="border-none ring-1 ring-border shadow-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${tx.amount > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                    {tx.amount > 0 ? <PlusCircle className="h-4 w-4" /> : <Smartphone className="h-4 w-4" />}
                  </div>
                  <div>
                    <p className="font-bold text-sm">{tx.type}</p>
                    <p className="text-xs text-muted-foreground">{tx.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${tx.amount > 0 ? 'text-green-600' : 'text-foreground'}`}>
                    {tx.amount > 0 ? '+' : ''}₦{Math.abs(tx.amount).toLocaleString()}
                  </p>
                  <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">{tx.status}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
