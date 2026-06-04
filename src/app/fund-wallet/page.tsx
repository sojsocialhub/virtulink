
"use client";

import { useState } from 'react';
import { CreditCard, ChevronLeft, Loader2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function FundWalletPage() {
  const { toast } = useToast();
  const { user } = useUser();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [amount, setAmount] = useState('');

  const handleFund = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const numAmount = Number(amount);
    
    if (!user) {
      toast({ variant: "destructive", title: "Authentication required", description: "Please log in to fund your wallet." });
      return;
    }

    if (!amount || isNaN(numAmount) || numAmount < 100) {
      toast({ 
        variant: "destructive", 
        title: "Invalid amount", 
        description: "Minimum funding amount is ₦100." 
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/paystack/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          amount: numAmount,
          callback_url: `${window.location.origin}/fund-wallet/success`,
        }),
      });

      const data = await response.json();
      
      if (data.status && data.data.authorization_url) {
        // Redirect to Paystack
        window.location.href = data.data.authorization_url;
      } else {
        throw new Error(data.message || 'Payment initialization failed');
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Payment Error",
        description: error.message || "Could not initialize payment. Check your internet or try again."
      });
      setIsSubmitting(false);
    }
  };

  const displayAmount = amount && !isNaN(Number(amount)) 
    ? Number(amount).toLocaleString() 
    : '0';

  return (
    <div className="container mx-auto px-4 py-12 max-w-xl">
      <Link href="/dashboard" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-6">
        <ChevronLeft className="mr-1 h-4 w-4" />
        Back to Dashboard
      </Link>

      <Card className="border-none shadow-2xl ring-1 ring-border overflow-hidden">
        <div className="bg-primary h-2" />
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl font-black flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary fill-current" /> Instant Wallet Funding
          </CardTitle>
          <CardDescription>Secure payment powered by Paystack. Your wallet will be credited instantly after payment.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleFund} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Amount to Add (₦)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-muted-foreground">₦</span>
                <Input 
                  type="number" 
                  placeholder="0.00" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="h-16 text-3xl font-black pl-12 border-2 focus-visible:ring-primary rounded-2xl"
                  required
                  min="100"
                />
              </div>
              <p className="text-xs text-muted-foreground">Min: ₦100 | Secure 256-bit SSL encrypted</p>
            </div>

            <Button 
              type="submit" 
              className="w-full h-16 text-xl font-black shadow-xl shadow-primary/20 rounded-2xl" 
              disabled={isSubmitting || !amount || Number(amount) < 100}
            >
              {isSubmitting ? (
                <><Loader2 className="mr-2 h-6 w-6 animate-spin" /> Initializing...</>
              ) : (
                <><CreditCard className="mr-2 h-6 w-6" /> Pay ₦{displayAmount} Now</>
              )}
            </Button>

            <div className="flex flex-col items-center justify-center gap-4 pt-4 border-t border-dashed">
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Secure Payment Partner</p>
              <img 
                src="https://checkout.paystack.com/assets/img/logos/paystack/paystack_logo_blue.png" 
                alt="Paystack" 
                className="h-6 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all" 
              />
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
