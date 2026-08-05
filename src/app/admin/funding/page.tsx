
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
  CreditCard
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
import { WalletFundingRequest, WalletFundingRequestStatus } from '@/lib/types';
import Link from 'next/link';

export default function WalletFundingRequestsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const userDocRef = useMemoFirebase(() => (db && user ? doc(db, 'users', user.uid) : null), [db, user]);
  const { data: userData } = useDoc(userDocRef);
  const isAdmin = userData?.role === 'admin';

  const requestsQuery = useMemoFirebase(() => {
    if (!db || !isAdmin) return null;
    return query(collection(db, 'wallet_funding_requests'), orderBy('timestamp', 'desc'));
  }, [db, isAdmin]);

  const { data: requests, loading } = useCollection<WalletFundingRequest>(requestsQuery);

  const filteredRequests = (requests || []).filter(req => 
    req.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.senderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.reference.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleProcessRequest = async (requestId: string, status: 'approved' | 'rejected') => {
    if (!db || !isAdmin) return;
    
    setProcessingId(requestId);
    try {
      const requestRef = doc(db, 'wallet_funding_requests', requestId);
      const requestData = requests?.find(r => r.id === requestId);
      
      if (!requestData) throw new Error("Request not found");
      if (requestData.status !== 'pending') throw new Error("Request already processed");

      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, 'users', requestData.userId);
        const userSnap = await transaction.get(userRef);
        
        if (!userSnap.exists()) throw new Error("User does not exist");

        // 1. Update Request Status
        transaction.update(requestRef, { 
          status: status,
          processedAt: serverTimestamp(),
          processedBy: user?.email
        });

        if (status === 'approved') {
          // 2. Increment Wallet Balance
          transaction.update(userRef, { 
            walletBalance: (userSnap.data().walletBalance || 0) + requestData.amount 
          });

          // 3. Create Transaction Record
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
        description: status === 'approved' ? `User credited with ₦${requestData.amount.toLocaleString()}` : "No changes made to wallet."
      });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Action Failed", description: error.message });
    } finally {
      setProcessingId(null);
    }
  };

  if (!isAdmin && !loading) {
    return (
      <div className="p-20 text-center">
        <h2 className="text-2xl font-bold text-destructive">Unauthorized Access</h2>
        <Link href="/dashboard"><Button className="mt-4">Back to Dashboard</Button></Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <Link href="/admin" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-2">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to Admin
          </Link>
          <h1 className="text-4xl font-black font-headline text-primary tracking-tight">Wallet Funding Requests</h1>
          <p className="text-muted-foreground">Verify manual bank transfers and credit user wallets atomically.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="bg-primary/5 border-primary/10">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-lg"><Clock className="h-5 w-5 text-primary" /></div>
              <div>
                <p className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Pending</p>
                <p className="text-2xl font-black">{requests?.filter(r => r.status === 'pending').length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-100">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-200 rounded-lg"><CheckCircle2 className="h-5 w-5 text-green-600" /></div>
              <div>
                <p className="text-xs font-bold uppercase text-green-600/60 tracking-widest">Approved</p>
                <p className="text-2xl font-black text-green-700">{requests?.filter(r => r.status === 'approved').length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-xl ring-1 ring-border">
        <CardHeader className="border-b bg-muted/30">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by email, name or reference..." 
              className="pl-10 h-10 bg-background"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/20">
                  <TableHead>User / Email</TableHead>
                  <TableHead>Payment Proof</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-20"><Loader2 className="animate-spin h-10 w-10 mx-auto text-primary" /></TableCell></TableRow>
                ) : filteredRequests.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-20 text-muted-foreground">No matching requests found.</TableCell></TableRow>
                ) : filteredRequests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm">{req.senderName}</span>
                        <span className="text-xs text-muted-foreground">{req.userEmail}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-[11px] space-y-1">
                        <p className="font-mono bg-muted p-1 rounded inline-block">Ref: {req.reference}</p>
                        <p className="text-muted-foreground flex items-center gap-1"><CreditCard className="h-3 w-3" /> {req.paymentMethod}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-black text-primary">₦{req.amount.toLocaleString()}</TableCell>
                    <TableCell className="text-[11px] text-muted-foreground">
                      <div className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(req.timestamp).toLocaleString()}</div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary"
                        className={
                          req.status === 'approved' ? 'bg-green-100 text-green-700' : 
                          req.status === 'rejected' ? 'bg-red-100 text-red-700' : 
                          'bg-yellow-100 text-yellow-700'
                        }
                      >
                        {req.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {req.status === 'pending' ? (
                        <div className="flex justify-end gap-2">
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            className="h-8 px-2"
                            disabled={!!processingId}
                            onClick={() => handleProcessRequest(req.id, 'rejected')}
                          >
                            {processingId === req.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
                          </Button>
                          <Button 
                            size="sm" 
                            className="h-8 px-4 font-bold"
                            disabled={!!processingId}
                            onClick={() => handleProcessRequest(req.id, 'approved')}
                          >
                            {processingId === req.id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <CheckCircle2 className="h-3 w-3 mr-1" />}
                            Approve
                          </Button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-muted-foreground uppercase font-bold">Processed</span>
                      )}
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
