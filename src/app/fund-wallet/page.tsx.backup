
"use client";

import { useState } from 'react';
import { CreditCard as PayIcon, ChevronLeft, Zap, Copy, CheckCircle2, ShieldCheck, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ADMIN_BANK_DETAILS } from '@/lib/data';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function FundWalletPage() {
  const { toast } = useToast();
  const { user } = useUser();
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "";


  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    toast({ title: "Copied!", description: `${field} copied to clipboard.` });
  };
  const handlePaystackPayment = () => {
    const amountNum = Number(amount);

    if (!amount || isNaN(amountNum) || amountNum < 100) {
      toast({
        variant: "destructive",
        title: "Invalid amount",
        description: "Minimum funding amount is ₦100. Please enter a value of 100 or higher."
      });
      return;
    }

    if (!publicKey) {
      toast({
        variant: "destructive",
        title: "Configuration Error",
        description: "Paystack public key is missing in your environment configuration."
      });
      return;
    }

    if (typeof window === "undefined") return;

    const openPaystack = () => {
      const PaystackPop = (window as any).PaystackPop;

      if (!PaystackPop) {
        toast({
          variant: "destructive",
          title: "Payment Error",
          description: "Paystack could not be loaded. Please check your internet connection and try again."
        });
        return;
      }

      const handler = PaystackPop.setup({
        key: publicKey,
        email: user?.email || "",
        amount: amountNum * 100,
        ref: `VL-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        callback: (response: any) => {
          router.push(`/fund-wallet/success?reference=${response.reference}`);
        },
        onClose: () => {
          toast({
            title: "Payment Cancelled",
            description: "You closed the payment window."
          });
        }
      });

      handler.openIframe();
    };

    if ((window as any).PaystackPop) {
      openPaystack();
      return;
    }

    const existingScript = document.querySelector(
      'script[src="https://js.paystack.co/v2/inline.js"]'
    );

    if (existingScript) {
      existingScript.addEventListener("load", openPaystack, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v2/inline.js";
    script.async = true;
    script.onload = openPaystack;
    script.onerror = () => {
      toast({
        variant: "destructive",
        title: "Payment Error",
        description: "Unable to load Paystack. Please try again."
      });
    };

    document.body.appendChild(script);
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <Link href="/dashboard" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-6">
        <ChevronLeft className="mr-1 h-4 w-4" />
        Back to Dashboard
      </Link>

      <div className="space-y-8">
        <header className="text-center space-y-2">
          <h1 className="text-4xl font-black font-headline text-primary tracking-tight text-center">Fund Your Wallet</h1>
          <p className="text-muted-foreground text-center">Select your preferred method to add funds to your account.</p>
        </header>

        <Tabs defaultValue="paystack" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-14 p-1 bg-muted rounded-2xl">
            <TabsTrigger value="paystack" className="rounded-xl font-bold">
              <PayIcon className="mr-2 h-4 w-4" /> Instant (Paystack)
            </TabsTrigger>
            <TabsTrigger value="manual" className="rounded-xl font-bold">
              <Zap className="mr-2 h-4 w-4" /> Manual (Bank Transfer)
            </TabsTrigger>
          </TabsList>

          <TabsContent value="paystack" className="mt-8 animate-in fade-in slide-in-from-bottom-2">
            <Card className="border-none shadow-xl ring-1 ring-border max-w-md mx-auto overflow-hidden">
              <div className="bg-primary h-2" />
              <CardHeader>
                <CardTitle className="text-2xl font-black">Pay with Card/Bank</CardTitle>
                <CardDescription>Instant wallet credit via Paystack secure gateway.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Amount to Fund (₦)</Label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">₦</span>
                    <Input 
                      type="number" 
                      placeholder="Min 100" 
                      className="h-14 pl-10 text-xl font-black rounded-xl"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Minimum: ₦100</p>
                </div>

                <Button 
                  onClick={handlePaystackPayment}
                  className="w-full h-16 text-lg font-black shadow-lg shadow-primary/20 rounded-2xl" 
                >
                  <PayIcon className="mr-2 h-5 w-5" />
                  Pay ₦{Number(amount).toLocaleString() || '0'} Now
                </Button>

                <div className="flex flex-col items-center justify-center gap-2 pt-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <ShieldCheck className="h-4 w-4 text-green-600" />
                    Secured by Paystack
                  </div>
                  <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-tighter">
                    {Boolean(publicKey) ? "Key Loaded" : "Key Missing"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manual" className="mt-8 animate-in fade-in slide-in-from-bottom-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="border-none shadow-xl ring-1 ring-border overflow-hidden">
                <div className="bg-primary h-2" />
                <CardHeader>
                  <CardTitle className="text-2xl font-black flex items-center gap-2">
                    <Wallet className="h-6 w-6 text-primary" /> Bank Details
                  </CardTitle>
                  <CardDescription>Transfer funds and contact support for manual credit.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-muted/50 rounded-2xl p-6 space-y-4 border border-border">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Bank Name</Label>
                      <div className="flex justify-between items-center bg-background p-3 rounded-xl border">
                        <span className="font-bold">{ADMIN_BANK_DETAILS.bankName}</span>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyToClipboard(ADMIN_BANK_DETAILS.bankName, "Bank")}>
                          {copiedField === "Bank" ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Account Number</Label>
                      <div className="flex justify-between items-center bg-background p-3 rounded-xl border">
                        <span className="text-2xl font-black font-mono tracking-tight">{ADMIN_BANK_DETAILS.accountNumber}</span>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyToClipboard(ADMIN_BANK_DETAILS.accountNumber, "Account")}>
                          {copiedField === "Account" ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Account Name</Label>
                      <div className="p-3 bg-background rounded-xl border font-bold text-primary">
                        {ADMIN_BANK_DETAILS.accountName}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-xl ring-1 ring-border flex flex-col justify-center text-center p-8 bg-primary/5">
                <ShieldCheck className="h-16 w-16 text-primary mx-auto mb-6" />
                <h3 className="text-xl font-black mb-2">Manual Verification</h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-8">
                  After transfer, please send your proof of payment (screenshot) to our WhatsApp support for manual credit. 
                  This is our backup method when card payments are unavailable.
                </p>
                <Button variant="outline" className="h-14 font-black text-primary border-primary hover:bg-primary hover:text-white" asChild>
                   <Link href="https://wa.me/2349120964447" target="_blank">Contact Support on WhatsApp</Link>
                </Button>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
