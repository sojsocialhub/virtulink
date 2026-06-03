
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
import { doc, addDoc, collection, updateDoc, increment } from 'firebase/firestore';
import { useFirestore, useUser, useDoc } from '@/firebase';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

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
      toast({ variant: "destructive", title: "Insufficient Balance", description: "Please fund your wallet to proceed." });
      return;
    }

    setLoading(true);

    try {
      // 1. Deduct Balance
      await updateDoc(userDocRef, {
        walletBalance: increment(-amount)
      });

      // 2. Create Transaction
      await addDoc(collection(db, 'transactions'), {
        userId: user.uid,
        type: 'airtime',
        network: formData.network,
        phoneNumber: formData.phoneNumber,
        amount: amount,
        status: 'Completed',
        date: new Date().toISOString()
      });

      toast({
        title: "Purchase Successful!",
        description: `₦${amount} ${formData.network} airtime sent to ${formData.phoneNumber}`
      });
      router.push('/dashboard');
    } catch (e: any) {
      const error = new FirestorePermissionError({
        path: 'transactions',
        operation: 'create',
        requestResourceData: formData
      });
      errorEmitter.emit('permission-error', error);
      toast({ variant: "destructive", title: "Error", description: "Purchase failed. Check balance." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-xl">
      <Link href="/dashboard" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-6">
        <ChevronLeft className="mr-1 h-4 w-4" /> Back to Dashboard
      </Link>

      <Card className="border-none shadow-sm ring-1 ring-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-primary" /> Buy Airtime
          </CardTitle>
          <CardDescription>Instant top-up for all major Nigerian networks.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePurchase} className="space-y-6">
            <div className="space-y-2">
              <Label>Select Network</Label>
              <Select onValueChange={(v) => setFormData(prev => ({ ...prev, network: v }))}>
                <SelectTrigger className="h-12">
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
              <Label>Phone Number</Label>
              <Input 
                type="tel" 
                placeholder="08012345678" 
                className="h-12"
                value={formData.phoneNumber}
                onChange={e => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Amount (₦)</Label>
              <Input 
                type="number" 
                placeholder="Min ₦100" 
                className="h-12 text-lg font-bold"
                value={formData.amount}
                onChange={e => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                required
              />
            </div>

            <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex justify-between items-center">
              <span className="text-sm text-muted-foreground font-medium">Wallet Balance</span>
              <span className="font-bold text-primary">₦{walletBalance.toLocaleString()}</span>
            </div>

            <Button 
              type="submit" 
              className="w-full h-14 text-lg font-bold" 
              disabled={loading || !formData.network || !formData.phoneNumber || !formData.amount}
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
              Pay ₦{formData.amount || '0'} Now
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
