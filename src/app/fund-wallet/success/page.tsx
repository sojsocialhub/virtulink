"use client";

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle2, Loader2, ArrowRight, AlertCircle, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

import { useUser } from '@/firebase';
import Link from 'next/link';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const reference = searchParams.get('reference');
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: authLoading } = useUser();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [amount, setAmount] = useState(0);

  useEffect(() => {
    if (authLoading || !reference || !user) return;

    const verifyPayment = async () => {
      try {
        const idToken = await user.getIdToken();

        const response = await fetch(
          `/api/paystack/verify?reference=${encodeURIComponent(reference)}`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${idToken}`,
            },
            cache: 'no-store',
          }
        );

        const data = await response.json();

        if (!response.ok || !data.status || data.data?.status !== 'success') {
          throw new Error(
            data.message || 'Paystack could not confirm this transaction.'
          );
        }

        const paidAmount = Number(data.data.amount) / 100;

        if (!Number.isFinite(paidAmount) || paidAmount <= 0) {
          throw new Error('Invalid payment amount returned by Paystack.');
        }

        setAmount(paidAmount);
        setStatus('success');

        toast({
          title: "Wallet Credited!",
          description: `₦${paidAmount.toLocaleString()} has been added to your balance.`,
        });
      } catch (error: any) {
        console.error('Payment Verification Error:', error);

        setStatus('error');

        toast({
          variant: "destructive",
          title: "Payment Processing Error",
          description:
            error?.message ||
            "We could not complete the wallet update. If you were debited, please contact support with your reference number.",
        });
      }
    };

    verifyPayment();
  }, [reference, user, authLoading, toast]);

  return (
    <div className="container mx-auto px-4 py-20 flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md border-none shadow-2xl text-center overflow-hidden">
        <div
          className={`h-2 ${
            status === 'success'
              ? 'bg-green-500'
              : status === 'error'
              ? 'bg-red-500'
              : 'bg-primary'
          }`}
        />

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
            {status === 'verifying'
              ? 'Confirming Payment...'
              : status === 'success'
              ? 'Wallet Credited!'
              : 'Verification Error'}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <p className="text-muted-foreground text-lg">
            {status === 'verifying' &&
              "We are securely verifying your transaction with Paystack. Please stay on this page."}

            {status === 'success' &&
              `Congratulations! ₦${amount.toLocaleString()} has been added to your balance. You can start purchasing services immediately.`}

            {status === 'error' &&
              "Something went wrong. If you were debited, please contact our support with your reference number."}
          </p>

          <div className="pt-4 flex flex-col gap-3">
            <Button
              className="w-full h-14 font-black text-xl rounded-2xl shadow-xl"
              onClick={() => router.push('/dashboard')}
              disabled={status === 'verifying'}
            >
              Back to Dashboard
              <ArrowRight className="ml-2 h-6 w-6" />
            </Button>

            {status === 'error' && (
              <Button variant="ghost" className="font-bold" asChild>
                <Link href="https://wa.me/2349120964447">
                  Contact Support
                </Link>
              </Button>
            )}
          </div>
        </CardContent>

        {reference && (
          <div className="p-4 bg-muted/50 border-t text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center justify-center gap-2">
            <ShieldCheck className="h-3 w-3" />
            Reference: {reference}
          </div>
        )}
      </Card>
    </div>
  );
}
