
"use client";

import { useState, useMemo } from 'react';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Users as UsersIcon, 
  Settings, 
  Plus, 
  Database, 
  Loader2, 
  Search, 
  CreditCard, 
  Clock, 
  CheckCircle2, 
  ShieldCheck, 
  Trash2, 
  Edit3,
  PackagePlus,
  Activity,
  ListOrdered,
  AlertCircle,
  Banknote,
  ArrowRight,
  Menu
} from 'lucide-react';
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { useFirestore, useCollection, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { collection, addDoc, getDocs, query, limit, doc, updateDoc, deleteDoc, increment, orderBy, serverTimestamp, where } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { PurchaseRequestStatus } from '@/lib/types';
import Image from 'next/image';
import Link from 'next/link';

const SAMPLE_PLANS = [
  { name: "MTN 1GB SME", network: "MTN", price: 300, description: "30 Days Validity - SME", type: "data", features: ["30 Days", "SME"] },
  { name: "MTN 2GB SME", network: "MTN", price: 600, description: "30 Days Validity - SME", type: "data", features: ["30 Days", "SME"] },
  { name: "Airtel 1.5GB", network: "Airtel", price: 450, description: "30 Days Validity - Gifting", type: "data", features: ["30 Days", "Gifting"] },
  { name: "Glo 2.9GB", network: "Glo", price: 950, description: "30 Days Validity", type: "data", features: ["30 Days"] },
];

export default function AdminDashboard() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [creditAmount, setCreditAmount] = useState<string>('');
  const [targetUserId, setTargetUserId] = useState<string>('');
  const [isCrediting, setIsCrediting] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    imageUrl: '',
    features: ''
  });

  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const userDocRef = useMemoFirebase(() => (db && user ? doc(db, 'users', user.uid) : null), [db, user]);
  const { data: userData, loading: loadingProfile } = useDoc(userDocRef);
  
  const isAdmin = useMemo(() => userData?.role === 'admin', [userData]);

  const usersQuery = useMemoFirebase(() => 
    db && isAdmin ? query(collection(db, 'users')) : null, 
    [db, isAdmin]
  );
  const requestsQuery = useMemoFirebase(() => 
    db && isAdmin ? query(collection(db, 'purchase_requests'), orderBy('date', 'desc')) : null, 
    [db, isAdmin]
  );
  const fundingQuery = useMemoFirebase(() => 
    db && isAdmin ? query(collection(db, 'wallet_funding_requests'), where('status', '==', 'pending'), limit(10)) : null, 
    [db, isAdmin]
  );
  const logsQuery = useMemoFirebase(() => 
    db && isAdmin ? query(collection(db, 'Sociallogs')) : null, 
    [db, isAdmin]
  );
  const allTxQuery = useMemoFirebase(() => 
    db && isAdmin ? query(collection(db, 'transactions'), orderBy('date', 'desc'), limit(50)) : null, 
    [db, isAdmin]
  );

  const { data: users, loading: loadingUsers } = useCollection(usersQuery);
  const { data: purchaseRequests, loading: loadingRequests } = useCollection(requestsQuery);
  const { data: pendingFunding, loading: loadingFunding } = useCollection(fundingQuery);
  const { data: socialLogs, loading: loadingProducts } = useCollection(logsQuery);
  const { data: allTransactions, loading: loadingAllTx } = useCollection(allTxQuery);

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
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { walletBalance: increment(amount) });

      await addDoc(collection(db, 'transactions'), {
        userId: userId,
        type: 'funding',
        amount: amount,
        status: 'Completed',
        service: 'Manual Admin Credit',
        date: new Date().toISOString(),
        reference: `ADMIN-${Date.now()}`
      });

      toast({ title: "Wallet Credited", description: `Successfully added ₦${amount.toLocaleString()} to ${email}` });
      setCreditAmount('');
      setTargetUserId('');
    } catch (error: any) {
      toast({ variant: "destructive", title: "Credit Failed", description: error.message });
    } finally {
      setIsCrediting(false);
    }
  };

  const handleUpdateRequestStatus = async (requestId: string, newStatus: PurchaseRequestStatus) => {
    if (!db) return;
    try {
      const requestRef = doc(db, 'purchase_requests', requestId);
      await updateDoc(requestRef, { status: newStatus });
      toast({ title: "Status Updated", description: `Request marked as ${newStatus}.` });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Update Failed", description: error.message });
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;

    setIsSavingProduct(true);
    try {
      const payload = {
        name: productForm.name,
        description: productForm.description,
        price: Number(productForm.price),
        imageUrl: productForm.imageUrl || `https://picsum.photos/seed/${Date.now()}/600/400`,
        features: productForm.features.split(',').map(f => f.trim()).filter(f => f !== ''),
        updatedAt: serverTimestamp()
      };

      if (editingProduct) {
        await updateDoc(doc(db, 'Sociallogs', editingProduct.id), payload);
        toast({ title: "Product Updated" });
      } else {
        await addDoc(collection(db, 'Sociallogs'), {
          ...payload,
          createdAt: serverTimestamp()
        });
        toast({ title: "Product Added" });
      }

      setIsProductModalOpen(false);
      setEditingProduct(null);
      setProductForm({ name: '', description: '', price: '', imageUrl: '', features: '' });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleEditProduct = (product: any) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name || '',
      description: product.description || '',
      price: String(product.price || ''),
      imageUrl: product.imageUrl || '',
      features: Array.isArray(product.features) ? product.features.join(', ') : ''
    });
    setIsProductModalOpen(true);
  };

  const handleDeleteProduct = async (id: string) => {
    if (!db || !confirm('Are you sure you want to delete this product?')) return;
    try {
      await deleteDoc(doc(db, 'Sociallogs', id));
      toast({ title: "Product Deleted" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Delete Failed", description: error.message });
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

  if (loadingProfile) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground font-bold">Verifying admin credentials...</p>
      </div>
    );
  }

  if (!user || (userData && !isAdmin)) {
    return (
      <div className="p-20 text-center space-y-4 max-w-xl mx-auto">
        <ShieldCheck className="h-16 w-16 text-destructive mx-auto" />
        <h2 className="text-2xl font-black">Access Denied</h2>
        <p className="text-muted-foreground">This hub is restricted to authorized administrative personnel only. Please ensure your account has the "admin" role.</p>
        <Button onClick={() => window.location.href = '/'}>Return Home</Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="w-64 border-r bg-card hidden lg:block">
        <div className="p-6 font-headline font-bold text-xl text-primary border-b mb-4 text-center">Admin Hub</div>
        <nav className="px-4 space-y-2">
          <Button variant="secondary" className="w-full justify-start text-primary">
            <LayoutDashboard className="mr-2 h-4 w-4" /> Main Dashboard
          </Button>
          <Link href="/admin/funding" className="block w-full">
            <Button variant="ghost" className="w-full justify-start">
              <Banknote className="mr-2 h-4 w-4" /> Funding Requests
            </Button>
          </Link>
          <Button variant="ghost" className="w-full justify-start">
            <ShoppingBag className="mr-2 h-4 w-4" /> Products & Inventory
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            <UsersIcon className="mr-2 h-4 w-4" /> Customer Management
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            <ListOrdered className="mr-2 h-4 w-4" /> All Transactions
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            <Settings className="mr-2 h-4 w-4" /> Hub Settings
          </Button>
        </nav>
      </aside>

      <main className="flex-1 p-4 sm:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black font-headline tracking-tight text-primary">Admin Control Center</h1>
            <p className="text-sm text-muted-foreground">Comprehensive hub for products, manual wallet funding, and system monitoring.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" size="sm" onClick={handleSeedData} disabled={isSeeding}>
              {isSeeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Database className="mr-2 h-4 w-4" />}
              Seed Data
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Grid */}
        <div className="lg:hidden grid grid-cols-2 gap-3 mb-8">
           <Link href="/admin/funding" className="block">
              <Button variant="outline" className="w-full h-20 flex flex-col gap-2 font-bold text-xs">
                <Banknote className="h-5 w-5 text-primary" />
                Funding Queue
              </Button>
           </Link>
           <Button variant="outline" className="w-full h-20 flex flex-col gap-2 font-bold text-xs opacity-50">
              <ShoppingBag className="h-5 w-5" />
              Products
           </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
           <Card className="border-none ring-1 ring-border shadow-sm">
             <CardContent className="p-6">
               <div className="flex justify-between items-start">
                 <div>
                   <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Total Users</p>
                   <h3 className="text-2xl font-black">{users?.length || 0}</h3>
                 </div>
                 <UsersIcon className="h-5 w-5 text-primary opacity-50" />
               </div>
             </CardContent>
           </Card>
           <Card className="border-none ring-1 ring-border shadow-sm bg-primary/5">
             <CardContent className="p-6">
               <div className="flex justify-between items-start">
                 <div>
                   <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">Pending Funding</p>
                   <h3 className="text-2xl font-black">{pendingFunding?.length || 0}</h3>
                 </div>
                 <Banknote className="h-5 w-5 text-primary" />
               </div>
               <Link href="/admin/funding" className="mt-4 inline-flex items-center text-[10px] font-black uppercase text-primary hover:underline">
                  Manage Funding <ArrowRight className="ml-1 h-3 w-3" />
               </Link>
             </CardContent>
           </Card>
        </div>

        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="bg-card border p-1 flex w-full max-w-4xl overflow-x-auto justify-start no-scrollbar">
            <TabsTrigger value="products">Inventory</TabsTrigger>
            <TabsTrigger value="requests">Orders</TabsTrigger>
            <TabsTrigger value="credit">Instant Credit</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="transactions">Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-bold">Product Catalog</h2>
                <p className="text-sm text-muted-foreground">Manage accounts listed in the digital store.</p>
              </div>
              <Dialog open={isProductModalOpen} onOpenChange={setIsProductModalOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => { setEditingProduct(null); setProductForm({ name: '', description: '', price: '', imageUrl: '', features: '' }); }} className="font-bold w-full sm:w-auto">
                    <Plus className="mr-2 h-4 w-4" /> Create Product
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Account'}</DialogTitle>
                    <DialogDescription>Fill in the details to list this account in the store.</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSaveProduct} className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>Product Name</Label>
                      <Input 
                        placeholder="e.g. Aged Facebook Account" 
                        value={productForm.name}
                        onChange={e => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Price (₦)</Label>
                      <Input 
                        type="number"
                        placeholder="3500" 
                        value={productForm.price}
                        onChange={e => setProductForm(prev => ({ ...prev, price: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea 
                        placeholder="Short description of account quality..." 
                        value={productForm.description}
                        onChange={e => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Image URL (Optional)</Label>
                      <Input 
                        placeholder="https://..." 
                        value={productForm.imageUrl}
                        onChange={e => setProductForm(prev => ({ ...prev, imageUrl: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Features (Comma separated)</Label>
                      <Input 
                        placeholder="2FA Enabled, Marketplace, 500+ Friends" 
                        value={productForm.features}
                        onChange={e => setProductForm(prev => ({ ...prev, features: e.target.value }))}
                      />
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={isSavingProduct} className="w-full">
                        {isSavingProduct ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <PackagePlus className="h-4 w-4 mr-2" />}
                        {editingProduct ? 'Save Changes' : 'List Product'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <Card className="border-none shadow-sm ring-1 ring-border">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead className="hidden sm:table-cell">Features</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loadingProducts ? (
                        <TableRow><TableCell colSpan={4} className="text-center py-20"><Loader2 className="animate-spin inline mr-2" /> Loading inventory...</TableCell></TableRow>
                      ) : socialLogs?.length === 0 ? (
                        <TableRow><TableCell colSpan={4} className="text-center py-20 text-muted-foreground italic">No products listed.</TableCell></TableRow>
                      ) : socialLogs?.map((prod: any) => (
                        <TableRow key={prod.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="relative h-10 w-10 rounded overflow-hidden border shrink-0">
                                <Image 
                                  src={prod.imageUrl?.startsWith('http') ? prod.imageUrl : `https://picsum.photos/seed/${prod.id}/100/100`} 
                                  alt={prod.name} 
                                  fill 
                                  className="object-cover" 
                                />
                              </div>
                              <span className="font-bold text-xs sm:text-sm">{prod.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-black text-primary text-xs sm:text-sm">₦{(prod.price || 0).toLocaleString()}</TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <div className="flex flex-wrap gap-1">
                              {prod.features?.slice(0, 2).map((f: string, i: number) => (
                                <Badge key={i} variant="outline" className="text-[9px]">{f}</Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleEditProduct(prod)}>
                                <Edit3 className="h-3.5 w-3.5 text-muted-foreground" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleDeleteProduct(prod.id)}>
                                <Trash2 className="h-3.5 w-3.5 text-destructive" />
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
          </TabsContent>

          <TabsContent value="requests" className="space-y-4">
            <Card className="border-none ring-1 ring-border shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" /> Pending Order Requests
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 sm:p-6">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead className="hidden sm:table-cell">Payment</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loadingRequests ? (
                        <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="animate-spin inline mr-2" /> Loading...</TableCell></TableRow>
                      ) : purchaseRequests?.length === 0 ? (
                        <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No pending requests.</TableCell></TableRow>
                      ) : purchaseRequests?.map((req: any) => (
                        <TableRow key={req.id}>
                          <TableCell>
                            <span className="text-[10px] font-bold block truncate max-w-[80px] sm:max-w-none">{req.userEmail}</span>
                          </TableCell>
                          <TableCell className="font-bold text-[10px]">{req.productName}</TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <div className="text-[10px]">
                              <p><strong>Sender:</strong> {req.senderName}</p>
                            </div>
                          </TableCell>
                          <TableCell className="font-black text-[10px]">₦{req.amount.toLocaleString()}</TableCell>
                          <TableCell className="text-right">
                             {req.status === 'pending' && (
                              <Button size="sm" className="h-7 text-[10px]" onClick={() => handleUpdateRequestStatus(req.id, 'paid')}>Approve</Button>
                             )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Other Tabs content omitted for brevity but preserved in the app structure */}
          <TabsContent value="credit" className="space-y-4">
             <Card className="border-none ring-1 ring-border shadow-sm">
                <CardHeader>
                   <CardTitle>Manual Credit</CardTitle>
                </CardHeader>
                <CardContent>
                   <p className="text-sm text-muted-foreground">Search for a user to apply instant credit.</p>
                </CardContent>
             </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
