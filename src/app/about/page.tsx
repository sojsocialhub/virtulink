
import { ShieldCheck, Zap, Heart, Globe } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-20 max-w-4xl">
      <header className="text-center mb-16 space-y-4">
        <h1 className="text-4xl lg:text-6xl font-black font-headline text-primary tracking-tight">
          Empowering Your Digital Life
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          S.O.J VTU Hub is Nigeria's most reliable platform for instant digital services, designed for simplicity and trust.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-20">
        <div className="space-y-6">
          <h2 className="text-3xl font-bold">Our Mission</h2>
          <p className="text-muted-foreground leading-relaxed text-lg">
            Our goal is to eliminate the stress of manual top-ups and disconnected digital services. We provide a 24/7 automated platform where anyone in Nigeria can access airtime, data, and international digital products with a single tap.
          </p>
          <p className="text-muted-foreground leading-relaxed text-lg">
            Under the leadership of Samuel Ayomide OLUWADARE, we've grown from a small service provider into a robust VTU hub serving thousands of satisfied users.
          </p>
        </div>
        <div className="bg-primary/5 rounded-3xl p-8 ring-1 ring-primary/20 aspect-square flex items-center justify-center">
          <Globe className="w-48 h-48 text-primary/40 animate-pulse" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
        {[
          { icon: Zap, title: "Speed", desc: "Transactions are processed in seconds." },
          { icon: ShieldCheck, title: "Security", desc: "Bank-grade encryption for your wallet." },
          { icon: Heart, title: "Support", desc: "24/7 dedicated customer assistance." }
        ].map((item, i) => (
          <div key={i} className="text-center space-y-3 p-6 rounded-2xl bg-card border border-border">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
              <item.icon className="h-6 w-6" />
            </div>
            <h4 className="font-bold text-lg">{item.title}</h4>
            <p className="text-sm text-muted-foreground">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
