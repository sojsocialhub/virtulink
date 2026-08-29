'use client';

import { useMemo, useState } from 'react';
import { collection, query, where, doc } from 'firebase/firestore';
import {
  useFirestore,
  useUser,
  useCollection,
  useDoc,
  useMemoFirebase
} from '@/firebase';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function BoostShopPage() {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [targetLink, setTargetLink] = useState('');
  const [quantity, setQuantity] = useState('');
  const [comments, setComments] = useState('');
  const [buying, setBuying] = useState(false);

  const userDocRef = useMemoFirebase(
    () => (db && user ? doc(db, 'users', user.uid) : null),
    [db, user]
  );

  const { data: userData } = useDoc(userDocRef);

  const servicesQuery = useMemoFirebase(() => {
    if (!db) return null;

    return query(
      collection(db, 'social_services'),
      where('category', '==', 'boost')
    );
  }, [db]);

  const { data: services, loading } = useCollection(servicesQuery);

  const selectedService = useMemo(() => {
    return services?.find((service: any) => service.id === selectedServiceId);
  }, [services, selectedServiceId]);

  const baseQuantity = Number(selectedService?.quantity || 0);

  const basePrice = Number(
    selectedService?.sellingPrice ??
    selectedService?.sellingprice ??
    0
  );

  const requestedQuantity = Number(quantity || 0);

  const calculatedPrice =
    selectedService && baseQuantity > 0 && requestedQuantity > 0
      ? (basePrice / baseQuantity) * requestedQuantity
      : 0;

  const selectService = (serviceId: string) => {
    setSelectedServiceId(serviceId);

    const service = services?.find(
      (item: any) => item.id === serviceId
    );

    if (service) {
      setQuantity(String(service.quantity || ''));
    }
  };

  const quickFill = (platform: string) => {
    const links: Record<string, string> = {
      Instagram: 'https://instagram.com/',
      TikTok: 'https://tiktok.com/@',
      Facebook: 'https://facebook.com/',
      YouTube: 'https://youtube.com/',
      X: 'https://x.com/'
    };

    setTargetLink(links[platform] || '');
  };

  const buyBoost = async () => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Login required',
        description: 'Please login before placing an order.'
      });
      return;
    }

    if (!selectedService) {
      toast({
        variant: 'destructive',
        title: 'Select a service',
        description: 'Please select a BOOST service.'
      });
      return;
    }

    if (!targetLink.trim()) {
      toast({
        variant: 'destructive',
        title: 'Target link required',
        description: 'Enter the public profile or post link.'
      });
      return;
    }

    if (requestedQuantity <= 0) {
      toast({
        variant: 'destructive',
        title: 'Invalid quantity',
        description: 'Enter a valid quantity.'
      });
      return;
    }

    if (Number(userData?.walletBalance || 0) < calculatedPrice) {
      toast({
        variant: 'destructive',
        title: 'Insufficient Wallet Balance',
        description: 'Please fund your wallet.'
      });
      return;
    }

    setBuying(true);

    try {
      const idToken = await user.getIdToken();

      const response = await fetch('/api/boost/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`
        },
        body: JSON.stringify({
          serviceId: selectedService.id,
          targetLink: targetLink.trim(),
          quantity: requestedQuantity,
          comments: comments.trim(),
          reference: `VL-BOOST-${Date.now()}`
        })
      });

      const data = await response.json();

      if (!response.ok || !data.status) {
        throw new Error(data.message || 'BOOST order failed.');
      }

      toast({
        title: 'Order Successful 🚀',
        description: 'Your BOOST order has been submitted.'
      });

      setSelectedServiceId('');
      setTargetLink('');
      setQuantity('');
      setComments('');

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Order Failed',
        description: error.message
      });
    }

    setBuying(false);
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">

      <div>
        <p className="text-sm text-muted-foreground">
          Grow your social media presence
        </p>

        <h1 className="text-3xl font-black">
          Social BOOST 🚀
        </h1>
      </div>

      <Card>
        <CardContent className="p-5 flex justify-between items-center">
          <div>
            <p className="font-bold">Wallet Balance</p>
            <p className="text-sm text-muted-foreground">
              Available for BOOST orders
            </p>
          </div>

          <p className="text-2xl font-black">
            ₦{Number(userData?.walletBalance || 0).toLocaleString()}
          </p>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Place BOOST Order 🚀</CardTitle>
          </CardHeader>

          <CardContent className="space-y-5">

            <div className="space-y-2">
              <Label>Select a Service</Label>

              <select
                value={selectedServiceId}
                onChange={(e) => selectService(e.target.value)}
                className="w-full h-12 rounded-md border bg-background px-3"
              >
                <option value="">Select a service</option>

                {services?.map((service: any) => {
                  const price = Number(
                    service.sellingPrice ??
                    service.sellingprice ??
                    0
                  );

                  return (
                    <option key={service.id} value={service.id}>
                      {service.platform} - {service.service} ({service.quantity}) - ₦{price.toLocaleString()}
                    </option>
                  );
                })}
              </select>

              {loading && (
                <p className="text-sm text-muted-foreground">
                  Loading services...
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Target Link</Label>

              <Input
                placeholder="Paste your public profile or post link"
                value={targetLink}
                onChange={(e) => setTargetLink(e.target.value)}
              />

              <div className="flex flex-wrap gap-2 pt-2">
                {['Instagram', 'TikTok', 'Facebook', 'YouTube', 'X'].map(
                  (platform) => (
                    <Button
                      key={platform}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => quickFill(platform)}
                    >
                      {platform}
                    </Button>
                  )
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Quantity</Label>

              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="1000"
              />
            </div>

            <div className="space-y-2">
              <Label>Comments (Optional)</Label>

              <textarea
                className="w-full min-h-28 rounded-md border bg-background p-3"
                placeholder="Only needed for custom comment services..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
              />
            </div>

            <Card className="bg-muted/40">
              <CardContent className="p-4 flex justify-between items-center">
                <div>
                  <p className="font-bold">Order Total</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedService
                      ? `${selectedService.platform} ${selectedService.service}`
                      : 'Select a service to preview price'}
                  </p>
                </div>

                <p className="text-3xl font-black">
                  ₦{Math.ceil(calculatedPrice).toLocaleString()}
                </p>
              </CardContent>
            </Card>

            <Button
              onClick={buyBoost}
              disabled={buying || !selectedService}
              className="w-full h-12"
            >
              {buying ? 'Processing...' : 'Place Order 🚀'}
            </Button>

          </CardContent>
        </Card>

        <div className="space-y-6">

          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>

            <CardContent className="space-y-3 text-sm">

              <div className="flex justify-between">
                <span>Platform</span>
                <b>{selectedService?.platform || '-'}</b>
              </div>

              <div className="flex justify-between">
                <span>Service</span>
                <b>{selectedService?.service || '-'}</b>
              </div>

              <div className="flex justify-between">
                <span>Quantity</span>
                <b>{requestedQuantity || '-'}</b>
              </div>

              <div className="flex justify-between">
                <span>Delivery</span>
                <b>
                  {selectedService?.deliveryTime ??
                    selectedService?.deliverytime ??
                    '-'}
                </b>
              </div>

              <hr />

              <div className="flex justify-between text-lg">
                <b>Total</b>
                <b>₦{Math.ceil(calculatedPrice).toLocaleString()}</b>
              </div>

            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 text-sm text-muted-foreground">
              💡 Make sure your target link is public and correct before placing an order.
            </CardContent>
          </Card>

        </div>

      </div>
    </div>
  );
}
