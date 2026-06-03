
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Globe, ChevronLeft, CreditCard, Loader2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser, useCollection } from '@/firebase';
import { collection, query, addDoc } from 'firebase/firestore';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

export default function DataPage() {
  const { toast } = useToast();
  const router = useRouter();
  const db = useFirestore();
  const { user } = useUser();
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const { data: plans, loading: loadingPlans } = useCollection(
    db ? query(collection(db, 'dataPlans')) : null
  );

  const walletBalance = 5250;

  const handlePurchase = async () => {
    if (!db || !user || !selectedPlan || !phoneNumber) return;

    if (selectedPlan.price > walletBalance) {
      toast({ variant: "destructive", title: "Insufficient Balance", description: "Please fund your wallet." });
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'transactions'), {
        userId: user.uid,
        type: 'data',
        service: selectedPlan.name,
        network: selectedPlan.network,
        phoneNumber: phoneNumber,
        amount: selectedPlan.price,
        status: 'Completed',
        date: new Date().toISOString()
      });

      toast({
        title: "Data Purchase Successful!",
        description: `${selectedPlan.name} sent to ${phoneNumber}`
      });
      router.push('/dashboard');
    } catch (e) {
      toast({ variant: "destructive", title: "Purchase Failed", description: "Something went wrong." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Link href="/dashboard" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-6">
        <ChevronLeft className="mr-1 h-4 w-4" /> Back to Dashboard
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-sm ring-1 ring-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" /> Buy Data Bundle
              </CardTitle>
              <CardDescription>Select a plan and input the recipient's phone number.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label>1. Choose Data Plan</Label>
                {loadingPlans ? (
                  <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" /></div>
                ) : plans && plans.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {plans.map((plan: any) => (
                      <div 
                        key={plan.id}
                        onClick={() => setSelectedPlan(plan)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer hover:border-primary ${selectedPlan?.id === plan.id ? 'bg-primary/5 border-primary ring-1 ring-primary' : 'bg-card border-border'}`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <Badge variant="outline" className="text-[10px] font-bold">{plan.network}</Badge>
                          <span className="font-bold text-primary">₦{plan.price}</span>
                        </div>
                        <p className="text-sm font-bold">{plan.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">{plan.description || '30 Days Validity'}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-muted/50 rounded-xl border border-dashed">
                    <Info className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">No data plans available right now.</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>2. Recipient Phone Number</Label>
                <Input 
                  type="tel" 
                  placeholder="08012345678" 
                  className="h-12"
                  value={phoneNumber}
                  onChange={e => setPhoneNumber(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-sm ring-1 ring-border sticky top-24">
            <CardHeader>
              <CardTitle className="text-lg">Checkout</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Balance</span>
                <span className="font-bold">₦{walletBalance.toLocaleString()}</span>
              </div>
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Plan</span>
                  <span className="font-bold text-right truncate max-w-[120px]">{selectedPlan?.name || '-'}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total</span>
                  <span className="text-primary">₦{selectedPlan?.price || 0}</span>
                </div>
              </div>
              <Button 
                onClick={handlePurchase}
                className="w-full h-12 font-bold mt-4"
                disabled={loading || !selectedPlan || !phoneNumber}
              >
                {loading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <CreditCard className="h-4 w-4 mr-2" />}
                Confirm Purchase
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
