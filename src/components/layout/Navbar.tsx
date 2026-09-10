 "use client";

import Link from 'next/link';
import { useState, useMemo } from 'react';
import {
  User,
  Menu,
  X,
  Wallet,
  LayoutDashboard,
  History,
  ShieldAlert,
  LogIn,
  UserPlus,
  Banknote,
  ChevronDown,
} from 'lucide-react';
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

  const userDocRef = useMemo(
    () => (db && user ? doc(db, 'users', user.uid) : null),
    [db, user]
  );

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
    <nav className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        <div className="flex h-[70px] items-center justify-between">
          {/* Brand */}
          <Link href="/" className="group flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-600 shadow-lg shadow-green-600/20 transition group-hover:scale-105">
              <Wallet className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="text-lg font-black leading-none tracking-tight text-slate-950">
                S.O.J <span className="text-green-600">VTU</span>
              </div>
              <div className="mt-1 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">
                Digital Services
              </div>
            </div>
          </Link>

          {/* Desktop */}
          <div className="hidden items-center gap-2 md:flex">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="rounded-lg px-3 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50 hover:text-green-600"
                >
                  Dashboard
                </Link>

                <Link
                  href="/transactions"
                  className="rounded-lg px-3 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50 hover:text-green-600"
                >
                  History
                </Link>

                {isAdmin && (
                  <Link href="/admin">
                    <Button
                      size="sm"
                      className="ml-1 rounded-lg bg-slate-950 font-bold text-white hover:bg-green-600"
                    >
                      <ShieldAlert className="mr-1.5 h-4 w-4" />
                      Admin Hub
                    </Button>
                  </Link>
                )}

                <div className="mx-2 h-7 w-px bg-slate-200" />

                <Link href="/profile">
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 transition hover:border-green-200 hover:bg-green-50">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-600">
                      <Wallet className="h-3.5 w-3.5 text-white" />
                    </div>
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                        Balance
                      </p>
                      <p className="text-sm font-black text-slate-900">
                        ₦{userData?.walletBalance?.toLocaleString() || '0'}
                      </p>
                    </div>
                  </div>
                </Link>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="ml-1 font-bold text-slate-500 hover:text-red-600"
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link
                  href="/about"
                  className="px-3 py-2 text-sm font-bold text-slate-600 transition hover:text-green-600"
                >
                  About
                </Link>
                <Link
                  href="/faq"
                  className="px-3 py-2 text-sm font-bold text-slate-600 transition hover:text-green-600"
                >
                  FAQ
                </Link>
                <Link
                  href="/contact"
                  className="px-3 py-2 text-sm font-bold text-slate-600 transition hover:text-green-600"
                >
                  Contact
                </Link>

                <div className="mx-2 h-7 w-px bg-slate-200" />

                <Link href="/login">
                  <Button
                    variant="ghost"
                    className="rounded-xl font-bold text-slate-700"
                  >
                    <LogIn className="mr-2 h-4 w-4" />
                    Login
                  </Button>
                </Link>

                <Link href="/register">
                  <Button className="rounded-xl bg-green-600 px-5 font-bold text-white shadow-md shadow-green-600/20 hover:bg-green-700">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Create Account
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile */}
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-5 shadow-xl md:hidden">
          <div className="mx-auto max-w-7xl space-y-2">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 rounded-xl p-3 font-bold text-slate-700 hover:bg-green-50 hover:text-green-700"
                >
                  <LayoutDashboard className="h-5 w-5" />
                  Dashboard
                </Link>

                <Link
                  href="/transactions"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 rounded-xl p-3 font-bold text-slate-700 hover:bg-green-50 hover:text-green-700"
                >
                  <History className="h-5 w-5" />
                  Transaction History
                </Link>

                <Link
                  href="/profile"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center justify-between rounded-xl bg-slate-50 p-3 font-bold text-slate-700"
                >
                  <span className="flex items-center gap-3">
                    <User className="h-5 w-5 text-green-600" />
                    Profile
                  </span>
                  <span className="font-black text-green-600">
                    ₦{userData?.walletBalance?.toLocaleString() || '0'}
                  </span>
                </Link>

                {isAdmin && (
                  <>
                    <Link
                      href="/admin"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-3 rounded-xl bg-slate-950 p-3 font-bold text-white"
                    >
                      <ShieldAlert className="h-5 w-5" />
                      Admin Hub
                    </Link>

                    <Link
                      href="/admin/funding"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-3 rounded-xl bg-green-50 p-3 font-bold text-green-700"
                    >
                      <Banknote className="h-5 w-5" />
                      Funding Requests
                    </Link>
                  </>
                )}

                <Button
                  variant="outline"
                  className="mt-2 w-full rounded-xl font-bold text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link
                  href="/about"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center justify-between rounded-xl p-3 font-bold text-slate-700 hover:bg-slate-50"
                >
                  About
                  <ChevronDown className="h-4 w-4 rotate-[-90deg]" />
                </Link>

                <Link
                  href="/faq"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center justify-between rounded-xl p-3 font-bold text-slate-700 hover:bg-slate-50"
                >
                  FAQ
                  <ChevronDown className="h-4 w-4 rotate-[-90deg]" />
                </Link>

                <Link
                  href="/contact"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center justify-between rounded-xl p-3 font-bold text-slate-700 hover:bg-slate-50"
                >
                  Contact
                  <ChevronDown className="h-4 w-4 rotate-[-90deg]" />
                </Link>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Link
                    href="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex h-11 items-center justify-center rounded-xl border border-slate-200 font-bold text-slate-700"
                  >
                    Login
                  </Link>

                  <Link
                    href="/register"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex h-11 items-center justify-center rounded-xl bg-green-600 font-bold text-white"
                  >
                    Create Account
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
