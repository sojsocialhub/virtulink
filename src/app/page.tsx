import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Shield, Zap, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { INITIAL_PRODUCTS } from '@/lib/data';
import ProductCard from '@/components/products/ProductCard';

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 className="text-5xl lg:text-7xl font-bold font-headline leading-tight">
              Global Connectivity, <span className="text-accent">Redefined.</span>
            </h1>
            <p className="text-xl text-primary-foreground/80 max-w-xl">
              Instant access to premium virtual numbers, eSIM data plans, and secure VPN subscriptions for a borderless digital experience.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/products">
                <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold px-8">
                  Browse Products
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/faq">
                <Button size="lg" variant="outline" className="border-primary-foreground/20 hover:bg-primary-foreground/10 text-primary-foreground">
                  Learn How it Works
                </Button>
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-1/3 hidden lg:block opacity-20">
          <Image
            src="https://picsum.photos/seed/virtulink1/1200/600"
            alt="Hero background"
            fill
            className="object-cover"
            priority
            data-ai-hint="digital connectivity"
          />
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-card/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="flex flex-col items-center text-center space-y-4 p-6 rounded-2xl bg-background shadow-sm border border-border">
              <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <Zap className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-xl font-bold">Instant Activation</h3>
              <p className="text-muted-foreground text-sm">Receive your digital products within minutes of payment verification.</p>
            </div>
            <div className="flex flex-col items-center text-center space-y-4 p-6 rounded-2xl bg-background shadow-sm border border-border">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold">Secure Transactions</h3>
              <p className="text-muted-foreground text-sm">Trusted bank-level security for all your payment verification processes.</p>
            </div>
            <div className="flex flex-center flex-col items-center text-center space-y-4 p-6 rounded-2xl bg-background shadow-sm border border-border">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Globe className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold">Global Availability</h3>
              <p className="text-muted-foreground text-sm">Access virtual presence in over 150 countries instantly.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-bold font-headline mb-4">Our Top Digital Solutions</h2>
              <p className="text-muted-foreground">Pick from our curated selection of high-performance products.</p>
            </div>
            <Link href="/products" className="hidden sm:block">
              <Button variant="link" className="text-primary font-bold">
                View All Products <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {INITIAL_PRODUCTS.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}