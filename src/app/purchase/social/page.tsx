'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare, ChevronLeft, CreditCard, Loader2, Info, ShoppingBag, AlertCircle, Terminal, Eye, Code } from 'lucide-react';
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
  const [debugLog, setDebugLog] = useState<string[]>([]);

  // Fetch real user data for wallet balance
  const userDocRef = useMemo(() => (db && user ? doc(db, 'users', user.uid) : null), [db, user]);
  const { data: userData } = useDoc(userDocRef);
  const walletBalance = userData?.walletBalance || 0;

  const collectionName = 'Sociallogs';
  const { data: logs, loading: loadingLogs, error: logsError } = useCollection(
    db ? query(collection(db, collectionName)) : null
  );

  /**
   * Universal helper to get a field value regardless of casing
   */
  const getCaseInsensitiveValue = (item: any, possibleNames: string[]): any => {
    const keys = Object.keys(item);
    const foundKey = keys.find(k => 
      possibleNames.map(p => p.toLowerCase()).includes(k.toLowerCase())
    );
    return foundKey ? item[foundKey] : undefined;
  };

  /**
   * Robust price parser that handles various field names and data types.
   */
  const getPrice = (log: any): number => {
    const rawPrice = getCaseInsensitiveValue(log, ['price', 'amount', 'cost']);

    if (rawPrice === undefined || rawPrice === null) return 0;
    
    // Handle numeric types
    if (typeof rawPrice === 'number') return rawPrice;
    
    // Handle string types (e.g., "5000" or "₦5,000")
    if (typeof rawPrice === 'string') {
      const cleaned = rawPrice.replace(/[^0-9.]/g, '');
      return parseFloat(cleaned) || 0;
    }

    // Handle Firestore Long/Int64 objects if they have a toNumber method
    if (typeof rawPrice === 'object' && typeof (rawPrice as any).toNumber === 'function') {
      return (rawPrice as any).toNumber();
    }
    
    return 0;
  };

  const handlePurchase = async (log: any) => {
    console.log("Purchase Request Triggered for:", log);
    const price = getPrice(log);
    
    const trace = [
      `Purchase initiated for ID: ${log.id}`,
      `Raw log data: ${JSON.stringify(log)}`,
      `Parsed Price: ${price}`,
      `Current Balance: ${walletBalance}`
    ];
    setDebugLog(trace);

    if (!db || !user || !userDocRef) {
      console.error("System state invalid:", { db: !!db, user: !!user, userDocRef: !!userDocRef });
      return;
    }

    if (price <= 0) {
      console.warn("Purchase blocked: Invalid Price", price);
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
        description: `You need ₦${price.toLocaleString()} but have ₦${walletBalance.toLocaleString()}.` 
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
        service: getCaseInsensitiveValue(log, ['name', 'title']) || 'Social Account',
        amount: price,
        status: 'Completed',
        date: new Date().toISOString()
      });

      toast({
        title: "Purchase Successful!",
        description: "Product details have been released to your dashboard."
      });
      router.push('/dashboard');
    } catch (e: any) {
      console.error("Purchase execution error:", e);
      toast({ 
        variant: "destructive", 
        title: "Purchase Failed", 
        description: e.message || "An error occurred while processing your order." 
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

      {/* Deep Diagnostics Panel */}
      <Card className="mb-8 border-none ring-1 ring-blue-200 bg-blue-50/30 overflow-hidden">
        <CardHeader className="py-3 bg-blue-100/50">
          <CardTitle className="text-xs flex items-center gap-2 text-blue-700 uppercase tracking-widest font-black">
            <Terminal className="h-3 w-3" /> Technical Deep Diagnostics
          </CardTitle>
        </CardHeader>
        <CardContent className="py-4 space-y-4 text-[11px] font-mono">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-muted-foreground">Firebase Context</p>
              <p>Project: <span className="font-bold text-blue-600">{projectId}</span></p>
              <p>Target Collection: <span className="font-bold">"{collectionName}"</span></p>
              <p>Balance: <span className="font-bold text-green-600">₦{walletBalance}</span></p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Data Summary</p>
              <p>Docs Returned: <span className="font-bold">{logs?.length || 0}</span></p>
              <p>Detected Fields: <span className="font-bold">{firstDocKeys.join(', ')}</span></p>
            </div>
          </div>
          
          {debugLog.length > 0 && (
            <div className="pt-2 border-t border-blue-100">
              <p className="text-muted-foreground mb-1 uppercase font-black text-[9px]">Last Action Trace:</p>
              <ul className="space-y-1 text-blue-800">
                {debugLog.map((log, i) => (
                  <li key={i} className="flex gap-2"><div className="w-1 h-1 rounded-full bg-blue-400 mt-1"/> {log}</li>
                ))}
              </ul>
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
            const name = getCaseInsensitiveValue(log, ['name', 'title']) || 'Untitled Account';
            const description = getCaseInsensitiveValue(log, ['description', 'info', 'summary']) || 'No description provided.';
            const imageUrl = getCaseInsensitiveValue(log, ['imageUrl', 'image', 'photo', 'url']);

            return (
              <Card key={log.id} className="overflow-hidden border-none ring-1 ring-border group hover:shadow-lg transition-all flex flex-col h-full bg-white">
                <div className="relative aspect-video bg-muted">
                  <Image 
                    src={imageUrl && (imageUrl.startsWith('http') || imageUrl.startsWith('data')) ? imageUrl : `https://picsum.photos/seed/${log.id}/600/400`} 
                    alt={name} 
                    fill 
                    className="object-cover"
                    data-ai-hint="social media account"
                  />
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-primary text-white font-bold text-sm shadow-lg px-3 py-1">
                      ₦{productPrice.toLocaleString()}
                    </Badge>
                  </div>
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-bold leading-tight">{name}</CardTitle>
                  <CardDescription className="text-xs line-clamp-3">
                    {description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 flex-1 flex flex-col justify-end pt-0">
                  <div className="pt-4 border-t mt-auto">
                    <Button 
                      onClick={() => handlePurchase(log)}
                      className="w-full font-black h-11 text-sm rounded-xl transition-all"
                      disabled={isProcessing}
                    >
                      {isProcessing ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <ShoppingBag className="h-4 w-4 mr-2" />}
                      Buy Account - ₦{productPrice.toLocaleString()}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-card rounded-2xl border-2 border-dashed">
          <Info className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-bold mb-2">Empty Shelf</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            We checked the <code className="text-primary font-bold">{collectionName}</code> collection but found 0 items. 
            Ensure your documents are in the correct project and collection name.
          </p>
        </div>
      )}
    </div>
  );
}
