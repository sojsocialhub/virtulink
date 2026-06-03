"use client";

import { Clock, CheckCircle, Package, ExternalLink, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { INITIAL_PRODUCTS } from '@/lib/data';

// Mock data for user's orders
const MOCK_ORDERS = [
  {
    id: "ORD-123456",
    product: INITIAL_PRODUCTS[0],
    status: "Pending",
    date: "2024-05-20",
    amount: 15.00
  },
  {
    id: "ORD-123457",
    product: INITIAL_PRODUCTS[1],
    status: "Completed",
    date: "2024-05-18",
    amount: 25.00
  }
];

export default function CustomerDashboard() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-4xl font-bold font-headline mb-2">Customer Dashboard</h1>
          <p className="text-muted-foreground">Manage your digital products and track your order status.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="font-medium">
            <Search className="mr-2 h-4 w-4" /> Search Orders
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <Card className="border-none ring-1 ring-border">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Total Orders</p>
                <h3 className="text-2xl font-bold">{MOCK_ORDERS.length}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none ring-1 ring-border">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Pending Review</p>
                <h3 className="text-2xl font-bold">1</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none ring-1 ring-border">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Completed</p>
                <h3 className="text-2xl font-bold">1</h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="bg-card border p-1 h-auto">
          <TabsTrigger value="all" className="rounded-md px-6 py-2">All Orders</TabsTrigger>
          <TabsTrigger value="pending" className="rounded-md px-6 py-2">Pending</TabsTrigger>
          <TabsTrigger value="completed" className="rounded-md px-6 py-2">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {MOCK_ORDERS.map((order) => (
            <Card key={order.id} className="border-none ring-1 ring-border overflow-hidden group hover:ring-primary/50 transition-all">
              <div className="flex flex-col md:flex-row items-stretch md:items-center">
                <div className="p-6 flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <div className="space-y-1">
                      <span className="text-xs font-mono font-bold text-muted-foreground uppercase">{order.id}</span>
                      <h4 className="text-xl font-bold">{order.product.name}</h4>
                    </div>
                    <Badge variant={order.status === 'Completed' ? 'default' : 'secondary'} className={order.status === 'Completed' ? 'bg-green-100 text-green-700 hover:bg-green-100' : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100'}>
                      {order.status}
                    </Badge>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground space-x-6">
                    <div>
                      <span className="block font-bold uppercase text-[10px] tracking-widest text-muted-foreground/60">Ordered On</span>
                      {order.date}
                    </div>
                    <div>
                      <span className="block font-bold uppercase text-[10px] tracking-widest text-muted-foreground/60">Total Amount</span>
                      <span className="text-foreground font-bold">${order.amount.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="block font-bold uppercase text-[10px] tracking-widest text-muted-foreground/60">Type</span>
                      <span className="capitalize">{order.product.type}</span>
                    </div>
                  </div>
                </div>
                <div className="border-t md:border-t-0 md:border-l bg-secondary/20 p-6 flex items-center justify-center md:w-48">
                  {order.status === 'Completed' ? (
                    <Button variant="outline" className="w-full">
                      View Details <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button variant="secondary" className="w-full" disabled>
                      Processing...
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}