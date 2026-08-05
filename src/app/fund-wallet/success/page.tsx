
"use client";

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle2, Loader2, ArrowRight, AlertCircle, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, increment, addDoc, collection, query, where, getDocs, limit, serverTimestamp } from 'firebase/firestore';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const reference = searchParams.get('reference');
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUser();
  const db = useFirestore();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [amount, setAmount] = useState(0);

  const userDocRef = useMemoFirebase(() => (db && user ? doc(db, 'users', user.uid) : null), [db, user]);

  useEffect(() => {
    if (!reference || !user || !db || !userDocRef) return;

    const verifyPayment = async () => {
      try {
        // 1. Idempotency Check: Check if this reference has already been processed in our records
        const q = query(collection(db, 'transactions'), where('reference', '==', reference), limit(1));
        const existingTx = await getDocs(q);
        
        if (!existingTx.empty) {
          const txData = existingTx.docs[0].data();
          setAmount(txData.amount);
          setStatus('success');
          return;
        }

        // 2. Server-side verification with Paystack Secret Key via our internal API
        const response = await fetch(`/api/paystack/verify?reference=${reference}`);
        const data = await response.json();

        if (data.status && data.data.status === 'success') {
          const paidAmount = data.data.amount / 100; // Paystack sends in kobo
          setAmount(paidAmount);

          // 3. Atomic Wallet Update
          // Use non-blocking mutation as per core constraints
          updateDoc(userDocRef, {
            walletBalance: increment(paidAmount)
          });

          // 4. Log Transaction record
          addDoc(collection(db, 'transactions'), {
            userId: user.uid,
            type: 'funding',
            amount: paidAmount,
            status: 'Completed',
            service: 'Paystack Instant Funding',
            date: new Date().toISOString(),
            reference: reference,
            method: 'Paystack',
            createdAt: serverTimestamp()
          });

          setStatus('success');
          toast({ 
            title: "Wallet Credited!", 
            description: `₦${paidAmount.toLocaleString()} has been added to your balance.` 
          });
        } else {
          setStatus('error');
          toast({ 
            variant: "destructive", 
            title: "Verification Failed", 
            description: "Paystack could not confirm this transaction." 
          });
        }
      } catch (error: any) {
        console.error('Payment Verification Error:', error);
        setStatus('error');
      }
    };

    verifyPayment();
  }, [reference, user, db, userDocRef, toast]);

  return (
    <div className="container mx-auto px-4 py-20 flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md border-none shadow-2xl text-center overflow-hidden">
        <div className={`h-2 ${status === 'success' ? 'bg-green-500' : status === 'error' ? 'bg-red-500' : 'bg-primary'}`} />
        <CardHeader>
          <div className="flex justify-center mb-6">
            {status === 'verifying' && (
              <div className="relative">
                <Loader2 className="h-20 w-20 animate-spin text-primary" />
                <PayIcon className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 text-primary" />
              </div>
            )}
            {status === 'success' && (
              <div className="h-24 w-24 rounded-full bg-green-100 flex items-center justify-center text-green-600 shadow-inner">
                <CheckCircle2 className="h-14 w-14" />
              </div>
            )}
            {status === 'error' && (
              <div className="h-24 w-24 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                <AlertCircle className="h-14 w-14" />
              </div>
            )}
          </div>
          <CardTitle className="text-3xl font-black font-headline">
            {status === 'verifying' ? 'Confirming Payment...' : status === 'success' ? 'Wallet Credited!' : 'Verification Error'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground text-lg">
            {status === 'verifying' && "We are securely verifying your transaction with Paystack. Please stay on this page."}
            {status === 'success' && `Congratulations! ₦${amount.toLocaleString()} has been added to your balance. You can start purchasing services immediately.`}
            {status === 'error' && "Something went wrong. If you were debited, please contact our support with your reference number."}
          </p>
          
          <div className="pt-4 flex flex-col gap-3">
            <Button 
              className="w-full h-14 font-black text-xl rounded-2xl shadow-xl" 
              onClick={() => router.push('/dashboard')}
              disabled={status === 'verifying'}
            >
              Back to Dashboard <ArrowRight className="ml-2 h-6 w-6" />
            </Button>
            {status === 'error' && (
              <Button variant="ghost" className="font-bold" asChild>
                <Link href="https://wa.me/2349120964447">Contact Support</Link>
              </Button>
            )}
          </div>
        </CardContent>
        {status === 'success' && (
          <div className="p-4 bg-muted/50 border-t text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center justify-center gap-2">
            <ShieldCheck className="h-3 w-3" /> Reference: {reference}
          </div>
        )}
      </Card>
    </div>
  );
}

function PayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="14" x="2" y="5" rx="2"/>
      <line x1="2" x2="22" y1="10" y2="10"/>
    </svg>
  );
}
