"use client";

import { useState } from 'react';
import { LayoutDashboard, ShoppingBag, Users, Settings, Plus, Check, X, Eye, FileText, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { INITIAL_PRODUCTS } from '@/lib/data';

// Mock orders for admin
const MOCK_ADMIN_ORDERS = [
  { id: "ORD-101", customer: "john@example.com", product: "US Premium Virtual Number", amount: 15.00, status: "Pending", proof: "screenshot1.jpg", date: "2024-05-20" },
  { id: "ORD-102", customer: "alice@test.com", product: "SafeGuard Pro VPN", amount: 49.99, status: "Paid", proof: "receipt_pdf.pdf", date: "2024-05-19" },
  { id: "ORD-103", customer: "bob@mail.com", product: "Europe eSIM", amount: 25.00, status: "Completed", proof: "payment.png", date: "2024-05-18" },
];

export default function AdminDashboard() {
  const [orders, setOrders] = useState(MOCK_ADMIN_ORDERS);

  const updateStatus = (id: string, newStatus: string) => {
    setOrders(orders.map(o => o.id === id ? { ...o, status: newStatus } : o));
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar - Integrated into page for simplicity in demo */}
      <aside className="w-64 border-r bg-card hidden lg:block">
        <div className="p-6 font-headline font-bold text-xl text-primary border-b mb-4">VirtuLink Admin</div>
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold font-headline">Order Management</h1>
            <p className="text-muted-foreground">Review and verify payment proofs from customers.</p>
          </div>
          <div className="flex gap-4">
            <Link href="/admin/products/new">
              <Button className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold">
                <Plus className="mr-2 h-4 w-4" /> Add New Product
              </Button>
            </Link>
          </div>
        </div>

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="bg-card border p-1">
            <TabsTrigger value="all">All Orders</TabsTrigger>
            <TabsTrigger value="pending">Pending Review</TabsTrigger>
            <TabsTrigger value="paid">Marked as Paid</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <Card className="border-none ring-1 ring-border shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow className="bg-secondary/20">
                    <TableHead className="font-bold">ID</TableHead>
                    <TableHead className="font-bold">Customer</TableHead>
                    <TableHead className="font-bold">Product</TableHead>
                    <TableHead className="font-bold">Amount</TableHead>
                    <TableHead className="font-bold">Status</TableHead>
                    <TableHead className="font-bold">Proof</TableHead>
                    <TableHead className="text-right font-bold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-accent/5">
                      <TableCell className="font-mono text-xs font-bold">{order.id}</TableCell>
                      <TableCell>{order.customer}</TableCell>
                      <TableCell className="font-medium">{order.product}</TableCell>
                      <TableCell className="font-bold">${order.amount.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge 
                          className={
                            order.status === 'Completed' ? 'bg-green-100 text-green-700 hover:bg-green-100' :
                            order.status === 'Paid' ? 'bg-blue-100 text-blue-700 hover:bg-blue-100' :
                            'bg-yellow-100 text-yellow-700 hover:bg-yellow-100'
                          }
                        >
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/10">
                          <Eye className="mr-1 h-3 w-3" /> View Proof
                        </Button>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {order.status === 'Pending' && (
                            <Button size="sm" variant="outline" className="text-blue-600 border-blue-200" onClick={() => updateStatus(order.id, 'Paid')}>
                              <Check className="h-4 w-4 mr-1" /> Mark Paid
                            </Button>
                          )}
                          {order.status === 'Paid' && (
                            <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => updateStatus(order.id, 'Completed')}>
                              <Check className="h-4 w-4 mr-1" /> Complete
                            </Button>
                          )}
                          <Button size="icon" variant="ghost" className="text-destructive">
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

        {/* AI Tool Quick Access */}
        <section className="mt-12">
          <Card className="border-none ring-1 ring-border bg-gradient-to-br from-primary to-primary/90 text-primary-foreground">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Sparkles className="h-6 w-6 text-accent" />
                <CardTitle>AI Content Tool</CardTitle>
              </div>
              <CardDescription className="text-primary-foreground/70">
                Use generative AI to craft high-converting descriptions for your new virtual numbers and eSIMs.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/products/new">
                <Button variant="secondary" className="font-bold">
                  Try AI Description Generator
                </Button>
              </Link>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}