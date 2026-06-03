'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare, ChevronLeft, CreditCard, Loader2, Info, ShoppingBag, AlertCircle, Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser, useCollection, useDoc, useFirebaseApp } from '@/firebase';
import { collection, query, addDoc, doc, updateDoc, increment } from 'firebase/firestore';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function SocialLogsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const db = useFirestore();
  const app = useFirebaseApp();
  const { user } = useUser();
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch real user data for wallet balance
  const userDocRef = useMemo(() => (db && user ? doc(db, 'users', user.uid) : null), [db, user]);
  const { data: userData } = useDoc(userDocRef);
  const walletBalance = userData?.walletBalance || 0;

  const collectionName = 'socialLogs';
  const { data: logs, loading: loadingLogs, error: logsError } = useCollection(
    db ? query(collection(db, collectionName)) : null
  );

  // Debugging info
  const projectId = app?.options?.projectId || 'Not Found';
  const docIds = logs?.map(l => l.id) || [];

  const handlePurchase = async (log: any) => {
    if (!db || !user || !userDocRef) return;

    if (log.price > walletBalance) {
      toast({ 
        variant: "destructive", 
        title: "Insufficient Balance", 
        description: "Please fund your wallet to complete this purchase." 
      });
      return;
    }

    setIsProcessing(true);
    try {
      await updateDoc(userDocRef, {
        walletBalance: increment(-log.price)
      });

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
        description: `Your ${log.name} details will be sent to your dashboard shortly.`
      });
      router.push('/dashboard');
    } catch (e) {
      toast({ 
        variant: "destructive", 
        title: "Purchase Failed", 
        description: "An error occurred while processing your order." 
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <Link href="/dashboard" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-6">
        <ChevronLeft className="mr-1 h-4 w-4" /> Back to Dashboard
      </Link>

      <header className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <MessageSquare className="h-8 w-8 text-primary" /> Social Media Logs
        </h1>
        <p className="text-muted-foreground">High-trust, aged accounts for your business needs.</p>
      </header>

      {/* Connection Diagnostics Panel */}
      <Card className="mb-8 border-none ring-1 ring-blue-200 bg-blue-50/30 overflow-hidden">
        <CardHeader className="py-3 bg-blue-100/50">
          <CardTitle className="text-xs flex items-center gap-2 text-blue-700 uppercase tracking-widest font-black">
            <Terminal className="h-3 w-3" /> System Diagnostics
          </CardTitle>
        </CardHeader>
        <CardContent className="py-4 space-y-2 text-[11px] font-mono">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Firebase Project ID:</span>
            <span className="font-bold text-blue-600">{projectId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Firestore Collection:</span>
            <span className="font-bold">"{collectionName}"</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Data Source:</span>
            <span className="text-green-600 font-bold uppercase">Live Firestore DB</span>
          </div>
          <div className="flex justify-between border-t pt-2">
            <span className="text-muted-foreground">Documents Found:</span>
            <span className="font-bold">{logs?.length || 0}</span>
          </div>
          {docIds.length > 0 && (
            <div className="pt-1">
              <span className="text-muted-foreground">Document IDs:</span>
              <div className="mt-1 flex flex-wrap gap-1">
                {docIds.map(id => (
                  <span key={id} className="px-1 bg-white border rounded text-[9px]">{id}</span>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Firestore Error Display */}
      {logsError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Firestore Connection Error</AlertTitle>
          <AlertDescription>
            {logsError.message}
          </AlertDescription>
        </Alert>
      )}

      {loadingLogs ? (
        <div className="flex justify-center p-20">
          <Loader2 className="animate-spin h-10 w-10 text-primary" />
        </div>
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
                  data-ai-hint="social media"
                />
                <div className="absolute top-2 right-2">
                  <Badge className="bg-primary/90 text-white font-bold">₦{log.price.toLocaleString()}</Badge>
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
                  disabled={isProcessing}
                >
                  {isProcessing ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <ShoppingBag className="h-4 w-4 mr-2" />}
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
          <p className="text-muted-foreground">
            We successfully connected to project <code className="text-blue-600">{projectId}</code> but found 0 documents in <code className="text-primary">{collectionName}</code>.
          </p>
          <div className="mt-6 p-4 bg-muted/50 rounded-lg max-w-sm mx-auto text-left text-[11px] space-y-2">
            <p className="font-bold text-muted-foreground uppercase">Please check:</p>
            <p>• Is the collection name exactly <code className="font-bold">socialLogs</code> (case-sensitive)?</p>
            <p>• Is the document inside a collection, not a sub-collection?</p>
            <p>• Did you add fields like <code className="font-bold">name</code> and <code className="font-bold">price</code>?</p>
          </div>
        </div>
      )}
    </div>
  );
}
