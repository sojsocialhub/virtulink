
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare, ChevronLeft, CreditCard, Loader2, Info, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser, useCollection } from '@/firebase';
import { collection, query, addDoc } from 'firebase/firestore';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

export default function SocialLogsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const db = useFirestore();
  const { user } = useUser();
  const [loading, setLoading] = useState(false);

  const { data: logs, loading: loadingLogs } = useCollection(
    db ? query(collection(db, 'socialLogs')) : null
  );

  const walletBalance = 5250;

  const handlePurchase = async (log: any) => {
    if (!db || !user) return;

    if (log.price > walletBalance) {
      toast({ variant: "destructive", title: "Insufficient Balance", description: "Please fund your wallet." });
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'transactions'), {
        userId: user.uid,
        type: 'social_log',
        service: log.name,
        amount: log.price,
        status: 'Completed',
        date: new Date().toISOString()
      });

      toast({
        title: "Purchase Successful!",
        description: `Your ${log.name} details have been sent to your email.`
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
          <MessageSquare className="h-8 w-8 text-primary" /> Social Media Logs
        </h1>
        <p className="text-muted-foreground">High-trust, aged accounts for your business needs.</p>
      </header>

      {loadingLogs ? (
        <div className="flex justify-center p-20"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>
      ) : logs && logs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {logs.map((log: any) => (
            <Card key={log.id} className="overflow-hidden border-none ring-1 ring-border group hover:shadow-lg transition-all">
              <div className="relative aspect-video">
                <Image 
                  src={log.imageUrl || `https://picsum.photos/seed/${log.id}/600/400`} 
                  alt={log.name} 
                  fill 
                  className="object-cover"
                />
                <div className="absolute top-2 right-2">
                  <Badge className="bg-primary/90">₦{log.price}</Badge>
                </div>
              </div>
              <CardHeader>
                <CardTitle className="text-lg">{log.name}</CardTitle>
                <CardDescription className="line-clamp-2">{log.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-1.5">
                  {log.features?.map((f: string, i: number) => (
                    <li key={i} className="text-xs flex items-center gap-2 text-muted-foreground">
                      <div className="h-1 w-1 rounded-full bg-primary" /> {f}
                    </li>
                  ))}
                </ul>
                <Button 
                  onClick={() => handlePurchase(log)}
                  className="w-full font-bold"
                  disabled={loading}
                >
                  {loading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <ShoppingBag className="h-4 w-4 mr-2" />}
                  Buy Account
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-card rounded-2xl border-2 border-dashed">
          <Info className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-bold mb-2">No Accounts Available</h3>
          <p className="text-muted-foreground">Check back later for new high-trust account stock.</p>
        </div>
      )}
    </div>
  );
}
