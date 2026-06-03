
import Link from 'next/link';
import { ArrowRight, Zap, ShieldCheck, CreditCard, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 className="text-5xl lg:text-7xl font-bold font-headline leading-tight">
              Instant Top-Up, <br/><span className="text-secondary-foreground bg-secondary px-2 rounded-lg">Limitless Access.</span>
            </h1>
            <p className="text-xl text-primary-foreground/80 max-w-xl">
              Buy data, airtime, social logs, and virtual numbers instantly on S.O.J VERIFY SMS VTU Hub. Secure, fast, and reliable.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/dashboard">
                <Button size="lg" className="bg-white hover:bg-white/90 text-primary font-bold px-8">
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/faq">
                <Button size="lg" variant="outline" className="border-white/20 hover:bg-white/10 text-white">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
           <Smartphone className="w-96 h-96" />
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-border transition-all hover:shadow-md">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Lightning Fast</h3>
              <p className="text-muted-foreground">Transactions are processed instantly. No waiting around for your data or airtime.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-border transition-all hover:shadow-md">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Secure Wallet</h3>
              <p className="text-muted-foreground">Your funds are safe with us. We use advanced encryption for every single transaction.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-border transition-all hover:shadow-md">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                <CreditCard className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Easy Funding</h3>
              <p className="text-muted-foreground">Fund your wallet via simple bank transfers and get credited quickly by our team.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
