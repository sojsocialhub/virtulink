'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Smartphone, ChevronLeft, CreditCard, Loader2, Info, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, addDoc } from 'firebase/firestore';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

export default function VirtualNumbersPage() {
  const { toast } = useToast();
  const router = useRouter();
  const db = useFirestore();
  const { user } = useUser();
  const [loading, setLoading] = useState(false);

  const numbersQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'virtualNumbers'));
  }, [db]);

  const { data: numbers, loading: loadingNumbers } = useCollection(numbersQuery);

  const walletBalance = 5250;

  const handlePurchase = async (item: any) => {
    if (!db || !user) return;

    if (item.price > walletBalance) {
      toast({ variant: "destructive", title: "Insufficient Balance", description: "Please fund your wallet." });
      return;
    }

    setLoading(true);
    try {
      addDoc(collection(db, 'transactions'), {
        userId: user.uid,
        type: 'number',
        service: item.name,
        amount: item.price,
        status: 'Completed',
        date: new Date().toISOString()
      });

      toast({
        title: "Virtual Number Purchased!",
        description: `Your ${item.name} is now active in your account.`
      });
      router.push('/dashboard');
    } catch (e) {
      toast({ variant: "destructive", title: "Purchase Failed", description: "Something went wrong." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <Link href="/dashboard" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-6">
        <ChevronLeft className="mr-1 h-4 w-4" /> Back to Dashboard
      </Link>

      <header className="mb-10">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Hash className="h-8 w-8 text-primary" /> Virtual Phone Numbers
        </h1>
        <p className="text-muted-foreground">Get instant numbers for SMS verification on major apps.</p>
      </header>

      {loadingNumbers ? (
        <div className="flex justify-center p-20"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>
      ) : numbers && numbers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {numbers.map((item: any) => (
            <Card key={item.id} className="border-none ring-1 ring-border hover:shadow-lg transition-all group">
              <CardHeader className="bg-primary/5 rounded-t-lg border-b border-primary/10">
                <div className="flex justify-between items-center mb-1">
                  <Badge variant="secondary" className="bg-white">{item.type || 'Global'}</Badge>
                  <span className="font-bold text-primary">₦{item.price}</span>
                </div>
                <CardTitle className="text-lg">{item.name}</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <p className="text-sm text-muted-foreground">{item.description}</p>
                <div className="grid grid-cols-2 gap-2">
                  {item.features?.map((f: string, i: number) => (
                    <div key={i} className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground">
                      <div className="h-1 w-1 rounded-full bg-primary" /> {f}
                    </div>
                  ))}
                </div>
                <Button 
                  onClick={() => handlePurchase(item)}
                  className="w-full font-bold mt-4"
                  disabled={loading}
                >
                  {loading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <CreditCard className="h-4 w-4 mr-2" />}
                  Buy Number
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-card rounded-2xl border-2 border-dashed">
          <Info className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-bold mb-2">Out of Stock</h3>
          <p className="text-muted-foreground">Our virtual numbers are currently out of stock. Please check back shortly.</p>
        </div>
      )}
    </div>
  );
}
