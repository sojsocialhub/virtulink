'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  MessageSquare,
  ChevronLeft,
  ShoppingBag,
  Loader2,
  Info,
  CreditCard,
  Copy,
  CheckCircle2,
  ShieldCheck,
  User,
  Building2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
  useFirestore,
  useUser,
  useCollection, useDoc,
  useMemoFirebase
} from '@/firebase';
import { collection, query, addDoc, doc } from 'firebase/firestore';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ADMIN_BANK_DETAILS } from '@/lib/data';
import { usePaystackPayment } from 'react-paystack';

type PaymentMethod = 'paystack' | 'manual';

export default function SocialLogsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const db = useFirestore();
  const { user } = useUser();
  const userDocRef = useMemoFirebase(() => (db && user ? doc(db, 'users', user.uid) : null), [db, user]);
  const { data: userData } = useDoc(userDocRef);
  const walletBalance = userData?.walletBalance || 0;

  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('paystack');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [deliveredAccount, setDeliveredAccount] = useState<any>(null);

  const [formData, setFormData] = useState({
    senderName: '',
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

        sanitized[trimmedKey] =
          typeof value === 'object' && value !== null
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
    const rawPrice =
      log.price ||
      log.Price ||
      log.amount ||
      log.Amount ||
      0;

    return typeof rawPrice === 'number'
      ? rawPrice
      : parseFloat(String(rawPrice)) || 0;
  };

  const publicKey =
    process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '';

  const paystackConfig = {
    reference: `VL-SOCIAL-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`,
    email: user?.email || '',
    amount: selectedProduct
      ? getPrice(selectedProduct) * 100
      : 0,
    publicKey
  };

  const initializePayment = usePaystackPayment(paystackConfig);

  const handleOpenModal = (log: any) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Authentication required',
        description: 'Please log in to purchase.'
      });
      return;
    }

    setSelectedProduct(log);
    setPaymentMethod('paystack');
    setFormData({
      senderName: '',
      reference: ''
    });
    setIsModalOpen(true);
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);

    setTimeout(() => setCopiedField(null), 2000);

    toast({
      title: 'Copied!',
      description: `${field} copied to clipboard.`
    });
  };

  const handlePaystackPayment = async () => {
    if (!db || !user || !selectedProduct) return;

    const amount = getPrice(selectedProduct);

    if (!amount || amount <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid product price",
        description: "This product does not have a valid price."
      });
      return;
    }

    if (Number(walletBalance) < amount) {
      toast({
        variant: "destructive",
        title: "Insufficient Wallet Balance",
        description: "Please fund your wallet before purchasing this Social Log."
      });
      return;
    }

    setIsProcessing(true);

    try {
      const idToken = await user.getIdToken();
      const reference = `VL-WALLET-SOCIAL-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      const deliveryResponse = await fetch("/api/social-log/deliver", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`
        },
        body: JSON.stringify({
          productId: selectedProduct.id,
          productName: selectedProduct.name || "Social Account",
          amount,
          reference
        })
      });

      const deliveryData = await deliveryResponse.json();

      if (!deliveryResponse.ok || !deliveryData.status) {
        throw new Error(
          deliveryData.message || "Unable to complete the Social Log purchase."
        );
      }

      toast({
        title: "Purchase Successful! 🎉",
        description: "Your Social Log has been purchased and delivered to your account."
      });

      setDeliveredAccount(deliveryData.account);
      setIsModalOpen(false);
    } catch (error: any) {
      console.error("Social Log wallet purchase error:", error);

      toast({
        variant: "destructive",
        title: "Purchase Failed",
        description: error?.message || "Unable to complete your purchase."
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmitManualRequest = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!db || !user || !selectedProduct) return;

    if (!formData.senderName.trim() || !formData.reference.trim()) {
      toast({
        variant: 'destructive',
        title: 'Missing information',
        description: 'Please enter your sender name and transaction reference.'
      });
      return;
    }

    setIsProcessing(true);

    try {
      await addDoc(collection(db, 'purchase_requests'), {
        userId: user.uid,
        userEmail: user.email,
        productName: selectedProduct.name || 'Social Account',
        productId: selectedProduct.id,
        amount: getPrice(selectedProduct),
        paymentMethod: 'Bank Transfer',
        senderName: formData.senderName.trim(),
        reference: formData.reference.trim(),
        status: 'pending',
        date: new Date().toISOString()
      });

      toast({
        title: 'Request Submitted!',
        description:
          'Your bank transfer is being verified. You will be notified once approved.'
      });

      setIsModalOpen(false);
      setIsProcessing(false);
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: error.message
      });

      setIsProcessing(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <Link
        href="/dashboard"
        className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-6"
      >
        <ChevronLeft className="mr-1 h-4 w-4" />
        Back to Dashboard
      </Link>

      <header className="mb-8">
        <h1 className="text-4xl font-black font-headline text-primary">
          Social Media Logs
        </h1>
        <p className="text-muted-foreground">
          Premium accounts with secure Paystack or manual bank-transfer payment.
        </p>
      </header>

      {deliveredAccount && (
        <Card className="mb-8 border-2 border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-2xl font-black text-green-700">
              🎉 Purchase Successful
            </CardTitle>
            <CardDescription>
              Your Social Log has been delivered successfully.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Category</Label>
              <div className="mt-1 rounded-lg border bg-white p-3 font-bold">
                {deliveredAccount.extraDetails || "Social Account"}
              </div>
            </div>
            <div>
              <Label>E-mail</Label>
              <div className="mt-1 flex items-center justify-between gap-2 rounded-lg border bg-white p-3">
                <span className="break-all">{deliveredAccount.email || "N/A"}</span>
                {deliveredAccount.email && (
                  <Button type="button" variant="outline" size="sm" onClick={() => copyToClipboard(deliveredAccount.email, "E-mail")}>
                    <Copy className="mr-1 h-4 w-4" />
                    Copy
                  </Button>
                )}
              </div>
            </div>
            <div>
              <Label>Account</Label>
              <div className="mt-1 flex items-center justify-between gap-2 rounded-lg border bg-white p-3">
                <span className="break-all">{deliveredAccount.username || "N/A"}</span>
                {deliveredAccount.username && (
                  <Button type="button" variant="outline" size="sm" onClick={() => copyToClipboard(deliveredAccount.username, "Account")}>
                    <Copy className="mr-1 h-4 w-4" />
                    Copy
                  </Button>
                )}
              </div>
            </div>
            <div>
              <Label>Password</Label>
              <div className="mt-1 flex items-center justify-between gap-2 rounded-lg border bg-white p-3">
                <span className="break-all">{deliveredAccount.password || "N/A"}</span>
                {deliveredAccount.password && (
                  <Button type="button" variant="outline" size="sm" onClick={() => copyToClipboard(deliveredAccount.password, "Password")}>
                    <Copy className="mr-1 h-4 w-4" />
                    Copy
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {loadingLogs ? (
        <div className="flex justify-center p-20">
          <Loader2 className="animate-spin h-12 w-12 text-primary" />
        </div>
      ) : logs && logs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {logs.map((log: any) => {
            const price = getPrice(log);
            const name = log.name || 'Untitled Account';

            const image = log.imageUrl?.startsWith('http')
              ? log.imageUrl
              : `https://picsum.photos/seed/${log.id}/600/400`;

            return (
              <Card
                key={log.id}
                className="overflow-hidden border-none ring-1 ring-border group hover:shadow-2xl transition-all flex flex-col h-full bg-white rounded-2xl"
              >
                <div className="relative aspect-video bg-muted">
                  <Image
                    src={image}
                    alt={name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />

                  <div className="absolute top-4 right-4">
                    <Badge className="bg-white text-primary font-black text-lg px-4 py-1 shadow-xl border-none">
                      ₦{price.toLocaleString()}
                    </Badge>
                  </div>
                </div>

                <CardHeader className="pb-2">
                  <CardTitle className="text-xl font-bold">
                    {name}
                  </CardTitle>

                  <CardDescription className="text-sm line-clamp-2">
                    {log.description || 'Premium aged social account.'}
                  </CardDescription>
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
          <h3 className="text-xl font-black mb-2">
            No Accounts Available
          </h3>
          <p className="text-muted-foreground">
            Please check back later or contact support.
          </p>
        </div>
      )}

      <Dialog
        open={isModalOpen}
        onOpenChange={(open) => {
          if (!isProcessing) setIsModalOpen(open);
        }}
      >
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">
              Choose Payment Method
            </DialogTitle>

            <DialogDescription>
              Select how you want to pay for this Social Log.
            </DialogDescription>
          </DialogHeader>

          {selectedProduct && (
            <div className="space-y-6 pt-4">
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase text-muted-foreground">
                    Product
                  </span>

                  <span className="text-sm font-black text-primary">
                    {selectedProduct.name}
                  </span>
                </div>

                <div className="mt-4 flex justify-between items-center">
                  <span className="text-xs font-bold uppercase text-muted-foreground">
                    Amount
                  </span>

                  <span className="text-xl font-black text-primary">
                    ₦{getPrice(selectedProduct).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="h-6 w-6 text-primary flex-shrink-0" />

                  <div>
                    <h3 className="font-black text-primary">
                      Pay with VirtuLink Wallet
                    </h3>

                    <p className="text-sm text-muted-foreground mt-1">
                      Your VirtuLink wallet will be securely debited for this purchase.
                    </p>
                  </div>
                </div>

                <div className="rounded-xl bg-white border p-4 flex justify-between items-center">
                  <span className="text-sm font-bold text-muted-foreground">
                    Available Balance
                  </span>

                  <span className="font-black text-green-600">
                    ₦{Number(walletBalance).toLocaleString()}
                  </span>
                </div>

                <Button
                  type="button"
                  className="w-full h-14 font-black text-lg rounded-xl"
                  onClick={handlePaystackPayment}
                  disabled={
                    isProcessing ||
                    Number(walletBalance) < getPrice(selectedProduct)
                  }
                >
                  {isProcessing ? (
                    <Loader2 className="animate-spin mr-2 h-5 w-5" />
                  ) : (
                    <ShoppingBag className="mr-2 h-5 w-5" />
                  )}

                  {Number(walletBalance) < getPrice(selectedProduct)
                    ? "Insufficient Wallet Balance"
                    : `Buy with Wallet — ₦${getPrice(selectedProduct).toLocaleString()}`}
                </Button>

                {Number(walletBalance) < getPrice(selectedProduct) && (
                  <p className="text-xs text-center text-destructive font-medium">
                    Please fund your VirtuLink wallet before purchasing this Social Log.
                  </p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
