
"use client";

import Link from 'next/link';
import { useState, useMemo } from 'react';
import { User, Menu, X, Wallet, LayoutDashboard, History, ShieldAlert, LogIn, UserPlus, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth, useUser, useDoc, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();

  const userDocRef = useMemo(() => (db && user ? doc(db, 'users', user.uid) : null), [db, user]);
  const { data: userData } = useDoc(userDocRef);

  const isAdmin = userData?.role === 'admin';

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      router.push('/');
      setIsMenuOpen(false);
    }
  };

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
          <div className="hidden items-center space-x-4 md:flex">
            {user ? (
              <>
                <Link href="/dashboard" className="text-sm font-bold flex items-center gap-1.5 hover:text-primary transition-colors text-muted-foreground">
                  <LayoutDashboard className="h-4 w-4" /> Dashboard
                </Link>
                <Link href="/transactions" className="text-sm font-bold flex items-center gap-1.5 hover:text-primary transition-colors text-muted-foreground">
                  <History className="h-4 w-4" /> History
                </Link>
                {isAdmin && (
                  <Link href="/admin" className="text-sm font-bold flex items-center gap-1.5 hover:text-primary transition-colors text-muted-foreground">
                    <ShieldAlert className="h-4 w-4" /> Admin
                  </Link>
                )}
                <div className="h-8 w-px bg-border mx-2" />
                <Link href="/profile">
                  <Button variant="ghost" size="sm" className="rounded-full flex gap-2 font-bold">
                    <User className="h-4 w-4 text-primary" />
                    ₦{userData?.walletBalance?.toLocaleString() || '0'}
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-destructive">
                  <LogOut className="h-4 w-4 mr-1" /> Logout
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" className="font-bold">
                    <LogIn className="h-4 w-4 mr-2" /> Login
                  </Button>
                </Link>
                <Link href="/register">
                  <Button className="font-bold rounded-full">
                    <UserPlus className="h-4 w-4 mr-2" /> Join S.O.J VTU
                  </Button>
                </Link>
              </>
            )}
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
            {user ? (
              <>
                <Link href="/dashboard" className="text-lg font-bold flex items-center gap-2 p-2 hover:bg-muted rounded-lg" onClick={() => setIsMenuOpen(false)}>
                  <LayoutDashboard className="h-5 w-5" /> Dashboard
                </Link>
                <Link href="/transactions" className="text-lg font-bold flex items-center gap-2 p-2 hover:bg-muted rounded-lg" onClick={() => setIsMenuOpen(false)}>
                  <History className="h-5 w-5" /> History
                </Link>
                {isAdmin && (
                  <Link href="/admin" className="text-lg font-bold flex items-center gap-2 p-2 hover:bg-muted rounded-lg" onClick={() => setIsMenuOpen(false)}>
                    <ShieldAlert className="h-5 w-5" /> Admin
                  </Link>
                )}
                <Link href="/profile" className="text-lg font-bold flex items-center gap-2 p-2 hover:bg-muted rounded-lg" onClick={() => setIsMenuOpen(false)}>
                  <User className="h-5 w-5" /> Profile (₦{userData?.walletBalance?.toLocaleString() || '0'})
                </Link>
                <Button variant="destructive" className="w-full font-bold" onClick={handleLogout}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                  <Button variant="outline" className="w-full font-bold">Login</Button>
                </Link>
                <Link href="/register" onClick={() => setIsMenuOpen(false)}>
                  <Button className="w-full font-bold">Create Account</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
