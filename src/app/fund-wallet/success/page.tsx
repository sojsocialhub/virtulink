
"use client";

import { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle2, Loader2, ArrowRight, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser } from '@/firebase';
import { doc, updateDoc, increment, addDoc, collection } from 'firebase/firestore';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const reference = searchParams.get('reference');
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUser();
  const db = useFirestore();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [amount, setAmount] = useState(0);

  const userDocRef = useMemo(() => (db && user ? doc(db, 'users', user.uid) : null), [db, user]);

  useEffect(() => {
    if (!reference || !user || !db || !userDocRef) return;

    const verifyPayment = async () => {
      try {
        const response = await fetch(`/api/paystack/verify?reference=${reference}`);
        const data = await response.json();

        if (data.status && data.data.status === 'success') {
          const paidAmount = data.data.amount / 100;
          setAmount(paidAmount);

          // Update Balance
          updateDoc(userDocRef, {
            walletBalance: increment(paidAmount)
          });

          // Log Transaction
          addDoc(collection(db, 'transactions'), {
            userId: user.uid,
            type: 'funding',
            amount: paidAmount,
            status: 'Completed',
            date: new Date().toISOString(),
            reference: reference
          });

          setStatus('success');
          toast({ title: "Payment Successful!", description: `₦${paidAmount} added to your wallet.` });
        } else {
          setStatus('error');
        }
      } catch (error) {
        console.error(error);
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
            {status === 'verifying' && <Loader2 className="h-16 w-16 animate-spin text-primary" />}
            {status === 'success' && <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center text-green-600"><CheckCircle2 className="h-12 w-12" /></div>}
            {status === 'error' && <div className="h-20 w-20 rounded-full bg-red-100 flex items-center justify-center text-red-600"><AlertCircle className="h-12 w-12" /></div>}
          </div>
          <CardTitle className="text-2xl font-black">
            {status === 'verifying' ? 'Verifying Payment...' : status === 'success' ? 'Payment Verified!' : 'Verification Failed'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground">
            {status === 'verifying' && "Please wait while we confirm your payment with Paystack."}
            {status === 'success' && `Congratulations! ₦${amount.toLocaleString()} has been added to your wallet balance.`}
            {status === 'error' && "We couldn't verify your payment. If you were debited, please contact support."}
          </p>
          
          <Button 
            className="w-full h-14 font-black text-lg" 
            onClick={() => router.push('/dashboard')}
            disabled={status === 'verifying'}
          >
            Go to Dashboard <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
