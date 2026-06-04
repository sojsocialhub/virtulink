
'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare, ChevronLeft, ShoppingBag, Loader2, Info, Terminal, FileJson } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser, useCollection, useDoc } from '@/firebase';
import { collection, query, addDoc, doc, updateDoc, increment } from 'firebase/firestore';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

export default function SocialLogsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const db = useFirestore();
  const { user } = useUser();
  const [isProcessing, setIsProcessing] = useState(false);
  const [debugLog, setDebugLog] = useState<string[]>([]);
  const [deepTrace, setDeepTrace] = useState<any>(null);

  const userDocRef = useMemo(() => (db && user ? doc(db, 'users', user.uid) : null), [db, user]);
  const { data: userData } = useDoc(userDocRef);
  const walletBalance = userData?.walletBalance || 0;

  const collectionName = 'Sociallogs';
  const { data: rawLogs, loading: loadingLogs } = useCollection(
    db ? query(collection(db, collectionName)) : null
  );

  const sanitizeObject = (obj: any): any => {
    if (!obj || typeof obj !== 'object' || obj instanceof Date) return obj;
    if (Array.isArray(obj)) return obj.map(item => sanitizeObject(item));

    const sanitized: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const trimmedKey = key.trim();
        const value = obj[key];
        sanitized[trimmedKey] = (typeof value === 'object' && value !== null) 
          ? sanitizeObject(value) 
          : value;
      }
    }
    return sanitized;
  };

  const logs = useMemo(() => {
    if (!rawLogs) return [];
    return rawLogs.map(log => sanitizeObject(log));
  }, [rawLogs]);

  const isValidImageUrl = (url: any): boolean => {
    if (typeof url !== 'string') return false;
    return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/');
  };

  const getPriceData = (log: any) => {
    const rawPrice = log.price || log.Price || log.amount || log.Amount;
    const type = typeof rawPrice;
    let parsed = 0;

    if (rawPrice !== undefined && rawPrice !== null) {
      if (type === 'number') parsed = rawPrice;
      else if (type === 'string') parsed = parseFloat(rawPrice.replace(/[^0-9.]/g, '')) || 0;
      else if (rawPrice && typeof (rawPrice as any).toNumber === 'function') parsed = (rawPrice as any).toNumber();
      else parsed = parseFloat(String(rawPrice)) || 0;
    }
    return { raw: rawPrice, type, parsed };
  };

  const handlePurchase = async (log: any) => {
    const { raw, type, parsed } = getPriceData(log);
    
    if (!db || !user || !userDocRef) return;

    if (parsed <= 0) {
      toast({ variant: "destructive", title: "Invalid Product", description: "This product does not have a valid price." });
      return;
    }

    if (parsed > walletBalance) {
      toast({ 
        variant: "destructive", 
        title: "Insufficient Balance", 
        description: `Price: ₦${parsed.toLocaleString()}, Your Balance: ₦${walletBalance.toLocaleString()}. Please fund your wallet.` 
      });
      return;
    }

    setIsProcessing(true);
    try {
      await updateDoc(userDocRef, {
        walletBalance: increment(-parsed)
      });

      await addDoc(collection(db, 'transactions'), {
        userId: user.uid,
        type: 'social_log',
        service: log.name || log.Name || 'Social Account',
        amount: parsed,
        status: 'Completed',
        date: new Date().toISOString()
      });

      toast({ title: "Purchase Successful!", description: `${log.name} has been added to your account.` });
      router.push('/dashboard');
    } catch (e: any) {
      toast({ variant: "destructive", title: "Transaction Failed", description: e.message });
      setIsProcessing(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <Link href="/dashboard" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-6">
        <ChevronLeft className="mr-1 h-4 w-4" /> Back to Dashboard
      </Link>

      <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-4xl font-black font-headline tracking-tighter text-primary">Social Media Logs</h1>
          <p className="text-muted-foreground">Premium aged accounts with high trust scores.</p>
        </div>
        <div className="bg-primary text-white px-6 py-3 rounded-2xl shadow-xl shadow-primary/20">
          <p className="text-[10px] uppercase font-black tracking-widest opacity-80">Wallet Balance</p>
          <p className="text-2xl font-black">₦{walletBalance.toLocaleString()}</p>
        </div>
      </header>

      {loadingLogs ? (
        <div className="flex justify-center p-20"><Loader2 className="animate-spin h-12 w-12 text-primary" /></div>
      ) : logs && logs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {logs.map((log: any) => {
            const priceData = getPriceData(log);
            const name = log.name || log.Name || 'Untitled Account';
            const desc = log.description || log.Description || 'Premium aged social account.';
            const image = isValidImageUrl(log.imageUrl || log.ImageUrl) ? (log.imageUrl || log.ImageUrl) : `https://picsum.photos/seed/${log.id}/600/400`;

            return (
              <Card key={log.id} className="overflow-hidden border-none ring-1 ring-border group hover:shadow-2xl transition-all flex flex-col h-full bg-white rounded-2xl">
                <div className="relative aspect-video bg-muted">
                  <Image src={image} alt={name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-white text-primary font-black text-lg px-4 py-1 shadow-xl border-none">
                      ₦{priceData.parsed.toLocaleString()}
                    </Badge>
                  </div>
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl font-bold">{name}</CardTitle>
                  <CardDescription className="text-sm line-clamp-2">{desc}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-4 mt-auto">
                  <Button 
                    onClick={() => handlePurchase(log)}
                    className="w-full font-black h-14 text-lg rounded-xl shadow-lg"
                    disabled={isProcessing}
                  >
                    {isProcessing ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : <ShoppingBag className="h-5 w-5 mr-2" />}
                    Buy Now
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-card rounded-3xl border-2 border-dashed border-primary/10">
          <Info className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-20" />
          <h3 className="text-xl font-black mb-2">No Accounts Available</h3>
          <p className="text-muted-foreground">Please check back later or contact support.</p>
        </div>
      )}
    </div>
  );
}
