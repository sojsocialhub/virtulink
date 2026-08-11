
"use client";

import { useState } from 'react';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Users as UsersIcon, 
  Plus, 
  Loader2, 
  ShieldCheck, 
  Edit3,
  PackagePlus,
  ArrowRight,
  Banknote,
  History
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useFirestore, useCollection, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { collection, addDoc, query, limit, doc, updateDoc, serverTimestamp, where } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function AdminDashboard() {
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
  const isAdmin = userData?.role === 'admin';

  const usersQuery = useMemoFirebase(() => db && isAdmin ? query(collection(db, 'users')) : null, [db, isAdmin]);
  const fundingQuery = useMemoFirebase(() => db && isAdmin ? query(collection(db, 'wallet_funding_requests'), where('status', '==', 'pending'), limit(10)) : null, [db, isAdmin]);
  const logsQuery = useMemoFirebase(() => db && isAdmin ? query(collection(db, 'Sociallogs')) : null, [db, isAdmin]);

  const { data: users } = useCollection(usersQuery);
  const { data: pendingFunding } = useCollection(fundingQuery);
  const { data: socialLogs } = useCollection(logsQuery);

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
        await addDoc(collection(db, 'Sociallogs'), { ...payload, createdAt: serverTimestamp() });
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

  if (loadingProfile) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;
  if (!isAdmin) return <div className="p-20 text-center"><ShieldCheck className="h-16 w-16 text-destructive mx-auto" /><h2 className="text-2xl font-black mt-4">Access Denied</h2></div>;

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="w-64 border-r bg-card hidden lg:block">
        <div className="p-6 font-headline font-bold text-xl text-primary border-b mb-4 text-center">Admin Hub</div>
        <nav className="px-4 space-y-2">
          <Button variant="secondary" className="w-full justify-start text-primary"><LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard</Button>
          <Link href="/admin/funding" className="block w-full">
            <Button variant="ghost" className="w-full justify-start"><Banknote className="mr-2 h-4 w-4" /> Funding Requests</Button>
          </Link>
          <Link href="/admin/social-inventory" className="block w-full"><Button variant="ghost" className="w-full justify-start"><ShoppingBag className="mr-2 h-4 w-4" /> Social Log Inventory</Button></Link>
          <Button variant="ghost" className="w-full justify-start"><UsersIcon className="mr-2 h-4 w-4" /> Customers</Button>
          <Button variant="ghost" className="w-full justify-start"><History className="mr-2 h-4 w-4" /> System Logs</Button>
        </nav>
      </aside>

      <main className="flex-1 p-4 sm:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black font-headline tracking-tight text-primary">Admin Control Center</h1>
            <p className="text-sm text-muted-foreground">Monitor system activity and manage approvals.</p>
          </div>
        </div>

        {/* Mobile Navigation Grid */}
        <div className="lg:hidden grid grid-cols-2 gap-3 mb-8">
           <Link href="/admin/funding">
             <Button variant="outline" className="w-full h-24 flex flex-col gap-2 font-black text-xs border-primary/20 bg-primary/5">
               <Banknote className="h-6 w-6 text-primary" /> 
               Funding Queue
             </Button>
           </Link>
           <Link href="/admin/social-inventory"><Button variant="outline" className="w-full h-24 flex flex-col gap-2 font-black text-xs border-primary/20 bg-primary/5"><ShoppingBag className="h-6 w-6 text-primary" /> Social Log Inventory</Button></Link>
           <Button variant="outline" className="w-full h-24 flex flex-col gap-2 font-black text-xs opacity-50"><UsersIcon className="h-6 w-6" /> Customers</Button>
           <Button variant="outline" className="w-full h-24 flex flex-col gap-2 font-black text-xs opacity-50"><LayoutDashboard className="h-6 w-6" /> Reports</Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
           <Card className="border-none ring-1 ring-border shadow-sm"><CardContent className="p-6"><div className="flex justify-between items-start"><div><p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Total Users</p><h3 className="text-2xl font-black">{users?.length || 0}</h3></div><UsersIcon className="h-5 w-5 text-primary opacity-50" /></div></CardContent></Card>
           
           <Card className="border-none ring-1 ring-border shadow-md bg-primary/5 border-l-4 border-l-primary">
             <CardContent className="p-6">
               <div className="flex justify-between items-start">
                 <div>
                   <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">Pending Funding</p>
                   <h3 className="text-2xl font-black">{pendingFunding?.length || 0}</h3>
                 </div>
                 <Banknote className="h-5 w-5 text-primary" />
               </div>
               <Link href="/admin/funding" className="mt-4 inline-flex items-center text-[10px] font-black uppercase text-primary hover:underline group">
                 Manage Funding <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-1" />
               </Link>
             </CardContent>
           </Card>

           <Card className="border-none ring-1 ring-border shadow-sm"><CardContent className="p-6"><div className="flex justify-between items-start"><div><p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Active Products</p><h3 className="text-2xl font-black">{socialLogs?.length || 0}</h3></div><ShoppingBag className="h-5 w-5 text-accent opacity-50" /></div></CardContent></Card>
        </div>

        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="bg-card border p-1 w-full max-w-lg">
            <TabsTrigger value="products" className="font-bold">Inventory</TabsTrigger>
            <TabsTrigger value="users" className="font-bold">Customers</TabsTrigger>
          </TabsList>
          <TabsContent value="products" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Catalog</h2>
              <Dialog open={isProductModalOpen} onOpenChange={setIsProductModalOpen}>
                <DialogTrigger asChild><Button className="font-bold rounded-xl"><Plus className="mr-2 h-4 w-4" /> Add Product</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Product Details</DialogTitle></DialogHeader>
                  <form onSubmit={handleSaveProduct} className="space-y-4 pt-4">
                    <Input placeholder="Name" value={productForm.name} onChange={e => setProductForm(prev => ({ ...prev, name: e.target.value }))} required />
                    <Input type="number" placeholder="Price (₦)" value={productForm.price} onChange={e => setProductForm(prev => ({ ...prev, price: e.target.value }))} required />
                    <Textarea placeholder="Description" value={productForm.description} onChange={e => setProductForm(prev => ({ ...prev, description: e.target.value }))} />
                    <Input placeholder="Features (comma separated)" value={productForm.features} onChange={e => setProductForm(prev => ({ ...prev, features: e.target.value }))} />
                    <Button type="submit" disabled={isSavingProduct} className="w-full rounded-xl h-12">{isSavingProduct ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <PackagePlus className="h-4 w-4 mr-2" />} Save Product</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            <Card className="border-none ring-1 ring-border overflow-hidden rounded-2xl">
              <Table>
                <TableHeader><TableRow className="bg-muted/30"><TableHead>Product</TableHead><TableHead>Price</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {socialLogs?.map((prod: any) => (
                    <TableRow key={prod.id} className="hover:bg-muted/20"><TableCell className="font-bold">{prod.name}</TableCell><TableCell className="font-mono">₦{prod.price.toLocaleString()}</TableCell><TableCell className="text-right"><Button size="icon" variant="ghost" onClick={() => { setEditingProduct(prod); setProductForm({ name: prod.name, price: String(prod.price), description: prod.description || '', imageUrl: prod.imageUrl || '', features: prod.features?.join(', ') || '' }); setIsProductModalOpen(true); }}><Edit3 className="h-4 w-4 text-primary" /></Button></TableCell></TableRow>
                  ))}
                  {socialLogs?.length === 0 && <TableRow><TableCell colSpan={3} className="text-center py-10 text-muted-foreground italic">No products in inventory.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
          <TabsContent value="users">
            <Card className="border-none ring-1 ring-border rounded-2xl overflow-hidden">
               <Table>
                <TableHeader><TableRow className="bg-muted/30"><TableHead>Customer</TableHead><TableHead>Wallet</TableHead><TableHead>Joined</TableHead></TableRow></TableHeader>
                <TableBody>
                  {users?.map((u: any) => (
                    <TableRow key={u.id}><TableCell><div className="flex flex-col"><span className="font-bold">{u.name}</span><span className="text-xs text-muted-foreground">{u.email}</span></div></TableCell><TableCell className="font-black text-primary">₦{u.walletBalance?.toLocaleString() || '0'}</TableCell><TableCell className="text-xs text-muted-foreground">{new Date(u.createdAt).toLocaleDateString()}</TableCell></TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
