"use client";

import Link from 'next/link';
import { useState } from 'react';
import { Search, User, ShoppingCart, Menu, X, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <ShieldCheck className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-headline text-xl font-bold tracking-tight text-primary">VirtuLink</span>
            </Link>
          </div>

          {/* Desktop Search */}
          <div className="hidden flex-1 px-8 md:flex">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search virtual numbers, eSIMs..."
                className="pl-9 bg-secondary/50 border-none focus-visible:ring-1 focus-visible:ring-accent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Desktop Links */}
          <div className="hidden items-center space-x-4 md:flex">
            <Link href="/products" className="text-sm font-medium hover:text-primary transition-colors">Products</Link>
            <Link href="/faq" className="text-sm font-medium hover:text-primary transition-colors">FAQ</Link>
            <Link href="/dashboard" className="text-sm font-medium hover:text-primary transition-colors">Orders</Link>
            <Link href="/admin">
              <Button variant="outline" size="sm" className="font-medium">Admin Panel</Button>
            </Link>
            <Button size="icon" variant="ghost" className="relative">
              <ShoppingCart className="h-5 w-5" />
            </Button>
            <Link href="/profile">
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t bg-background p-4 space-y-4">
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex flex-col space-y-3">
            <Link href="/products" className="text-lg font-medium">Products</Link>
            <Link href="/faq" className="text-lg font-medium">FAQ</Link>
            <Link href="/dashboard" className="text-lg font-medium">My Orders</Link>
            <Link href="/profile" className="text-lg font-medium">Profile</Link>
            <Link href="/admin" className="text-lg font-medium text-primary">Admin Dashboard</Link>
          </div>
        </div>
      )}
    </nav>
  );
}