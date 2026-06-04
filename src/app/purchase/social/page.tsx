'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare, ChevronLeft, ShoppingBag, Loader2, Info, Terminal, AlertCircle, FileJson } from 'lucide-react';
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
  const [deepTrace, setDeepTrace] = useState<any>(null);

  const userDocRef = useMemo(() => (db && user ? doc(db, 'users', user.uid) : null), [db, user]);
  const { data: userData } = useDoc(userDocRef);
  const walletBalance = userData?.walletBalance || 0;

  const collectionName = 'Sociallogs';
  const { data: rawLogs, loading: loadingLogs, error: logsError } = useCollection(
    db ? query(collection(db, collectionName)) : null
  );

  /**
   * Deep-trims all keys in an object to remove trailing/leading whitespace.
   */
  const sanitizeObject = (obj: any): any => {
    if (!obj || typeof obj !== 'object' || obj instanceof Date) return obj;
    
    // Handle arrays
    if (Array.isArray(obj)) {
      return obj.map(item => sanitizeObject(item));
    }

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

  /**
   * Sanitized version of the logs from Firestore
   */
  const logs = useMemo(() => {
    if (!rawLogs) return [];
    return rawLogs.map(log => sanitizeObject(log));
  }, [rawLogs]);

  /**
   * Helper to validate URLs for Next.js Image component
   */
  const isValidImageUrl = (url: any): boolean => {
    if (typeof url !== 'string') return false;
    return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/');
  };

  /**
   * Resilient price parser
   */
  const getPriceData = (log: any) => {
    // After sanitization, keys like "price " are now "price"
    const rawPrice = log.price || log.Price || log.amount || log.Amount;
    const type = typeof rawPrice;
    let parsed = 0;

    if (rawPrice !== undefined && rawPrice !== null) {
      if (type === 'number') {
        parsed = rawPrice;
      } else if (type === 'string') {
        parsed = parseFloat(rawPrice.replace(/[^0-9.]/g, '')) || 0;
      } else if (rawPrice && typeof (rawPrice as any).toNumber === 'function') {
        parsed = (rawPrice as any).toNumber();
      } else {
        parsed = parseFloat(String(rawPrice)) || 0;
      }
    }

    return { raw: rawPrice, type, parsed };
  };

  const handlePurchase = async (log: any) => {
    const { raw, type, parsed } = getPriceData(log);
    const logKeys = Object.keys(log || {});
    
    const trace = [
      `[1] CHECKOUT ENTRY: ID ${log.id}`,
      `[2] SANITIZED KEYS: ${logKeys.join(', ')}`,
      `[3] PRICE RAW: ${JSON.stringify(raw)}`,
      `[4] PRICE TYPE: ${type}`,
      `[5] PRICE PARSED: ${parsed}`
    ];
    
    setDebugLog(trace);
    setDeepTrace({ stage: 'checkout_click', keys: logKeys, fullObject: { ...log } });

    if (!db || !user || !userDocRef) return;

    if (parsed <= 0) {
      toast({
        variant: "destructive",
        title: "Price Validation Error",
        description: `Price received: ${JSON.stringify(raw)}, Type: ${type}, Parsed: ${parsed}. Check Firestore for 'price' field.`
      });
      return;
    }

    if (parsed > walletBalance) {
      toast({ 
        variant: "destructive", 
        title: "Insufficient Balance", 
        description: `Price: ₦${parsed.toLocaleString()}, Balance: ₦${walletBalance.toLocaleString()}` 
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

      toast({
        title: "Purchase Successful!",
        description: "Your account details are being generated."
      });
      router.push('/dashboard');
    } catch (e: any) {
      toast({ 
        variant: "destructive", 
        title: "Database Error", 
        description: e.message 
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const projectId = app?.options?.projectId || 'Not Found';

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <Link href="/dashboard" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-6">
        <ChevronLeft className="mr-1 h-4 w-4" /> Back to Dashboard
      </Link>

      <header className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MessageSquare className="h-8 w-8 text-primary" /> Social Logs
          </h1>
          <p className="text-muted-foreground">Premium aged accounts for marketing.</p>
        </div>
        <div className="bg-primary/5 px-4 py-2 rounded-lg border border-primary/10">
          <p className="text-[10px] uppercase font-black text-primary tracking-widest">Balance</p>
          <p className="text-lg font-bold">₦{walletBalance.toLocaleString()}</p>
        </div>
      </header>

      {/* Advanced Diagnostics Panel */}
      <Card className="mb-8 border-none ring-1 ring-primary/20 bg-primary/[0.02] overflow-hidden">
        <CardHeader className="py-2 bg-primary/10 border-b border-primary/10">
          <CardTitle className="text-[10px] flex items-center gap-2 text-primary uppercase tracking-widest font-black">
            <Terminal className="h-3 w-3" /> Sanitization & Trace Diagnostics
          </CardTitle>
        </CardHeader>
        <CardContent className="py-4 space-y-4 text-[11px] font-mono">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-muted-foreground uppercase text-[9px] font-bold">Environment</p>
              <p>Project: <span className="font-bold text-primary">{projectId}</span></p>
              <p>Collection: <span className="font-bold">{collectionName}</span></p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground uppercase text-[9px] font-bold">Inventory</p>
              <p>Docs Found: <span className="font-bold">{logs?.length || 0}</span></p>
              <p>Normalization: <span className="text-green-600 font-bold">Active (Trimming Keys)</span></p>
            </div>
            {debugLog.length > 0 && (
              <div className="space-y-1 border-l pl-4 border-primary/20">
                <p className="text-primary font-bold uppercase text-[9px]">Last Action Trace</p>
                <ul className="space-y-0.5 text-[10px]">
                  {debugLog.map((line, i) => <li key={i}>{line}</li>)}
                </ul>
              </div>
            )}
          </div>
          
          {deepTrace && (
            <div className="pt-3 border-t border-primary/10">
              <p className="text-primary font-bold mb-2 flex items-center gap-2">
                <FileJson className="h-3 w-3" /> Sanitized Object Snapshot
              </p>
              <pre className="p-2 bg-black/5 rounded text-[10px] overflow-auto max-h-32">
                {JSON.stringify(deepTrace.fullObject, null, 2)}
              </pre>
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
            const priceData = getPriceData(log);
            const name = log.name || log.Name || 'Untitled Account';
            const desc = log.description || log.Description || 'No description available.';
            const rawImage = log.imageUrl || log.ImageUrl || log.image;
            const image = isValidImageUrl(rawImage) ? rawImage : `https://picsum.photos/seed/${log.id}/600/400`;

            return (
              <Card key={log.id} className="overflow-hidden border-none ring-1 ring-border group hover:shadow-lg transition-all flex flex-col h-full bg-white">
                <div className="relative aspect-video bg-muted">
                  <Image 
                    src={image} 
                    alt={name} 
                    fill 
                    className="object-cover"
                    data-ai-hint="social media account"
                  />
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-primary text-white font-bold text-sm px-3 py-1 shadow-md">
                      ₦{priceData.parsed.toLocaleString()}
                    </Badge>
                  </div>
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-bold truncate">{name}</CardTitle>
                  <CardDescription className="text-xs line-clamp-2 min-h-[32px]">{desc}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-2 mt-auto">
                  <Button 
                    onClick={() => handlePurchase(log)}
                    className="w-full font-black h-11"
                    disabled={isProcessing}
                  >
                    {isProcessing ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <ShoppingBag className="h-4 w-4 mr-2" />}
                    Buy Account
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-card rounded-2xl border-2 border-dashed border-muted-foreground/10">
          <Info className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-20" />
          <h3 className="text-lg font-bold">No Accounts Available</h3>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            We checked the <span className="font-bold">{collectionName}</span> collection but found 0 documents.
          </p>
        </div>
      )}
    </div>
  );
}
