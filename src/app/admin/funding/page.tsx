
"use client";

import { useState } from 'react';
import { 
  ArrowLeft, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  Wallet,
  Calendar,
  User as UserIcon,
  CreditCard,
  AlertCircle
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { useFirestore, useCollection, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { 
  collection, 
  query, 
  orderBy, 
  doc, 
  runTransaction, 
  serverTimestamp,
  where
} from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { WalletFundingRequest } from '@/lib/types';
import Link from 'next/link';

export default function WalletFundingRequestsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const userDocRef = useMemoFirebase(() => (db && user ? doc(db, 'users', user.uid) : null), [db, user]);
  const { data: userData, loading: loadingProfile } = useDoc(userDocRef);
  const isAdmin = userData?.role === 'admin';

  const requestsQuery = useMemoFirebase(() => {
    if (!db || !isAdmin) return null;
    return query(
      collection(db, 'wallet_funding_requests'), 
      where('status', '==', 'pending'),
      orderBy('timestamp', 'desc')
    );
  }, [db, isAdmin]);

  const { data: requests, loading: loadingRequests } = useCollection<WalletFundingRequest>(requestsQuery);

  const filteredRequests = (requests || []).filter(req => 
    req.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.senderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.reference.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleProcessRequest = async (requestId: string, status: 'approved' | 'rejected') => {
    if (!db || !isAdmin) return;
    
    setProcessingId(requestId);
    const requestData = requests?.find(r => r.id === requestId);
    if (!requestData) return;

    try {
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, 'users', requestData.userId);
        const requestRef = doc(db, 'wallet_funding_requests', requestId);
        
        const userSnap = await transaction.get(userRef);
        if (!userSnap.exists()) throw new Error("User record no longer exists");

        // 1. Update the funding request status
        transaction.update(requestRef, { 
          status: status,
          processedAt: serverTimestamp(),
          processedBy: user?.email
        });

        if (status === 'approved') {
          // 2. Atomically increment the user's wallet balance
          const currentBalance = userSnap.data().walletBalance || 0;
          transaction.update(userRef, { 
            walletBalance: currentBalance + requestData.amount 
          });

          // 3. Create a record in the global transactions collection
          const newTxRef = doc(collection(db, 'transactions'));
          transaction.set(newTxRef, {
            userId: requestData.userId,
            type: 'funding',
            amount: requestData.amount,
            status: 'Completed',
            service: 'Manual Wallet Funding',
            date: new Date().toISOString(),
            reference: requestData.reference,
            requestId: requestId,
            createdAt: serverTimestamp()
          });
        }
      });

      toast({ 
        title: `Request ${status === 'approved' ? 'Approved' : 'Rejected'}`,
        description: status === 'approved' ? `Wallet credited with ₦${requestData.amount.toLocaleString()}` : "The request was declined."
      });
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "Action Failed", 
        description: error.message || "Could not process request." 
      });
    } finally {
      setProcessingId(null);
    }
  };

  if (loadingProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground font-bold">Verifying Admin Access...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-20 text-center space-y-4">
        <AlertCircle className="h-16 w-16 text-destructive mx-auto" />
        <h2 className="text-3xl font-black">Unauthorized Access</h2>
        <p className="text-muted-foreground">This area is reserved for administrators.</p>
        <Link href="/dashboard"><Button>Back to Dashboard</Button></Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <Link href="/admin" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-2">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to Admin Hub
          </Link>
          <h1 className="text-4xl font-black font-headline text-primary tracking-tight">Wallet Funding Requests</h1>
          <p className="text-muted-foreground">Verify bank transfers and credit user wallets instantly.</p>
        </div>
      </div>

      <Card className="border-none shadow-xl ring-1 ring-border">
        <CardHeader className="border-b bg-muted/20">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search by email, name or reference..." 
                className="pl-10 h-10 bg-background"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 text-sm font-bold text-primary">
              <Clock className="h-4 w-4" />
              <span>{filteredRequests.length} Pending Requests</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/10">
                  <TableHead>Customer Details</TableHead>
                  <TableHead>Payment Info</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Submission Date</TableHead>
                  <TableHead className="text-right">Process</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingRequests ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-20"><Loader2 className="animate-spin h-10 w-10 mx-auto text-primary" /></TableCell></TableRow>
                ) : filteredRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-20 text-muted-foreground">
                      <div className="space-y-2">
                        <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto opacity-20" />
                        <p className="font-bold">Queue is clear! No pending requests.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredRequests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm">{req.senderName}</span>
                        <span className="text-xs text-muted-foreground">{req.userEmail}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge variant="outline" className="text-[10px] font-mono bg-muted">REF: {req.reference}</Badge>
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <CreditCard className="h-3 w-3" /> {req.paymentMethod}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="font-black text-primary text-lg">₦{req.amount.toLocaleString()}</TableCell>
                    <TableCell className="text-[11px] text-muted-foreground">
                      <div className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(req.timestamp).toLocaleString()}</div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-9 px-3 text-destructive hover:bg-destructive/10"
                          disabled={!!processingId}
                          onClick={() => handleProcessRequest(req.id, 'rejected')}
                        >
                          {processingId === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4 mr-1.5" />}
                          Reject
                        </Button>
                        <Button 
                          size="sm" 
                          className="h-9 px-4 font-bold shadow-lg"
                          disabled={!!processingId}
                          onClick={() => handleProcessRequest(req.id, 'approved')}
                        >
                          {processingId === req.id ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <CheckCircle2 className="h-4 w-4 mr-1.5" />}
                          Approve
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
