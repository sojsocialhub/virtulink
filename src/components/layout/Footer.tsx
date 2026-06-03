
import Link from 'next/link';
import { Wallet, Mail, Phone, MessageCircle, Github, Twitter, Facebook } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t bg-card mt-auto overflow-hidden relative">
       <div className="absolute left-0 bottom-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -ml-32 -mb-32"></div>
      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="space-y-6 md:col-span-1">
            <Link href="/" className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Wallet className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-headline text-xl font-black tracking-tighter text-primary">S.O.J VTU</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Nigeria's #1 hub for instant airtime, data bundles, aged social logs, and virtual phone numbers. Built on trust and lightning-fast delivery.
            </p>
            <div className="flex space-x-4">
              <Link href="#" className="h-8 w-8 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-white transition-all">
                <Facebook className="h-4 w-4" />
              </Link>
              <Link href="#" className="h-8 w-8 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-white transition-all">
                <Twitter className="h-4 w-4" />
              </Link>
              <Link href="#" className="h-8 w-8 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-white transition-all">
                <Github className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div>
            <h4 className="font-black text-sm uppercase tracking-widest mb-6">Quick Actions</h4>
            <ul className="space-y-3 text-sm font-bold text-muted-foreground">
              <li><Link href="/purchase/airtime" className="hover:text-primary transition-colors">Buy Airtime</Link></li>
              <li><Link href="/purchase/data" className="hover:text-primary transition-colors">Buy Data Bundles</Link></li>
              <li><Link href="/purchase/number" className="hover:text-primary transition-colors">Virtual Numbers</Link></li>
              <li><Link href="/purchase/social" className="hover:text-primary transition-colors">Social Media Logs</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-black text-sm uppercase tracking-widest mb-6">Legal & Support</h4>
            <ul className="space-y-3 text-sm font-bold text-muted-foreground">
              <li><Link href="/about" className="hover:text-primary transition-colors">About S.O.J VTU</Link></li>
              <li><Link href="/faq" className="hover:text-primary transition-colors">Help Center</Link></li>
              <li><Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link href="/refund" className="hover:text-primary transition-colors">Refund Policy</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-black text-sm uppercase tracking-widest mb-6">Contact Support</h4>
            <div className="space-y-4 text-sm font-bold text-muted-foreground">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                  <Mail className="h-4 w-4" />
                </div>
                <span>support@sojvtu.com</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                  <MessageCircle className="h-4 w-4" />
                </div>
                <span>WhatsApp: +234 912 096 4447</span>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-16 pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-bold text-muted-foreground/60 uppercase tracking-widest">
          <p>&copy; {new Date().getFullYear()} S.O.J VTU Hub Nigeria. All rights reserved.</p>
          <p>Powered by OLUWADARE Samuel Ayomide</p>
        </div>
      </div>
    </footer>
  );
}
