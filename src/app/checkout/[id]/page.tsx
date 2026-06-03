"use client";

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Copy, CheckCircle2, Upload, CreditCard, ChevronLeft, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { INITIAL_PRODUCTS, BANK_DETAILS } from '@/lib/data';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import Image from 'next/image';

export default function CheckoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const product = INITIAL_PRODUCTS.find(p => p.id === id);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [screenshot, setScreenshot] = useState<string | null>(null);

  if (!product) return <div>Product not found</div>;

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
    if (!screenshot) {
      toast({
        variant: "destructive",
        title: "Missing proof",
        description: "Please upload a payment screenshot to proceed."
      });
      return;
    }

    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      toast({
        title: "Order Submitted!",
        description: "Your order is now pending review. We will notify you once verified."
      });
      router.push('/dashboard');
    }, 1500);
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <Link href="/products" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-8">
        <ChevronLeft className="mr-1 h-4 w-4" />
        Back to Products
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Payment Instructions */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none ring-1 ring-border shadow-sm">
            <CardHeader>
              <div className="flex items-center space-x-2 text-primary mb-2">
                <CreditCard className="h-5 w-5" />
                <span className="text-sm font-bold tracking-widest uppercase">Step 1: Payment Details</span>
              </div>
              <CardTitle>Transfer Instructions</CardTitle>
              <CardDescription>Please transfer the exact amount below to our official bank account.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-muted-foreground">Amount to Pay:</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl font-bold text-primary">${product.price.toFixed(2)}</span>
                    <Button variant="ghost" size="icon" onClick={() => copyToClipboard(product.price.toString(), "Amount")}>
                      {copiedField === "Amount" ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-bold uppercase">Bank Name</p>
                    <p className="font-medium">{BANK_DETAILS.bankName}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-bold uppercase">Account Name</p>
                    <p className="font-medium">{BANK_DETAILS.accountName}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-bold uppercase">Account Number</p>
                    <div className="flex items-center justify-between">
                      <p className="font-mono font-bold text-lg">{BANK_DETAILS.accountNumber}</p>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyToClipboard(BANK_DETAILS.accountNumber, "Account")}>
                        {copiedField === "Account" ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-bold uppercase">SWIFT/BIC</p>
                    <p className="font-medium">{BANK_DETAILS.swiftCode}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center p-3 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-800 text-xs">
                <Shield className="h-4 w-4 mr-2 flex-shrink-0" />
                Ensure you include your email or product name in the transfer reference for faster processing.
              </div>
            </CardContent>
          </Card>

          <Card className="border-none ring-1 ring-border shadow-sm">
            <CardHeader>
              <div className="flex items-center space-x-2 text-accent mb-2">
                <Upload className="h-5 w-5" />
                <span className="text-sm font-bold tracking-widest uppercase">Step 2: Proof of Payment</span>
              </div>
              <CardTitle>Submit Payment Proof</CardTitle>
              <CardDescription>Upload a screenshot or PDF of your bank transfer confirmation.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div 
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${screenshot ? 'border-accent bg-accent/5' : 'border-border hover:border-primary/50'}`}
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  <Input 
                    id="file-upload"
                    type="file" 
                    className="hidden" 
                    accept="image/*,.pdf"
                    onChange={(e) => setScreenshot(e.target.files?.[0]?.name || "Proof uploaded")}
                  />
                  <div className="flex flex-col items-center space-y-2">
                    {screenshot ? (
                      <>
                        <CheckCircle2 className="h-10 w-10 text-accent" />
                        <p className="font-medium text-accent">{screenshot}</p>
                        <p className="text-xs text-muted-foreground">Click to replace file</p>
                      </>
                    ) : (
                      <>
                        <Upload className="h-10 w-10 text-muted-foreground" />
                        <p className="font-medium">Click or drag to upload payment proof</p>
                        <p className="text-xs text-muted-foreground">JPG, PNG or PDF (Max 5MB)</p>
                      </>
                    )}
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 text-lg font-bold" 
                  disabled={isSubmitting || !screenshot}
                >
                  {isSubmitting ? "Submitting Order..." : "Confirm & Submit Order"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div className="space-y-6">
          <Card className="border-none ring-1 ring-border shadow-sm sticky top-24">
            <CardHeader>
              <CardTitle className="text-lg">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="relative h-12 w-12 rounded-lg overflow-hidden border">
                  <Image src={product.imageUrl} alt={product.name} fill className="object-cover" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm leading-tight">{product.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{product.type}</p>
                </div>
              </div>
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${product.price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Service Fee</span>
                  <span>$0.00</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total Amount</span>
                  <span className="text-primary">${product.price.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col text-xs text-muted-foreground text-center">
              <p>By submitting this order, you agree to VirtuLink's Terms of Service and Privacy Policy.</p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
