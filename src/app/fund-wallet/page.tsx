
"use client";

import { useState } from 'react';
import { CreditCard, ChevronLeft, Loader2, Zap, Copy, CheckCircle2, ShieldCheck, User, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore } from '@/firebase';
import { collection, addDoc } from 'firebase/firestore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ADMIN_BANK_DETAILS } from '@/lib/data';
import { Label } from '@/components/ui/label';

export default function FundWalletPage() {
  const { toast } = useToast();
  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    amount: '',
    senderName: '',
    reference: ''
  });

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    toast({ title: "Copied!", description: `${field} copied to clipboard.` });
  };

  const handleFundRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !user) return;

    const amountNum = Number(formData.amount);
    if (!formData.amount || isNaN(amountNum) || amountNum < 100) {
      toast({ variant: "destructive", title: "Invalid amount", description: "Minimum funding is ₦100." });
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'purchase_requests'), {
        userId: user.uid,
        userEmail: user.email,
        productName: 'Wallet Funding',
        amount: amountNum,
        senderName: formData.senderName,
        reference: formData.reference,
        status: 'pending',
        date: new Date().toISOString()
      });

      toast({
        title: "Request Submitted!",
        description: "Your payment proof has been sent for verification. Wallet will be credited shortly."
      });
      router.push('/dashboard');
    } catch (error: any) {
      toast({ variant: "destructive", title: "Submission Failed", description: error.message });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <Link href="/dashboard" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-6">
        <ChevronLeft className="mr-1 h-4 w-4" />
        Back to Dashboard
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Bank Details */}
        <Card className="border-none shadow-xl ring-1 ring-border overflow-hidden">
          <div className="bg-primary h-2" />
          <CardHeader>
            <CardTitle className="text-2xl font-black flex items-center gap-2">
              <Zap className="h-6 w-6 text-primary" /> Bank Transfer Details
            </CardTitle>
            <CardDescription>Transfer the amount you wish to fund to the account below.</CardDescription>
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

            <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-xs text-yellow-800">
              <ShieldCheck className="h-5 w-5 flex-shrink-0 text-yellow-600" />
              <p>Please use your full name or registered email as the transfer narration/remark to help us verify your payment faster.</p>
            </div>
          </CardContent>
        </Card>

        {/* Proof Submission */}
        <Card className="border-none shadow-xl ring-1 ring-border">
          <CardHeader>
            <CardTitle className="text-2xl font-black">Submit Payment Proof</CardTitle>
            <CardDescription>Provide transfer details for instant verification.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleFundRequest} className="space-y-6">
              <div className="space-y-2">
                <Label>Amount Transferred (₦)</Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">₦</span>
                  <Input 
                    type="number" 
                    placeholder="0" 
                    className="h-12 pl-10 text-lg font-bold"
                    value={formData.amount}
                    onChange={e => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Sender Name</Label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Full name on bank account" 
                    className="h-12 pl-10"
                    value={formData.senderName}
                    onChange={e => setFormData(prev => ({ ...prev, senderName: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Transaction Reference / ID</Label>
                <div className="relative">
                  <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Optional: Ref number" 
                    className="h-12 pl-10"
                    value={formData.reference}
                    onChange={e => setFormData(prev => ({ ...prev, reference: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-14 text-lg font-black shadow-lg" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Verifying...</>
                ) : (
                  <><Upload className="mr-2 h-5 w-5" /> Submit for Verification</>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
