
"use client";

import { useState } from 'react';
import { Copy, CheckCircle2, Upload, CreditCard, ChevronLeft, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { ADMIN_BANK_DETAILS } from '@/lib/data';
import Link from 'next/link';

export default function FundWalletPage() {
  const { toast } = useToast();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [amount, setAmount] = useState('');

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    toast({
      title: "Copied!",
      description: `${field} copied to clipboard.`
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      toast({ variant: "destructive", title: "Error", description: "Please enter a valid amount." });
      return;
    }

    setIsSubmitting(true);
    // Simulate API call to Firestore fundRequests
    setTimeout(() => {
      setIsSubmitting(false);
      toast({
        title: "Request Submitted!",
        description: "Your funding request is being reviewed by the admin."
      });
      setScreenshot(null);
      setAmount('');
    }, 1500);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Link href="/dashboard" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-6">
        <ChevronLeft className="mr-1 h-4 w-4" />
        Back to Dashboard
      </Link>

      <div className="space-y-6">
        <Card className="border-none shadow-sm ring-1 ring-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" /> Bank Transfer Details
            </CardTitle>
            <CardDescription>Transfer money to the account below and upload proof.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Bank Name</p>
                  <p className="font-bold">{ADMIN_BANK_DETAILS.bankName}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Account Name</p>
                  <p className="font-bold text-xs">{ADMIN_BANK_DETAILS.accountName}</p>
                </div>
              </div>
              
              <div className="pt-4 border-t border-primary/10">
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-2">Account Number</p>
                <div className="flex items-center justify-between bg-white p-4 rounded-xl ring-1 ring-primary/20">
                  <p className="font-mono font-bold text-2xl tracking-tighter text-primary">{ADMIN_BANK_DETAILS.accountNumber}</p>
                  <Button variant="ghost" size="icon" className="text-primary" onClick={() => copyToClipboard(ADMIN_BANK_DETAILS.accountNumber, "Account")}>
                    {copiedField === "Account" ? <CheckCircle2 className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-xl bg-yellow-50 border border-yellow-200 text-yellow-800 text-xs leading-relaxed">
              <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p>Please ensure you use your <strong>registered name</strong> as the transfer description for faster verification.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm ring-1 ring-border">
          <CardHeader>
            <CardTitle className="text-lg">Submit Proof of Payment</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold">Amount Transferred (₦)</label>
                <Input 
                  type="number" 
                  placeholder="Enter amount" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="h-12 text-lg font-bold"
                />
              </div>

              <div 
                className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors cursor-pointer ${screenshot ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                <Input 
                  id="file-upload"
                  type="file" 
                  className="hidden" 
                  accept="image/*"
                  onChange={(e) => setScreenshot(e.target.files?.[0]?.name || "Proof selected")}
                />
                <div className="flex flex-col items-center space-y-3">
                  {screenshot ? (
                    <>
                      <CheckCircle2 className="h-12 w-12 text-primary" />
                      <p className="font-bold text-primary">{screenshot}</p>
                      <p className="text-xs text-muted-foreground">Click to change file</p>
                    </>
                  ) : (
                    <>
                      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                        <Upload className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-bold">Upload Payment Screenshot</p>
                        <p className="text-xs text-muted-foreground mt-1">Optional, but speeds up verification</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-14 text-lg font-bold shadow-lg shadow-primary/20" 
                disabled={isSubmitting || !amount}
              >
                {isSubmitting ? "Submitting..." : "I have transferred the money"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
