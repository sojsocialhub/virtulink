"use client";

import { useState } from 'react';
import { Search, Filter, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { INITIAL_PRODUCTS } from '@/lib/data';
import ProductCard from '@/components/products/ProductCard';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ProductsPage() {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const filteredProducts = INITIAL_PRODUCTS.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase()) || 
                          product.type.toLowerCase().includes(search.toLowerCase());
    const matchesTab = activeTab === 'all' || product.type === activeTab;
    return matchesSearch && matchesTab;
  });

  return (
    <div className="container mx-auto px-4 py-12">
      <header className="mb-12 text-center">
        <h1 className="text-4xl lg:text-5xl font-bold font-headline mb-4">Digital Solutions Catalog</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Choose from our reliable selection of communication and security tools tailored for your needs.
        </p>
      </header>

      <div className="flex flex-col lg:flex-row gap-8 items-start mb-12">
        <div className="w-full lg:w-1/4 space-y-6 lg:sticky lg:top-24">
          <div className="space-y-4">
            <h3 className="font-bold flex items-center">
              <Search className="mr-2 h-4 w-4 text-primary" /> Search
            </h3>
            <Input 
              placeholder="Search products..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-card border-none ring-1 ring-border"
            />
          </div>

          <div className="space-y-4">
            <h3 className="font-bold flex items-center">
              <Filter className="mr-2 h-4 w-4 text-primary" /> Categories
            </h3>
            <div className="flex flex-col gap-2">
              <Button 
                variant={activeTab === 'all' ? 'secondary' : 'ghost'} 
                className="justify-start font-medium" 
                onClick={() => setActiveTab('all')}
              >
                All Products
              </Button>
              <Button 
                variant={activeTab === 'virtual number' ? 'secondary' : 'ghost'} 
                className="justify-start font-medium" 
                onClick={() => setActiveTab('virtual number')}
              >
                Virtual Numbers
              </Button>
              <Button 
                variant={activeTab === 'eSIM' ? 'secondary' : 'ghost'} 
                className="justify-start font-medium" 
                onClick={() => setActiveTab('eSIM')}
              >
                eSIM Plans
              </Button>
              <Button 
                variant={activeTab === 'VPN subscription' ? 'secondary' : 'ghost'} 
                className="justify-start font-medium" 
                onClick={() => setActiveTab('VPN subscription')}
              >
                VPN Subscriptions
              </Button>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 text-xs">
            <div className="flex items-center font-bold text-primary mb-2">
              <SlidersHorizontal className="mr-2 h-3 w-3" /> Sorting
            </div>
            <p className="text-muted-foreground">Showing {filteredProducts.length} results</p>
          </div>
        </div>

        <div className="w-full lg:w-3/4">
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-card rounded-2xl ring-1 ring-border">
              <p className="text-muted-foreground mb-4">No products found matching your criteria.</p>
              <Button variant="outline" onClick={() => {setSearch(''); setActiveTab('all');}}>
                Reset Filters
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}