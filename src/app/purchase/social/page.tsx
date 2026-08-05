'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare, ChevronLeft, ShoppingBag, Loader2, Info, CreditCard, Copy, CheckCircle2, ShieldCheck, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, addDoc } from 'firebase/firestore';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ADMIN_BANK_DETAILS } from '@/lib/data';

export default function SocialLogsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const db = useFirestore();
  const { user } = useUser();
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    senderName: '',
    amountPaid: '',
    reference: ''
  });

  const logsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'Sociallogs'));
  }, [db]);

  const { data: rawLogs, loading: loadingLogs } = useCollection(logsQuery);

  const sanitizeObject = (obj: any): any => {
    if (!obj || typeof obj !== 'object' || obj instanceof Date) return obj;
    if (Array.isArray(obj)) return obj.map(item => sanitizeObject(item));

    const sanitized: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const trimmedKey = key.trim();
        const value = obj[key];
        sanitized[trimmedKey] = (typeof value === 'object' && value !== null) 
          ? sanitizeObject(value) 
          : value;
      }
    }
    return sanitized;
  };

  const logs = useMemo(() => {
    if (!rawLogs) return [];
    return rawLogs.map(log => sanitizeObject(log));
  }, [rawLogs]);

  const getPrice = (log: any) => {
    const rawPrice = log.price || log.Price || log.amount || log.Amount || 0;
    return typeof rawPrice === 'number' ? rawPrice : parseFloat(String(rawPrice)) || 0;
  };

  const handleOpenModal = (log: any) => {
    if (!user) {
      toast({ variant: "destructive", title: "Authentication required", description: "Please log in to purchase." });
      return;
    }
    setSelectedProduct(log);
    setIsModalOpen(true);
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    toast({ title: "Copied!", description: `${field} copied to clipboard.` });
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !user || !selectedProduct) return;

    setIsProcessing(true);
    try {
      await addDoc(collection(db, 'purchase_requests'), {
        userId: user.uid,
        userEmail: user.email,
        productName: selectedProduct.name || 'Social Account',
        amount: getPrice(selectedProduct),
        senderName: formData.senderName,
        reference: formData.reference,
        status: 'pending',
        date: new Date().toISOString()
      });

      toast({
        title: "Request Submitted!",
        description: "Your payment is being verified. You will be notified once approved."
      });
      setIsModalOpen(false);
      router.push('/dashboard');
    } catch (error: any) {
      toast({ variant: "destructive", title: "Submission Failed", description: error.message });
      setIsProcessing(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <Link href="/dashboard" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-6">
        <ChevronLeft className="mr-1 h-4 w-4" /> Back to Dashboard
      </Link>

      <header className="mb-8">
        <h1 className="text-4xl font-black font-headline text-primary">Social Media Logs</h1>
        <p className="text-muted-foreground">Premium aged accounts with manual bank transfer payment.</p>
      </header>

      {loadingLogs ? (
        <div className="flex justify-center p-20"><Loader2 className="animate-spin h-12 w-12 text-primary" /></div>
      ) : logs && logs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {logs.map((log: any) => {
            const price = getPrice(log);
            const name = log.name || 'Untitled Account';
            const image = log.imageUrl?.startsWith('http') ? log.imageUrl : `https://picsum.photos/seed/${log.id}/600/400`;

            return (
              <Card key={log.id} className="overflow-hidden border-none ring-1 ring-border group hover:shadow-2xl transition-all flex flex-col h-full bg-white rounded-2xl">
                <div className="relative aspect-video bg-muted">
                  <Image src={image} alt={name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-white text-primary font-black text-lg px-4 py-1 shadow-xl border-none">
                      ₦{price.toLocaleString()}
                    </Badge>
                  </div>
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl font-bold">{name}</CardTitle>
                  <CardDescription className="text-sm line-clamp-2">{log.description || 'Premium aged social account.'}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-4 mt-auto">
                  <Button 
                    onClick={() => handleOpenModal(log)}
                    className="w-full font-black h-14 text-lg rounded-xl shadow-lg"
                  >
                    <ShoppingBag className="h-5 w-5 mr-2" />
                    Buy Account
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-card rounded-3xl border-2 border-dashed border-primary/10">
          <Info className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-20" />
          <h3 className="text-xl font-black mb-2">No Accounts Available</h3>
          <p className="text-muted-foreground">Please check back later or contact support.</p>
        </div>
      )}

      {/* Payment Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Bank Transfer Payment</DialogTitle>
            <DialogDescription>Please pay the exact amount to the account below and submit proof.</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 pt-4">
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase text-muted-foreground">Amount to Pay</span>
                <span className="text-xl font-black text-primary">₦{selectedProduct ? getPrice(selectedProduct).toLocaleString() : '0'}</span>
              </div>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground">Bank Name</Label>
                  <div className="flex justify-between items-center bg-white p-2 rounded-lg border">
                    <span className="text-sm font-bold">{ADMIN_BANK_DETAILS.bankName}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(ADMIN_BANK_DETAILS.bankName, "Bank")}>
                       {copiedField === "Bank" ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground">Account Number</Label>
                  <div className="flex justify-between items-center bg-white p-2 rounded-lg border">
                    <span className="text-lg font-black font-mono">{ADMIN_BANK_DETAILS.accountNumber}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(ADMIN_BANK_DETAILS.accountNumber, "Account")}>
                       {copiedField === "Account" ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground">Account Name</Label>
                  <div className="text-sm font-bold bg-white p-2 rounded-lg border">{ADMIN_BANK_DETAILS.accountName}</div>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmitRequest} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="senderName">Sender Name (Your Full Name)</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="senderName" 
                    placeholder="Enter name used for transfer" 
                    className="pl-10"
                    required
                    value={formData.senderName}
                    onChange={e => setFormData(prev => ({ ...prev, senderName: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reference">Transaction Reference / Remark</Label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="reference" 
                    placeholder="Reference number or description" 
                    className="pl-10"
                    required
                    value={formData.reference}
                    onChange={e => setFormData(prev => ({ ...prev, reference: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex items-start gap-2 text-[10px] text-muted-foreground bg-yellow-50 p-2 rounded-lg border border-yellow-200">
                <ShieldCheck className="h-4 w-4 text-yellow-600 flex-shrink-0" />
                <span>Verification typically takes 15-60 minutes. Providing a clear sender name and reference speeds up the process.</span>
              </div>
              <Button type="submit" className="w-full h-12 font-black" disabled={isProcessing}>
                {isProcessing ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                Confirm Payment & Submit
              </Button>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
