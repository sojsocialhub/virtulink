
"use client";

import { useState } from 'react';
import { LayoutDashboard, ShoppingBag, Users, Settings, Plus, Check, X, Database, Loader2 } from 'lucide-react';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { useFirestore } from '@/firebase';
import { collection, addDoc, getDocs, query, limit } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

// Mock orders for admin UI
const MOCK_ADMIN_ORDERS = [
  { id: "ORD-101", customer: "john@example.com", product: "MTN 2GB Data", amount: 600, status: "Pending", date: "2024-05-20" },
  { id: "ORD-102", customer: "alice@test.com", product: "US Virtual Number", amount: 1500, status: "Completed", date: "2024-05-19" },
];

const SAMPLE_PLANS = [
  { name: "MTN 1GB SME", network: "MTN", price: 300, description: "30 Days Validity - SME", type: "data", features: ["30 Days", "SME"] },
  { name: "MTN 2GB SME", network: "MTN", price: 600, description: "30 Days Validity - SME", type: "data", features: ["30 Days", "SME"] },
  { name: "MTN 5GB SME", network: "MTN", price: 1500, description: "30 Days Validity - SME", type: "data", features: ["30 Days", "SME"] },
  { name: "Airtel 1.5GB", network: "Airtel", price: 500, description: "30 Days Validity - Gifting", type: "data", features: ["30 Days", "Gifting"] },
  { name: "Airtel 4.5GB", network: "Airtel", price: 1200, description: "30 Days Validity - Gifting", type: "data", features: ["30 Days", "Gifting"] },
  { name: "Glo 1.35GB", network: "Glo", price: 480, description: "30 Days Validity", type: "data", features: ["30 Days"] },
  { name: "Glo 2.9GB", network: "Glo", price: 950, description: "30 Days Validity", type: "data", features: ["30 Days"] },
  { name: "Glo 5.8GB", network: "Glo", price: 1900, description: "30 Days Validity", type: "data", features: ["30 Days"] },
  { name: "9mobile 1.5GB", network: "9mobile", price: 500, description: "30 Days Validity", type: "data", features: ["30 Days"] },
  { name: "9mobile 3GB", network: "9mobile", price: 1000, description: "30 Days Validity", type: "data", features: ["30 Days"] },
];

export default function AdminDashboard() {
  const [orders, setOrders] = useState(MOCK_ADMIN_ORDERS);
  const [isSeeding, setIsSeeding] = useState(false);
  const db = useFirestore();
  const { toast } = useToast();

  const updateStatus = (id: string, newStatus: string) => {
    setOrders(orders.map(o => o.id === id ? { ...o, status: newStatus } : o));
  };

  const handleSeedData = async () => {
    if (!db) return;
    setIsSeeding(true);
    try {
      // Check if data already exists to avoid duplicates
      const q = query(collection(db, 'dataPlans'), limit(1));
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        toast({
          title: "Plans already exist",
          description: "There are already data plans in your database.",
        });
        setIsSeeding(false);
        return;
      }

      // Add plans
      const promises = SAMPLE_PLANS.map(plan => addDoc(collection(db, 'dataPlans'), plan));
      await Promise.all(promises);

      toast({
        title: "Database Seeded!",
        description: "10 sample data plans have been added successfully.",
      });
    } catch (error: any) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Seeding failed",
        description: error.message || "Could not add sample data to Firestore.",
      });
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
          <Button variant="ghost" className="w-full justify-start">
            <Settings className="mr-2 h-4 w-4" /> Settings
          </Button>
        </nav>
      </aside>

      <main className="flex-1 p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold font-headline tracking-tight">Admin Control Center</h1>
            <p className="text-muted-foreground">Manage orders, funding requests, and platform data.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button 
              variant="outline" 
              onClick={handleSeedData} 
              disabled={isSeeding}
              className="border-primary text-primary hover:bg-primary/5 font-bold"
            >
              {isSeeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Database className="mr-2 h-4 w-4" />}
              Seed Sample Plans
            </Button>
            <Link href="/admin/products/new">
              <Button className="bg-primary hover:bg-primary/90 text-white font-bold">
                <Plus className="mr-2 h-4 w-4" /> Add Product
              </Button>
            </Link>
          </div>
        </div>

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="bg-card border p-1">
            <TabsTrigger value="all">All Orders</TabsTrigger>
            <TabsTrigger value="pending">Pending Review</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <Card className="border-none ring-1 ring-border shadow-sm overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-bold">ID</TableHead>
                    <TableHead className="font-bold">Customer</TableHead>
                    <TableHead className="font-bold">Product</TableHead>
                    <TableHead className="font-bold">Amount</TableHead>
                    <TableHead className="font-bold">Status</TableHead>
                    <TableHead className="text-right font-bold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-accent/5">
                      <TableCell className="font-mono text-xs font-bold">{order.id}</TableCell>
                      <TableCell>{order.customer}</TableCell>
                      <TableCell className="font-medium">{order.product}</TableCell>
                      <TableCell className="font-bold">₦{order.amount.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge 
                          className={
                            order.status === 'Completed' ? 'bg-green-100 text-green-700 hover:bg-green-100' :
                            'bg-yellow-100 text-yellow-700 hover:bg-yellow-100'
                          }
                        >
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" className="text-blue-600 h-8" onClick={() => updateStatus(order.id, 'Completed')}>
                            <Check className="h-3.5 w-3.5 mr-1" /> Approve
                          </Button>
                          <Button size="icon" variant="ghost" className="text-destructive h-8 w-8">
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
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
