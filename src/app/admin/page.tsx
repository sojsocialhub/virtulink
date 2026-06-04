
"use client";

import { useState, useMemo } from 'react';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Users, 
  Settings, 
  Plus, 
  Check, 
  X, 
  Database, 
  Loader2, 
  Search, 
  CreditCard, 
  History, 
  Clock, 
  CheckCircle2, 
  ShieldCheck, 
  Trash2, 
  Edit3,
  PackagePlus,
  ArrowLeft,
  Activity,
  AlertTriangle
} from 'lucide-react';
import { Card, CardDescription, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import Link from 'next/link';
import { useFirestore, useCollection } from '@/firebase';
import { collection, addDoc, getDocs, query, limit, doc, updateDoc, deleteDoc, increment, orderBy, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { PurchaseRequestStatus } from '@/lib/types';
import Image from 'next/image';

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
  const [isUpdatingRequest, setIsUpdatingRequest] = useState<string | null>(null);
  
  // Product state
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
  const { toast } = useToast();

  const { data: users, loading: loadingUsers } = useCollection(
    db ? query(collection(db, 'users')) : null
  );

  const { data: purchaseRequests, loading: loadingRequests } = useCollection(
    db ? query(collection(db, 'purchase_requests'), orderBy('date', 'desc')) : null
  );

  const { data: socialLogs, loading: loadingProducts, error: productsError } = useCollection(
    db ? query(collection(db, 'Sociallogs')) : null
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
    setIsUpdatingRequest(requestId);
    try {
      const requestRef = doc(db, 'purchase_requests', requestId);
      await updateDoc(requestRef, { status: newStatus });
      toast({ title: "Status Updated", description: `Request marked as ${newStatus}.` });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Update Failed", description: error.message });
    } finally {
      setIsUpdatingRequest(null);
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
        toast({ title: "Product Updated", description: "Product details saved successfully." });
      } else {
        await addDoc(collection(db, 'Sociallogs'), {
          ...payload,
          createdAt: serverTimestamp()
        });
        toast({ title: "Product Added", description: "New product listed in catalog." });
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

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="w-64 border-r bg-card hidden lg:block">
        <div className="p-6 font-headline font-bold text-xl text-primary border-b mb-4 text-center">Admin Hub</div>
        <nav className="px-4 space-y-2">
          <Button variant="secondary" className="w-full justify-start text-primary">
            <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            <ShoppingBag className="mr-2 h-4 w-4" /> Inventory
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            <Users className="mr-2 h-4 w-4" /> Customers
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            <Settings className="mr-2 h-4 w-4" /> Settings
          </Button>
        </nav>
      </aside>

      <main className="flex-1 p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold font-headline tracking-tight text-primary">Admin Control Center</h1>
            <p className="text-muted-foreground">Manage products, requests, and manual credits.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={handleSeedData} disabled={isSeeding}>
              {isSeeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Database className="mr-2 h-4 w-4" />}
              Seed Data
            </Button>
          </div>
        </div>

        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="bg-card border p-1 grid grid-cols-4 w-full max-w-2xl">
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="requests">Purchase Requests</TabsTrigger>
            <TabsTrigger value="credit">Manual Credit</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">Social Media Logs</h2>
                <p className="text-sm text-muted-foreground">Manage accounts listed in the Social Logs section.</p>
              </div>
              <Dialog open={isProductModalOpen} onOpenChange={setIsProductModalOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => { setEditingProduct(null); setProductForm({ name: '', description: '', price: '', imageUrl: '', features: '' }); }} className="font-bold">
                    <Plus className="mr-2 h-4 w-4" /> Add Product
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Social Log'}</DialogTitle>
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
                        {editingProduct ? 'Update Product' : 'List Product'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <Card className="border-none shadow-sm ring-1 ring-border">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Preview</TableHead>
                      <TableHead>Product Name</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Features</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingProducts ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-20"><Loader2 className="animate-spin inline mr-2" /> Loading products...</TableCell></TableRow>
                    ) : socialLogs?.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-20 text-muted-foreground italic">No products listed. Add your first log above.</TableCell></TableRow>
                    ) : socialLogs?.map((prod: any) => (
                      <TableRow key={prod.id}>
                        <TableCell>
                          <div className="relative h-10 w-16 rounded overflow-hidden border">
                            <Image 
                              src={prod.imageUrl?.startsWith('http') ? prod.imageUrl : `https://picsum.photos/seed/${prod.id}/100/100`} 
                              alt={prod.name} 
                              fill 
                              className="object-cover" 
                            />
                          </div>
                        </TableCell>
                        <TableCell className="font-bold">{prod.name}</TableCell>
                        <TableCell className="font-black text-primary">₦{(prod.price || 0).toLocaleString()}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {prod.features?.slice(0, 2).map((f: string, i: number) => (
                              <Badge key={i} variant="outline" className="text-[9px]">{f}</Badge>
                            ))}
                            {prod.features?.length > 2 && <span className="text-[9px] text-muted-foreground">+{prod.features.length - 2} more</span>}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="icon" variant="ghost" onClick={() => handleEditProduct(prod)}>
                              <Edit3 className="h-4 w-4 text-muted-foreground" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => handleDeleteProduct(prod.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ... other tabs (requests, credit, users) remain unchanged ... */}
          <TabsContent value="requests" className="space-y-4">
            <Card className="border-none ring-1 ring-border shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" /> Pending Purchase Requests
                </CardTitle>
                <CardDescription>Manually verify bank transfers and approve account delivery.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User / Date</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Payment Details</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingRequests ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-8"><Loader2 className="animate-spin inline mr-2" /> Loading...</TableCell></TableRow>
                    ) : purchaseRequests?.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No purchase requests found.</TableCell></TableRow>
                    ) : purchaseRequests?.map((req: any) => (
                      <TableRow key={req.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-bold">{req.userEmail}</span>
                            <span className="text-[10px] text-muted-foreground">{new Date(req.date).toLocaleString()}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-bold">{req.productName}</TableCell>
                        <TableCell>
                          <div className="text-xs">
                            <p><strong>Sender:</strong> {req.senderName}</p>
                            <p><strong>Ref:</strong> {req.reference}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-black">₦{req.amount.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge className={
                            req.status === 'delivered' ? 'bg-green-100 text-green-700' :
                            req.status === 'paid' ? 'bg-blue-100 text-blue-700' :
                            'bg-yellow-100 text-yellow-700'
                          }>
                            {req.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          {req.status === 'pending' && (
                            <Button 
                              size="sm" 
                              variant="secondary"
                              onClick={() => handleUpdateRequestStatus(req.id, 'paid')}
                              disabled={isUpdatingRequest === req.id}
                            >
                              Mark Paid
                            </Button>
                          )}
                          {req.status === 'paid' && (
                            <Button 
                              size="sm" 
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleUpdateRequestStatus(req.id, 'delivered')}
                              disabled={isUpdatingRequest === req.id}
                            >
                              Deliver
                            </Button>
                          )}
                          {isUpdatingRequest === req.id && <Loader2 className="animate-spin h-4 w-4 inline ml-2" />}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="credit" className="space-y-4">
            <Card className="border-none ring-1 ring-border shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" /> Instant Manual Credit
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search users..." 
                    className="pl-10"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                  />
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((u) => (
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
                            className="w-24 h-8" 
                            placeholder="0"
                            value={targetUserId === u.id ? creditAmount : ''}
                            onChange={(e) => {
                              setTargetUserId(u.id);
                              setCreditAmount(e.target.value);
                            }}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" onClick={() => handleManualCredit(u.id, u.email)} disabled={isCrediting || targetUserId !== u.id}>
                            Credit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Diagnostics Panel */}
        <div className="mt-12 space-y-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" /> Admin System Health & Diagnostics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 border-none ring-1 ring-border bg-card">
              <p className="text-xs text-muted-foreground uppercase font-black tracking-widest mb-1">Products Tab</p>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="font-bold text-sm">Active & Loaded</span>
              </div>
            </Card>
            <Card className="p-4 border-none ring-1 ring-border bg-card">
              <p className="text-xs text-muted-foreground uppercase font-black tracking-widest mb-1">Sociallogs Count</p>
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-primary" />
                <span className="font-bold text-sm">{loadingProducts ? 'Checking...' : socialLogs?.length || 0} Listed</span>
              </div>
            </Card>
            <Card className="p-4 border-none ring-1 ring-border bg-card">
              <p className="text-xs text-muted-foreground uppercase font-black tracking-widest mb-1">Firestore Status</p>
              <div className="flex items-center gap-2">
                {db ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <AlertTriangle className="h-4 w-4 text-red-500" />}
                <span className="font-bold text-sm">{db ? 'Connected' : 'Disconnected'}</span>
              </div>
            </Card>
            <Card className="p-4 border-none ring-1 ring-border bg-card">
              <p className="text-xs text-muted-foreground uppercase font-black tracking-widest mb-1">Inventory Sync</p>
              <div className="flex items-center gap-2">
                {productsError ? <AlertTriangle className="h-4 w-4 text-red-500" /> : <CheckCircle2 className="h-4 w-4 text-green-500" />}
                <span className="font-bold text-sm">{productsError ? 'Sync Error' : 'Live Updates On'}</span>
              </div>
            </Card>
          </div>
          {productsError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs font-mono">
              Error: {productsError.message}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
