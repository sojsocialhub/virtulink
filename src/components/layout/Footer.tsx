import Link from 'next/link';
import { Wallet, Mail, MessageCircle, Facebook, Twitter, Github, ArrowUpRight } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-slate-950 text-white">
      <div className="absolute -left-32 bottom-0 h-72 w-72 rounded-full bg-green-500/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-600">
                <Wallet className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-lg font-black">
                  S.O.J <span className="text-green-400">VTU</span>
                </div>
                <div className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-500">
                  Digital Services
                </div>
              </div>
            </Link>

            <p className="mt-5 max-w-xs text-sm leading-6 text-slate-400">
              Your convenient hub for airtime, data, virtual numbers, social
              products and digital services.
            </p>

            <div className="mt-6 flex gap-2">
              {[Facebook, Twitter, Github].map((Icon, index) => (
                <Link
                  key={index}
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-slate-400 transition hover:bg-green-600 hover:text-white"
                >
                  <Icon className="h-4 w-4" />
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-black uppercase tracking-[0.18em] text-white">
              Services
            </h4>
            <ul className="mt-5 space-y-3 text-sm font-medium text-slate-400">
              <li><Link href="/purchase/airtime" className="hover:text-green-400">Buy Airtime</Link></li>
              <li><Link href="/purchase/data" className="hover:text-green-400">Buy Data</Link></li>
              <li><Link href="/purchase/number" className="hover:text-green-400">Virtual Numbers</Link></li>
              <li><Link href="/purchase/social" className="hover:text-green-400">Social Logs</Link></li>
              <li><Link href="/purchase/boost" className="hover:text-green-400">Social Boost</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-black uppercase tracking-[0.18em] text-white">
              Company
            </h4>
            <ul className="mt-5 space-y-3 text-sm font-medium text-slate-400">
              <li><Link href="/about" className="hover:text-green-400">About S.O.J</Link></li>
              <li><Link href="/faq" className="hover:text-green-400">Help Center</Link></li>
              <li><Link href="/contact" className="hover:text-green-400">Contact</Link></li>
              <li><Link href="/terms" className="hover:text-green-400">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-green-400">Privacy Policy</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-black uppercase tracking-[0.18em] text-white">
              Support
            </h4>

            <div className="mt-5 space-y-4 text-sm text-slate-400">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5">
                  <Mail className="h-4 w-4 text-green-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Email</p>
                  <p className="mt-1 font-medium text-slate-300">support@sojvtu.com</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5">
                  <MessageCircle className="h-4 w-4 text-green-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">WhatsApp</p>
                  <p className="mt-1 font-medium text-slate-300">+234 912 096 4447</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-white/10 pt-7 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} S.O.J VTU Hub Nigeria. All rights reserved.
          </p>
          <p className="flex items-center gap-1">
            Powered by OLUWADARE Samuel Ayomide
            <ArrowUpRight className="h-3 w-3" />
          </p>
        </div>
      </div>
    </footer>
  );
}
