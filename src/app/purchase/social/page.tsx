'use client';

import { useState, useMemo } from 'react';
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

  const collectionName = 'Sociallogs';
  const { data: logs, loading: loadingLogs, error: logsError } = useCollection(
    db ? query(collection(db, collectionName)) : null
  );

  /**
   * Robust price parser that handles various field names and data types.
   * Checks for: price, Price, amount, Amount
   */
  const getPrice = (log: any): number => {
    // Check for common field name variations
    const rawPrice = log.price !== undefined ? log.price : 
                    log.Price !== undefined ? log.Price : 
                    log.amount !== undefined ? log.amount : 
                    log.Amount !== undefined ? log.Amount : undefined;

    if (rawPrice === undefined || rawPrice === null) return 0;
    
    // Handle numeric types (Firestore Number or Int64)
    if (typeof rawPrice === 'number') return rawPrice;
    
    // Handle string types (e.g., "5000" or "₦5,000")
    if (typeof rawPrice === 'string') {
      const cleaned = rawPrice.replace(/[^0-9.]/g, '');
      return parseFloat(cleaned) || 0;
    }
    
    return 0;
  };

  const handlePurchase = async (log: any) => {
    if (!db || !user || !userDocRef) return;

    const price = getPrice(log);

    if (price <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid Product",
        description: "This product does not have a valid price set. Please contact admin."
      });
      return;
    }

    if (price > walletBalance) {
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
        walletBalance: increment(-price)
      });

      await addDoc(collection(db, 'transactions'), {
        userId: user.uid,
        type: 'social_log',
        service: log.name || 'Social Account',
        amount: price,
        status: 'Completed',
        date: new Date().toISOString()
      });

      toast({
        title: "Purchase Successful!",
        description: `Your ${log.name || 'Social Account'} details will be sent to your dashboard shortly.`
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

  // Diagnostic Data
  const projectId = app?.options?.projectId || 'Not Found';
  const firstDocKeys = logs && logs.length > 0 ? Object.keys(logs[0]).filter(k => k !== 'id') : [];

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <Link href="/dashboard" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-6">
        <ChevronLeft className="mr-1 h-4 w-4" /> Back to Dashboard
      </Link>

      <header className="mb-6 text-center lg:text-left">
        <h1 className="text-3xl font-bold flex items-center justify-center lg:justify-start gap-2">
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
            <span className="text-muted-foreground">Collection:</span>
            <span className="font-bold">"{collectionName}"</span>
          </div>
          <div className="flex justify-between border-t pt-2">
            <span className="text-muted-foreground">Documents Found:</span>
            <span className="font-bold">{logs?.length || 0}</span>
          </div>
          {logs && logs.length > 0 && (
            <div className="pt-2">
              <p className="text-muted-foreground mb-1">Detected Field Keys (First Doc):</p>
              <div className="flex flex-wrap gap-2">
                {firstDocKeys.map(key => (
                  <span key={key} className="px-1.5 py-0.5 bg-white border rounded text-blue-500 font-bold">
                    {key}
                  </span>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {logsError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Firestore Error</AlertTitle>
          <AlertDescription>{logsError.message}</AlertDescription>
        </Alert>
      )}

      {loadingLogs ? (
        <div className="flex justify-center p-20">
          <Loader2 className="animate-spin h-10 w-10 text-primary" />
        </div>
      ) : logs && logs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {logs.map((log: any) => {
            const productPrice = getPrice(log);
            return (
              <Card key={log.id} className="overflow-hidden border-none ring-1 ring-border group hover:shadow-lg transition-all flex flex-col h-full">
                <div className="relative aspect-video">
                  <Image 
                    src={log.imageUrl || `https://picsum.photos/seed/${log.id}/600/400`} 
                    alt={log.name || 'Social Account'} 
                    fill 
                    className="object-cover"
                    data-ai-hint="social media"
                  />
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-primary text-white font-bold text-sm shadow-lg">
                      ₦{productPrice.toLocaleString()}
                    </Badge>
                  </div>
                </div>
                <CardHeader>
                  <CardTitle className="text-lg">{log.name || 'Aged Social Account'}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {log.description || 'No description provided for this high-trust account.'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 flex-1 flex flex-col justify-between">
                  {log.features && log.features.length > 0 && (
                    <ul className="space-y-1.5 mb-4">
                      {log.features.map((f: string, i: number) => (
                        <li key={i} className="text-xs flex items-center gap-2 text-muted-foreground">
                          <div className="h-1 w-1 rounded-full bg-primary" /> {f}
                        </li>
                      ))}
                    </ul>
                  )}
                  <Button 
                    onClick={() => handlePurchase(log)}
                    className="w-full font-bold h-11"
                    disabled={isProcessing}
                  >
                    {isProcessing ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <ShoppingBag className="h-4 w-4 mr-2" />}
                    Buy Now - ₦{productPrice.toLocaleString()}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-card rounded-2xl border-2 border-dashed">
          <Info className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-bold mb-2">No Accounts Available</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            We checked the <code className="text-primary">{collectionName}</code> collection but found 0 documents. 
            Please ensure you have added documents with a <code className="font-bold">name</code> and a price field.
          </p>
        </div>
      )}
    </div>
  );
}