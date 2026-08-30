'use client';

import { useMemo, useState } from 'react';
import {
  History,
  Smartphone,
  PlusCircle,
  ArrowLeft,
  Loader2,
  Search,
  Filter,
  Copy,
  Eye,
  CheckCircle2
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
  useFirestore,
  useUser,
  useCollection,
  useMemoFirebase
} from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function TransactionsPage() {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const [selectedPurchase, setSelectedPurchase] = useState<any>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const transactionsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;

    return query(
      collection(db, 'transactions'),
      where('userId', '==', user.uid),
      orderBy('date', 'desc')
    );
  }, [db, user]);

  const purchaseRequestsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;

    return query(
      collection(db, 'purchase_requests'),
      where('userId', '==', user.uid)
    );
  }, [db, user]);

  const { data: transactions, loading: txLoading } =
    useCollection(transactionsQuery);

  const { data: purchaseRequests, loading: purchasesLoading } =
    useCollection(purchaseRequestsQuery);

  const loading = txLoading || purchasesLoading;

  const deliveredPurchases = useMemo(() => {
    if (!purchaseRequests) return [];

    return purchaseRequests.filter(
      (purchase: any) =>
        purchase.status === 'delivered' &&
        purchase.account
    );
  }, [purchaseRequests]);

  const getPurchaseForTransaction = (tx: any) => {
    if (!deliveredPurchases.length) return null;

    return (
      deliveredPurchases.find(
        (purchase: any) =>
          purchase.purchaseId === tx.purchaseId ||
          purchase.reference === tx.reference
      ) || null
    );
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);

      setTimeout(() => setCopiedField(null), 2000);

      toast({
        title: 'Copied!',
        description: `${field} copied to clipboard.`
      });
    } catch {
      toast({
        variant: 'destructive',
        title: 'Copy failed',
        description: 'Unable to copy this information.'
      });
    }
  };

  const formatTransactionDate = (dateValue: any) => {
    if (!dateValue) return 'N/A';

    try {
      let date: Date;

      if (
        typeof dateValue === 'object' &&
        typeof dateValue.toDate === 'function'
      ) {
        date = dateValue.toDate();
      } else {
        date = new Date(dateValue);
      }

      if (Number.isNaN(date.getTime())) {
        return 'N/A';
      }

      return date.toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short'
      });
    } catch {
      return 'N/A';
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-2"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Dashboard
          </Link>

          <h1 className="text-3xl font-black font-headline tracking-tight text-primary">
            Transaction History
          </h1>

          <p className="text-muted-foreground">
            View your wallet funding, purchases, and delivered products.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="font-bold"
          >
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
        </div>
      </div>

      <Card className="border-none ring-1 ring-border shadow-sm overflow-hidden bg-card">
        <div className="p-4 border-b bg-muted/30">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
              className="pl-10 h-10 bg-background"
            />
          </div>
        </div>

        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-20 gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-muted-foreground font-medium">
                Fetching your records...
              </p>
            </div>
          ) : transactions && transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b text-left">
                    <th className="px-6 py-4 font-black uppercase tracking-wider text-[10px] text-muted-foreground">
                      Type
                    </th>

                    <th className="px-6 py-4 font-black uppercase tracking-wider text-[10px] text-muted-foreground">
                      Details
                    </th>

                    <th className="px-6 py-4 font-black uppercase tracking-wider text-[10px] text-muted-foreground">
                      Amount
                    </th>

                    <th className="px-6 py-4 font-black uppercase tracking-wider text-[10px] text-muted-foreground">
                      Date
                    </th>

                    <th className="px-6 py-4 font-black uppercase tracking-wider text-[10px] text-muted-foreground">
                      Status
                    </th>

                    <th className="px-6 py-4 font-black uppercase tracking-wider text-[10px] text-muted-foreground text-right">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-border">
                  {transactions.map((tx: any) => {
                    const purchase = getPurchaseForTransaction(tx);
                    const isSocialLog = tx.type === 'social_log';

                    return (
                      <tr
                        key={tx.id}
                        className="hover:bg-muted/20 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`p-2 rounded-lg ${
                                tx.type === 'funding'
                                  ? 'bg-green-100 text-green-600'
                                  : 'bg-primary/10 text-primary'
                              }`}
                            >
                              {tx.type === 'funding' ? (
                                <PlusCircle className="h-4 w-4" />
                              ) : (
                                <Smartphone className="h-4 w-4" />
                              )}
                            </div>

                            <span className="font-bold capitalize">
                              {String(tx.type || 'transaction').replace(
                                '_',
                                ' '
                              )}
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-muted-foreground">
                          <div className="font-semibold text-foreground">
                            {tx.productName ||
                              tx.service ||
                              tx.network ||
                              'Wallet Funding'}
                          </div>

                          {tx.reference && (
                            <div className="text-[10px] mt-1 break-all">
                              Ref: {tx.reference}
                            </div>
                          )}

                          {tx.phoneNumber && (
                            <div className="text-xs mt-1">
                              {tx.phoneNumber}
                            </div>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`font-bold ${
                              tx.type === 'funding'
                                ? 'text-green-600'
                                : 'text-foreground'
                            }`}
                          >
                            {tx.type === 'funding' ? '+' : '-'}₦
                            {Number(tx.amount || 0).toLocaleString()}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-muted-foreground text-xs">
                          {formatTransactionDate(tx.date)}
                        </td>

                        <td className="px-6 py-4">
                          <Badge
                            variant="secondary"
                            className={
                              tx.status === 'Completed'
                                ? 'bg-green-50 text-green-700'
                                : 'bg-yellow-50 text-yellow-700'
                            }
                          >
                            {tx.status || 'Pending'}
                          </Badge>
                        </td>

                        <td className="px-6 py-4 text-right">
                          {isSocialLog && purchase ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="font-bold"
                              onClick={() =>
                                setSelectedPurchase(purchase)
                              }
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              —
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-20 gap-4 text-center">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                <History className="h-8 w-8 text-muted-foreground" />
              </div>

              <div>
                <h3 className="text-lg font-bold">
                  No transactions found
                </h3>

                <p className="text-muted-foreground max-w-xs mx-auto">
                  You haven't made any purchases or funded your wallet yet.
                </p>
              </div>

              <Link href="/dashboard">
                <Button
                  variant="outline"
                  className="font-bold"
                >
                  Return to Dashboard
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={!!selectedPurchase}
        onOpenChange={(open) => {
          if (!open) setSelectedPurchase(null);
        }}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-primary">
              Social Log Details
            </DialogTitle>

            <DialogDescription>
              Your purchased account is saved here so you can return to it
              later.
            </DialogDescription>
          </DialogHeader>

          {selectedPurchase && (
            <div className="space-y-5">
              <div className="rounded-2xl border bg-primary/5 p-4">
                <div className="flex items-center gap-2 text-green-700 font-bold">
                  <CheckCircle2 className="h-5 w-5" />
                  Purchase Completed
                </div>

                <div className="mt-3 space-y-1 text-sm">
                  <p>
                    <span className="font-bold">Product:</span>{' '}
                    {selectedPurchase.productName || 'Social Account'}
                  </p>

                  <p>
                    <span className="font-bold">Amount:</span> ₦
                    {Number(selectedPurchase.amount || 0).toLocaleString()}
                  </p>

                  <p className="break-all">
                    <span className="font-bold">Reference:</span>{' '}
                    {selectedPurchase.reference || 'N/A'}
                  </p>

                  <p>
                    <span className="font-bold">Date:</span>{' '}
                    {selectedPurchase.date
                      ? new Date(
                          selectedPurchase.date
                        ).toLocaleString()
                      : 'N/A'}
                  </p>
                </div>
              </div>

              <div>
                <Label>Category / Details</Label>
                <div className="mt-1 rounded-lg border bg-muted/30 p-3 break-words">
                  {selectedPurchase.account?.extraDetails ||
                    'Social Account'}
                </div>
              </div>

              <div>
                <Label>E-mail</Label>
                <div className="mt-1 flex items-center justify-between gap-2 rounded-lg border bg-background p-3">
                  <span className="break-all">
                    {selectedPurchase.account?.email || 'N/A'}
                  </span>

                  {selectedPurchase.account?.email && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(
                          selectedPurchase.account.email,
                          'E-mail'
                        )
                      }
                    >
                      {copiedField === 'E-mail' ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              </div>

              <div>
                <Label>Account / Username</Label>
                <div className="mt-1 flex items-center justify-between gap-2 rounded-lg border bg-background p-3">
                  <span className="break-all">
                    {selectedPurchase.account?.username || 'N/A'}
                  </span>

                  {selectedPurchase.account?.username && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(
                          selectedPurchase.account.username,
                          'Account'
                        )
                      }
                    >
                      {copiedField === 'Account' ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              </div>

              <div>
                <Label>Password</Label>
                <div className="mt-1 flex items-center justify-between gap-2 rounded-lg border bg-background p-3">
                  <span className="break-all">
                    {selectedPurchase.account?.password || 'N/A'}
                  </span>

                  {selectedPurchase.account?.password && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(
                          selectedPurchase.account.password,
                          'Password'
                        )
                      }
                    >
                      {copiedField === 'Password' ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
