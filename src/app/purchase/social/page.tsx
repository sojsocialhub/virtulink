'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare, ChevronLeft, ShoppingBag, Loader2, Info, Terminal, AlertCircle } from 'lucide-react';
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
   * Helper to check if a string is a valid image URL for Next.js Image component
   */
  const isValidImageUrl = (url: any): boolean => {
    if (typeof url !== 'string') return false;
    return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/');
  };

  /**
   * Helper to get a field value regardless of casing
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
  const getPriceData = (log: any) => {
    const rawPrice = getCaseInsensitiveValue(log, ['price', 'amount', 'cost']);
    const type = typeof rawPrice;
    let parsed = 0;

    if (rawPrice !== undefined && rawPrice !== null) {
      if (type === 'number') {
        parsed = rawPrice;
      } else if (type === 'string') {
        parsed = parseFloat(rawPrice.replace(/[^0-9.]/g, '')) || 0;
      } else if (type === 'object' && typeof (rawPrice as any).toNumber === 'function') {
        parsed = (rawPrice as any).toNumber();
      } else if (type === 'object' && rawPrice.toString) {
        // Fallback for some Firestore object representations
        parsed = parseFloat(rawPrice.toString()) || 0;
      }
    }

    return { raw: rawPrice, type, parsed };
  };

  const handlePurchase = async (log: any) => {
    const { raw, type, parsed } = getPriceData(log);
    
    const trace = [
      `BUY CLICK: Document ID ${log.id}`,
      `Raw Price Field: ${JSON.stringify(raw)}`,
      `JS Type: ${type}`,
      `Parsed Value: ${parsed}`,
      `Validation Check: (parsed <= 0) is ${parsed <= 0}`
    ];
    setDebugLog(trace);
    console.log("SOCIAL_LOG_TRACE:", trace);

    if (!db || !user || !userDocRef) return;

    // The specific debug message requested
    if (parsed <= 0) {
      toast({
        variant: "destructive",
        title: "Price Validation Error",
        description: `Price received: ${JSON.stringify(raw)}, Type: ${type}, Parsed: ${parsed}`
      });
      return;
    }

    if (parsed > walletBalance) {
      toast({ 
        variant: "destructive", 
        title: "Insufficient Balance", 
        description: `Cost: ₦${parsed.toLocaleString()}, Balance: ₦${walletBalance.toLocaleString()}` 
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
        service: getCaseInsensitiveValue(log, ['name', 'title']) || 'Social Account',
        amount: parsed,
        status: 'Completed',
        date: new Date().toISOString()
      });

      toast({
        title: "Purchase Successful!",
        description: "Account details are being processed."
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

      <header className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <MessageSquare className="h-8 w-8 text-primary" /> Social Media Logs
        </h1>
        <p className="text-muted-foreground">High-trust, aged accounts for business needs.</p>
      </header>

      {/* Deep Diagnostics Panel */}
      <Card className="mb-8 border-none ring-1 ring-blue-200 bg-blue-50/30 overflow-hidden">
        <CardHeader className="py-3 bg-blue-100/50">
          <CardTitle className="text-xs flex items-center gap-2 text-blue-700 uppercase tracking-widest font-black">
            <Terminal className="h-3 w-3" /> System Trace Diagnostics
          </CardTitle>
        </CardHeader>
        <CardContent className="py-4 space-y-3 text-[11px] font-mono">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-muted-foreground">Environment</p>
              <p>Project ID: <span className="font-bold text-blue-600">{projectId}</span></p>
              <p>Wallet: <span className="font-bold">₦{walletBalance}</span></p>
            </div>
            <div>
              <p className="text-muted-foreground">Firestore Collection: <span className="text-foreground">"{collectionName}"</span></p>
              <p>Docs Loaded: <span className="font-bold">{logs?.length || 0}</span></p>
            </div>
          </div>
          
          {debugLog.length > 0 && (
            <div className="pt-3 border-t border-blue-100">
              <p className="text-blue-700 font-bold mb-1 underline">Last Action Price Trace:</p>
              <ul className="space-y-1 text-blue-900">
                {debugLog.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {logsError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Firebase Error</AlertTitle>
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
            const name = getCaseInsensitiveValue(log, ['name', 'title']) || 'Untitled Account';
            const desc = getCaseInsensitiveValue(log, ['description', 'desc', 'summary']) || 'No info.';
            const rawImage = getCaseInsensitiveValue(log, ['imageUrl', 'image', 'photo']);
            
            // Fix: Check if rawImage is a valid URL, otherwise use fallback to prevent Image component crash
            const image = isValidImageUrl(rawImage) ? rawImage : `https://picsum.photos/seed/${log.id}/600/400`;

            return (
              <Card key={log.id} className="overflow-hidden border-none ring-1 ring-border group hover:shadow-lg transition-all flex flex-col h-full bg-white">
                <div className="relative aspect-video bg-muted">
                  <Image 
                    src={image} 
                    alt={name} 
                    fill 
                    className="object-cover"
                    data-ai-hint="social account"
                  />
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-primary text-white font-bold text-sm px-3 py-1 shadow-md">
                      ₦{priceData.parsed.toLocaleString()}
                    </Badge>
                  </div>
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-bold truncate">{name}</CardTitle>
                  <CardDescription className="text-xs line-clamp-2">{desc}</CardDescription>
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
        <div className="text-center py-20 bg-card rounded-2xl border-2 border-dashed border-muted-foreground/20">
          <Info className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-20" />
          <p className="text-muted-foreground">No accounts found in {collectionName}.</p>
        </div>
      )}
    </div>
  );
}
