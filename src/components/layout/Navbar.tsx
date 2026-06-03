
"use client";

import Link from 'next/link';
import { useState } from 'react';
import { User, Menu, X, Wallet, LayoutDashboard, History } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20">
                <Wallet className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-headline text-lg font-black tracking-tighter text-primary">S.O.J VTU</span>
            </Link>
          </div>

          {/* Desktop Links */}
          <div className="hidden items-center space-x-6 md:flex">
            <Link href="/dashboard" className="text-sm font-bold flex items-center gap-1.5 hover:text-primary transition-colors text-muted-foreground">
              <LayoutDashboard className="h-4 w-4" /> Dashboard
            </Link>
            <Link href="/transactions" className="text-sm font-bold flex items-center gap-1.5 hover:text-primary transition-colors text-muted-foreground">
              <History className="h-4 w-4" /> Transactions
            </Link>
            <div className="h-8 w-px bg-border mx-2" />
            <Link href="/profile">
              <Button variant="ghost" size="icon" className="rounded-full bg-muted">
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
        <div className="md:hidden border-t bg-background p-4 space-y-4 shadow-xl">
          <div className="flex flex-col space-y-3">
            <Link href="/dashboard" className="text-lg font-bold flex items-center gap-2 p-2 hover:bg-muted rounded-lg" onClick={() => setIsMenuOpen(false)}>
              <LayoutDashboard className="h-5 w-5" /> Dashboard
            </Link>
            <Link href="/transactions" className="text-lg font-bold flex items-center gap-2 p-2 hover:bg-muted rounded-lg" onClick={() => setIsMenuOpen(false)}>
              <History className="h-5 w-5" /> Transactions
            </Link>
            <Link href="/profile" className="text-lg font-bold flex items-center gap-2 p-2 hover:bg-muted rounded-lg" onClick={() => setIsMenuOpen(false)}>
              <User className="h-5 w-5" /> Profile
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
