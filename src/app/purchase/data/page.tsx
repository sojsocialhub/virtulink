'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Globe,
  ChevronLeft,
  CreditCard,
  Loader2,
  Info,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

import { useFirestore, useUser, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import Link from 'next/link';

const NETWORKS = ['MTN', 'Airtel', 'Glo', '9mobile'];

type DataPlan = {
  variationCode: string;
  name: string;
  price: number;
  fixedPrice: boolean;
};

export default function DataPage() {
  const { toast } = useToast();
  const router = useRouter();

  const db = useFirestore();
  const { user } = useUser();

  const [network, setNetwork] = useState('');
  const [plans, setPlans] = useState<DataPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<DataPlan | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');

  const [loadingPlans, setLoadingPlans] = useState(false);
  const [loading, setLoading] = useState(false);

  const userDocRef = useMemo(
    () => (db && user ? doc(db, 'users', user.uid) : null),
    [db, user]
  );

  const { data: userData } = useDoc(userDocRef);

  const walletBalance = Number(userData?.walletBalance || 0);

  useEffect(() => {
    if (!network) {
      setPlans([]);
      setSelectedPlan(null);
      return;
    }

    let cancelled = false;

    const loadPlans = async () => {
      setLoadingPlans(true);
      setPlans([]);
      setSelectedPlan(null);

      try {
        const response = await fetch(
          `/api/data/plans?network=${encodeURIComponent(network)}`,
          { cache: 'no-store' }
        );

        const data = await response.json();

        if (!response.ok || !data.status) {
          throw new Error(data.message || 'Unable to load data plans.');
        }

        if (!cancelled) {
          setPlans(Array.isArray(data.plans) ? data.plans : []);
        }
      } catch (error: any) {
        if (!cancelled) {
          setPlans([]);

          toast({
            variant: 'destructive',
            title: 'Unable to Load Plans',
            description:
              error?.message || 'Please try again.',
          });
        }
      } finally {
        if (!cancelled) {
          setLoadingPlans(false);
        }
      }
    };

    loadPlans();

    return () => {
      cancelled = true;
    };
  }, [network, toast]);

  const handlePurchase = async () => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Login Required',
        description: 'Please login before purchasing data.',
      });
      return;
    }

    if (!network || !selectedPlan || !phoneNumber) {
      toast({
        variant: 'destructive',
        title: 'Incomplete Details',
        description:
          'Please select a network, data plan and enter the recipient phone number.',
      });
      return;
    }

    if (!/^0\d{10}$/.test(phoneNumber)) {
      toast({
        variant: 'destructive',
        title: 'Invalid Phone Number',
        description:
          'Enter a valid Nigerian phone number, e.g. 08012345678.',
      });
      return;
    }

    if (selectedPlan.price > walletBalance) {
      toast({
        variant: 'destructive',
        title: 'Insufficient Balance',
        description:
          `You need ₦${selectedPlan.price.toLocaleString()} but your wallet has ₦${walletBalance.toLocaleString()}.`,
      });
      return;
    }

    setLoading(true);

    try {
      const idToken = await user.getIdToken();

      const response = await fetch('/api/data/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          network,
          variationCode: selectedPlan.variationCode,
          phoneNumber,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.status) {
        throw new Error(
          data.message || 'Data purchase failed.'
        );
      }

      toast({
        title: 'Purchase Successful! 🎉',
        description:
          data.message || 'Data bundle purchased successfully.',
      });

      router.push('/dashboard');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Purchase Failed',
        description:
          error?.message || 'Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Link
        href="/dashboard"
        className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-6"
      >
        <ChevronLeft className="mr-1 h-4 w-4" />
        Back to Dashboard
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-sm ring-1 ring-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                Buy Data Bundle
              </CardTitle>

              <CardDescription>
                Select a network, choose a data plan and enter the recipient's phone number.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">

              <div className="space-y-3">
                <Label>1. Select Network</Label>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {NETWORKS.map((item) => (
                    <Button
                      key={item}
                      type="button"
                      variant={network === item ? 'default' : 'outline'}
                      className="h-12 font-bold"
                      onClick={() => setNetwork(item)}
                    >
                      {item}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <Label>2. Choose Data Plan</Label>

                {!network ? (
                  <div className="text-center py-8 bg-muted/50 rounded-xl border border-dashed">
                    <Info className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Select a network first.
                    </p>
                  </div>
                ) : loadingPlans ? (
                  <div className="flex justify-center p-8">
                    <Loader2 className="animate-spin text-primary" />
                  </div>
                ) : plans.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {plans.map((plan) => (
                      <button
                        type="button"
                        key={plan.variationCode}
                        onClick={() => setSelectedPlan(plan)}
                        className={`text-left p-4 rounded-xl border transition-all hover:border-primary ${
                          selectedPlan?.variationCode === plan.variationCode
                            ? 'bg-primary/5 border-primary ring-1 ring-primary'
                            : 'bg-card border-border'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <Badge
                            variant="outline"
                            className="text-[10px] font-bold"
                          >
                            {network}
                          </Badge>

                          <span className="font-bold text-primary">
                            ₦{plan.price.toLocaleString()}
                          </span>
                        </div>

                        <p className="text-sm font-bold">
                          {plan.name}
                        </p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-muted/50 rounded-xl border border-dashed">
                    <Info className="h-8 w-8 mx-auto text-muted-foreground mb-2" />

                    <p className="text-sm text-muted-foreground">
                      No data plans available for {network} right now.
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>3. Recipient Phone Number</Label>

                <Input
                  type="tel"
                  placeholder="08012345678"
                  className="h-12"
                  value={phoneNumber}
                  onChange={(e) =>
                    setPhoneNumber(e.target.value)
                  }
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-sm ring-1 ring-border sticky top-24">
            <CardHeader>
              <CardTitle className="text-lg">
                Checkout
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Balance
                </span>

                <span className="font-bold">
                  ₦{walletBalance.toLocaleString()}
                </span>
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Network
                  </span>

                  <span className="font-bold">
                    {network || '-'}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Plan
                  </span>

                  <span className="font-bold text-right truncate max-w-[150px]">
                    {selectedPlan?.name || '-'}
                  </span>
                </div>

                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total</span>

                  <span className="text-primary">
                    ₦{selectedPlan?.price.toLocaleString() || '0'}
                  </span>
                </div>
              </div>

              <Button
                onClick={handlePurchase}
                className="w-full h-12 font-bold mt-4"
                disabled={
                  loading ||
                  !selectedPlan ||
                  !phoneNumber ||
                  !network
                }
              >
                {loading ? (
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                ) : (
                  <CreditCard className="h-4 w-4 mr-2" />
                )}

                Confirm Purchase
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
