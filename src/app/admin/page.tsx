
"use client";

import { useState, useMemo } from 'react';
import { LayoutDashboard, ShoppingBag, Users, Settings, Plus, Check, X, Database, Loader2, Search, CreditCard, History } from 'lucide-react';
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { useFirestore, useCollection } from '@/firebase';
import { collection, addDoc, getDocs, query, limit, doc, updateDoc, increment } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

const SAMPLE_PLANS = [
  { name: "MTN 1GB SME", network: "MTN", price: 300, description: "30 Days Validity - SME", type: "data", features: ["30 Days", "SME"] },
  { name: "MTN 2GB SME", network: "MTN", price: 600, description: "30 Days Validity - SME", type: "data", features: ["30 Days", "SME"] },
  { name: "Airtel 1.5GB", network: "Airtel", price: 500, description: "30 Days Validity - Gifting", type: "data", features: ["30 Days", "Gifting"] },
  { name: "Glo 2.9GB", network: "Glo", price: 950, description: "30 Days Validity", type: "data", features: ["30 Days"] },
];

export default function AdminDashboard() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [creditAmount, setCreditAmount] = useState<string>('');
  const [targetUserId, setTargetUserId] = useState<string>('');
  const [isCrediting, setIsCrediting] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  
  const db = useFirestore();
  const { toast } = useToast();

  const { data: users, loading: loadingUsers } = useCollection(
    db ? query(collection(db, 'users')) : null
  );

  const { data: transactions, loading: loadingTx } = useCollection(
    db ? query(collection(db, 'transactions'), limit(50)) : null
  );

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    return users.filter(u => 
      u.email?.toLowerCase().includes(userSearch.toLowerCase()) || 
      u.name?.toLowerCase().includes(userSearch.toLowerCase())
    );
  }, [users, userSearch]);

  const handleManualCredit = async (userId: string, email: string) => {
    if (!db || !creditAmount || isNaN(Number(creditAmount))) {
      toast({ variant: "destructive", title: "Invalid Amount", description: "Please enter a valid numeric amount." });
      return;
    }

    setIsCrediting(true);
    const amount = Number(creditAmount);

    try {
      // 1. Update user balance
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        walletBalance: increment(amount)
      });

      // 2. Add transaction log
      await addDoc(collection(db, 'transactions'), {
        userId: userId,
        type: 'funding',
        amount: amount,
        status: 'Completed',
        service: 'Manual Admin Credit',
        date: new Date().toISOString(),
        reference: `ADMIN-${Date.now()}`
      });

      toast({
        title: "Wallet Credited",
        description: `Successfully added ₦${amount.toLocaleString()} to ${email}`
      });
      setCreditAmount('');
      setTargetUserId('');
    } catch (error: any) {
      toast({ variant: "destructive", title: "Credit Failed", description: error.message });
    } finally {
      setIsCrediting(false);
    }
  };

  const handleSeedData = async () => {
    if (!db) return;
    setIsSeeding(true);
    try {
      const q = query(collection(db, 'dataPlans'), limit(1));
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        toast({ title: "Plans already exist" });
        setIsSeeding(false);
        return;
      }

      const promises = SAMPLE_PLANS.map(plan => addDoc(collection(db, 'dataPlans'), plan));
      await Promise.all(promises);

      toast({ title: "Database Seeded!", description: "Sample plans added." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Seeding failed", description: error.message });
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="w-64 border-r bg-card hidden lg:block">
        <div className="p-6 font-headline font-bold text-xl text-primary border-b mb-4">Admin Hub</div>
        <nav className="px-4 space-y-2">
          <Button variant="secondary" className="w-full justify-start text-primary">
            <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
          </Button>
          <Link href="/admin/products" className="block">
            <Button variant="ghost" className="w-full justify-start">
              <ShoppingBag className="mr-2 h-4 w-4" /> Products
            </Button>
          </Link>
          <Button variant="ghost" className="w-full justify-start">
            <Users className="mr-2 h-4 w-4" /> Customers
          </Button>
        </nav>
      </aside>

      <main className="flex-1 p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold font-headline tracking-tight">Admin Control Center</h1>
            <p className="text-muted-foreground">Manual credits, database seeding, and platform management.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={handleSeedData} disabled={isSeeding}>
              {isSeeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Database className="mr-2 h-4 w-4" />}
              Seed Data
            </Button>
            <Link href="/admin/products/new">
              <Button className="bg-primary hover:bg-primary/90 text-white font-bold">
                <Plus className="mr-2 h-4 w-4" /> Add Product
              </Button>
            </Link>
          </div>
        </div>

        <Tabs defaultValue="credit" className="space-y-6">
          <TabsList className="bg-card border p-1">
            <TabsTrigger value="credit">Manual Wallet Credit</TabsTrigger>
            <TabsTrigger value="users">Manage Users</TabsTrigger>
            <TabsTrigger value="tx">All Transactions</TabsTrigger>
          </TabsList>

          <TabsContent value="credit" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" /> Instant Manual Credit
                </CardTitle>
                <CardDescription>Search for a user and enter an amount to credit their wallet instantly.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search users by name or email..." 
                      className="pl-10"
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                    />
                  </div>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Balance</TableHead>
                        <TableHead>Credit Amount</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loadingUsers ? (
                        <TableRow><TableCell colSpan={4} className="text-center py-8"><Loader2 className="animate-spin inline mr-2" /> Loading users...</TableCell></TableRow>
                      ) : filteredUsers.length > 0 ? (
                        filteredUsers.map((u) => (
                          <TableRow key={u.id}>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-bold">{u.name}</span>
                                <span className="text-xs text-muted-foreground">{u.email}</span>
                              </div>
                            </TableCell>
                            <TableCell className="font-mono">₦{u.walletBalance?.toLocaleString() || '0'}</TableCell>
                            <TableCell>
                              <Input 
                                type="number" 
                                placeholder="Amount" 
                                className="w-32 h-8"
                                value={targetUserId === u.id ? creditAmount : ''}
                                onChange={(e) => {
                                  setTargetUserId(u.id);
                                  setCreditAmount(e.target.value);
                                }}
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              <Button 
                                size="sm" 
                                onClick={() => handleManualCredit(u.id, u.email)}
                                disabled={isCrediting || targetUserId !== u.id || !creditAmount}
                              >
                                {isCrediting && targetUserId === u.id ? <Loader2 className="animate-spin h-3 w-3 mr-1" /> : <Plus className="h-3 w-3 mr-1" />}
                                Credit
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No users found.</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tx" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5 text-primary" /> Global Transactions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>User ID</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingTx ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-8">Loading...</TableCell></TableRow>
                    ) : transactions?.map((t: any) => (
                      <TableRow key={t.id}>
                        <TableCell className="text-xs">{new Date(t.date).toLocaleString()}</TableCell>
                        <TableCell className="font-mono text-[10px]">{t.userId}</TableCell>
                        <TableCell><Badge variant="outline">{t.type}</Badge></TableCell>
                        <TableCell className="font-bold">₦{t.amount.toLocaleString()}</TableCell>
                        <TableCell><Badge className="bg-green-100 text-green-700">{t.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
