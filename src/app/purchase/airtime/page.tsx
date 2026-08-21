
'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Smartphone, ChevronLeft, CreditCard, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { NETWORKS } from '@/lib/data';
import Link from 'next/link';
import { doc } from 'firebase/firestore';
import { useFirestore, useUser, useDoc } from '@/firebase';

export default function AirtimePage() {
  const { toast } = useToast();
  const router = useRouter();
  const db = useFirestore();
  const { user } = useUser();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    network: '',
    phoneNumber: '',
    amount: ''
  });

  const userDocRef = useMemo(() => (db && user ? doc(db, 'users', user.uid) : null), [db, user]);
  const { data: userData } = useDoc(userDocRef);
  const walletBalance = userData?.walletBalance || 0;

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !user || !userDocRef) return;

    const amount = Number(formData.amount);
    if (amount < 100) {
      toast({ variant: "destructive", title: "Error", description: "Minimum airtime is ₦100" });
      return;
    }

    if (amount > walletBalance) {
      toast({ 
        variant: "destructive", 
        title: "Insufficient Balance", 
        description: `Price: ₦${amount.toLocaleString()}, Your Balance: ₦${walletBalance.toLocaleString()}. Please fund your wallet.` 
      });
      return;
    }

    setLoading(true);

    try {
      const idToken = await user.getIdToken();

      const response = await fetch('/api/airtime/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          network: formData.network,
          phoneNumber: formData.phoneNumber,
          amount,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.status) {
        throw new Error(
          data.message || 'Airtime purchase failed. Please try again.'
        );
      }

      toast({
        title: "Purchase Successful! 🎉",
        description: data.message,
      });

      router.push('/dashboard');
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Purchase Failed",
        description: e?.message || "Please try again.",
      });
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-xl">
      <Link href="/dashboard" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-6">
        <ChevronLeft className="mr-1 h-4 w-4" /> Back to Dashboard
      </Link>

      <Card className="border-none shadow-2xl ring-1 ring-border rounded-3xl overflow-hidden">
        <CardHeader className="bg-primary text-white py-8">
          <CardTitle className="text-2xl font-black flex items-center gap-2">
            <Smartphone className="h-6 w-6" /> Buy Airtime
          </CardTitle>
          <CardDescription className="text-primary-foreground/80">Instant top-up for all major Nigerian networks.</CardDescription>
        </CardHeader>
        <CardContent className="pt-8">
          <form onSubmit={handlePurchase} className="space-y-6">
            <div className="space-y-2">
              <Label className="font-bold">Select Network</Label>
              <Select onValueChange={(v) => setFormData(prev => ({ ...prev, network: v }))}>
                <SelectTrigger className="h-14 rounded-xl border-2">
                  <SelectValue placeholder="Choose a network" />
                </SelectTrigger>
                <SelectContent>
                  {NETWORKS.map(net => (
                    <SelectItem key={net} value={net}>{net}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="font-bold">Phone Number</Label>
              <Input 
                type="tel" 
                placeholder="08012345678" 
                className="h-14 rounded-xl border-2"
                value={formData.phoneNumber}
                onChange={e => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="font-bold">Amount (₦)</Label>
              <Input 
                type="number" 
                placeholder="Min ₦100" 
                className="h-16 text-2xl font-black rounded-xl border-2"
                value={formData.amount}
                onChange={e => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                required
              />
            </div>

            <div className="p-4 rounded-2xl bg-muted border flex justify-between items-center">
              <span className="text-sm text-muted-foreground font-bold uppercase tracking-widest">Available Balance</span>
              <span className="font-black text-lg">₦{walletBalance.toLocaleString()}</span>
            </div>

            <Button 
              type="submit" 
              className="w-full h-16 text-xl font-black rounded-2xl shadow-xl shadow-primary/20" 
              disabled={loading || !formData.network || !formData.phoneNumber || !formData.amount}
            >
              {loading ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : <CreditCard className="mr-2 h-6 w-6" />}
              Pay ₦{formData.amount || '0'} Now
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
