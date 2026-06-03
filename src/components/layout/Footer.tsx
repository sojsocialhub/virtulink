import Link from 'next/link';
import { ShieldCheck, Mail, Phone, MessageCircle } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t bg-card mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary">
                <ShieldCheck className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-headline text-lg font-bold tracking-tight text-primary">VirtuLink</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Empowering global connectivity with high-quality virtual numbers, eSIMs, and secure VPN services.
            </p>
          </div>

          <div>
            <h4 className="font-bold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/products" className="hover:text-primary transition-colors">Browse Products</Link></li>
              <li><Link href="/faq" className="hover:text-primary transition-colors">Help Center / FAQ</Link></li>
              <li><Link href="/contact" className="hover:text-primary transition-colors">Contact Support</Link></li>
              <li><Link href="/about" className="hover:text-primary transition-colors">About Us</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link href="/refund" className="hover:text-primary transition-colors">Refund Policy</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4">Get in Touch</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span>support@virtulink.com</span>
              </div>
              <div className="flex items-center space-x-2">
                <MessageCircle className="h-4 w-4" />
                <span>Live Chat Available 24/7</span>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} VirtuLink Digital Products. All rights reserved.
        </div>
      </div>
    </footer>
  );
}