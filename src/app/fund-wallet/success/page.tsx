
"use client";

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle2, Loader2, ArrowRight, AlertCircle, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, increment, addDoc, collection, query, where, getDocs, limit, serverTimestamp } from 'firebase/firestore';
import Link from 'next/link';

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
        // 1. Check if this reference has already been credited (idempotency)
        const q = query(collection(db, 'transactions'), where('reference', '==', reference), limit(1));
        const existingTx = await getDocs(q);
        
        if (!existingTx.empty) {
          const txData = existingTx.docs[0].data();
          setAmount(txData.amount);
          setStatus('success');
          return;
        }

        // 2. Verify with server-side API
        const response = await fetch(`/api/paystack/verify?reference=${reference}`);
        const data = await response.json();

        if (data.status && data.data.status === 'success') {
          const paidAmount = data.data.amount / 100; // Paystack returns kobo
          setAmount(paidAmount);

          // 3. Increment balance
          await updateDoc(userDocRef, {
            walletBalance: increment(paidAmount)
          });

          // 4. Log transaction
          await addDoc(collection(db, 'transactions'), {
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
            description: data.message || "Paystack could not confirm this transaction." 
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
