import Link from 'next/link';
import {
  ArrowRight,
  Smartphone,
  ShieldCheck,
  Zap,
  Phone,
  Database,
  MessageSquare,
  Rocket,
  Wallet,
  CheckCircle2,
  Headphones,
  Sparkles,
} from 'lucide-react';

export default function Home() {
  const services = [
    {
      icon: Smartphone,
      title: 'Airtime & Data',
      description: 'Recharge any supported network and get your data delivered quickly.',
      href: '/dashboard',
      tag: 'VTU',
    },
    {
      icon: Phone,
      title: 'Virtual Numbers',
      description: 'Get virtual phone numbers for supported online verification services.',
      href: '/purchase/number',
      tag: 'VERIFY',
    },
    {
      icon: MessageSquare,
      title: 'Social Logs',
      description: 'Browse available social media products from your S.O.J wallet.',
      href: '/purchase/social',
      tag: 'SOCIAL',
    },
    {
      icon: Rocket,
      title: 'Social Boost',
      description: 'Boost your social media presence with available promotion services.',
      href: '/purchase/boost',
      tag: 'BOOST',
    },
  ];

  const benefits = [
    {
      icon: Zap,
      title: 'Fast Delivery',
      description: 'Orders are designed to move quickly so you can get back to what matters.',
    },
    {
      icon: ShieldCheck,
      title: 'Secure Wallet',
      description: 'Your account and wallet transactions are handled through secure systems.',
    },
    {
      icon: Wallet,
      title: 'One Wallet',
      description: 'Fund once and use your balance across the services available on S.O.J.',
    },
    {
      icon: Headphones,
      title: 'Customer Support',
      description: 'Need help? Our support channel is available when you need assistance.',
    },
  ];

  return (
    <div className="overflow-hidden bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(34,197,94,0.20),transparent_35%),radial-gradient(circle_at_15%_80%,rgba(34,197,94,0.12),transparent_30%)]" />
        <div className="absolute -right-32 top-20 h-80 w-80 rounded-full border border-green-500/10" />
        <div className="absolute -right-20 top-32 h-56 w-56 rounded-full border border-green-500/10" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 sm:px-8 lg:grid-cols-2 lg:px-10 lg:py-28">
          <div className="max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-green-400/20 bg-green-400/10 px-4 py-2 text-sm font-semibold text-green-300">
              <Sparkles className="h-4 w-4" />
              Your trusted digital service hub
            </div>

            <h1 className="text-4xl font-black leading-[1.08] tracking-tight sm:text-5xl lg:text-7xl">
              Everything you need.
              <span className="block text-green-400">One secure wallet.</span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
              Buy airtime and data, access virtual numbers, social products and
              boosting services from one simple S.O.J platform.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex h-12 items-center justify-center rounded-xl bg-green-500 px-7 font-bold text-white shadow-lg shadow-green-500/20 transition hover:bg-green-400"
              >
                Create Free Account
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>

              <Link
                href="/login"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-white/15 bg-white/5 px-7 font-bold text-white transition hover:bg-white/10"
              >
                Login to Account
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-400">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-400" />
                Simple wallet system
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-400" />
                Fast transactions
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-400" />
                Support available
              </span>
            </div>
          </div>

          {/* Hero service card */}
          <div className="relative mx-auto w-full max-w-md lg:ml-auto">
            <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-4 shadow-2xl backdrop-blur-xl">
              <div className="rounded-2xl bg-white p-5 text-slate-900 shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      S.O.J Wallet
                    </p>
                    <p className="mt-1 text-2xl font-black">₦0.00</p>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-100">
                    <Wallet className="h-5 w-5 text-green-600" />
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-slate-50 p-4">
                    <Smartphone className="h-5 w-5 text-green-600" />
                    <p className="mt-3 text-sm font-bold">Airtime</p>
                    <p className="mt-1 text-xs text-slate-400">Recharge</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-4">
                    <Database className="h-5 w-5 text-green-600" />
                    <p className="mt-3 text-sm font-bold">Data</p>
                    <p className="mt-1 text-xs text-slate-400">Bundles</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-4">
                    <Phone className="h-5 w-5 text-green-600" />
                    <p className="mt-3 text-sm font-bold">Numbers</p>
                    <p className="mt-1 text-xs text-slate-400">Verification</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-4">
                    <Rocket className="h-5 w-5 text-green-600" />
                    <p className="mt-3 text-sm font-bold">Boost</p>
                    <p className="mt-1 text-xs text-slate-400">Social growth</p>
                  </div>
                </div>

                <Link
                  href="/register"
                  className="mt-4 flex h-11 items-center justify-center rounded-xl bg-slate-950 text-sm font-bold text-white transition hover:bg-green-600"
                >
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="bg-slate-50 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-sm font-black uppercase tracking-[0.2em] text-green-600">
              Our Services
            </span>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Everything in one place
            </h2>
            <p className="mt-4 text-slate-500">
              Access the digital services you need through one simple S.O.J account.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {services.map((service) => {
              const Icon = service.icon;

              return (
                <Link
                  key={service.title}
                  href={service.href}
                  className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-green-200 hover:shadow-xl"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-green-600 transition group-hover:bg-green-600 group-hover:text-white">
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black tracking-wider text-slate-500">
                      {service.tag}
                    </span>
                  </div>

                  <h3 className="mt-6 text-lg font-black text-slate-950">
                    {service.title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {service.description}
                  </p>

                  <div className="mt-5 flex items-center text-sm font-bold text-green-600">
                    Explore service
                    <ArrowRight className="ml-2 h-4 w-4 transition group-hover:translate-x-1" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Trust / Benefits */}
      <section className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <span className="text-sm font-black uppercase tracking-[0.2em] text-green-600">
                Why S.O.J
              </span>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                Built for simple, reliable digital transactions.
              </h2>
              <p className="mt-5 leading-7 text-slate-500">
                We keep the experience straightforward: fund your wallet,
                choose a service and complete your order.
              </p>

              <Link
                href="/about"
                className="mt-7 inline-flex items-center font-bold text-green-600 hover:text-green-700"
              >
                Learn more about S.O.J
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {benefits.map((benefit) => {
                const Icon = benefit.icon;

                return (
                  <div
                    key={benefit.title}
                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-950 text-green-400">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-5 font-black text-slate-950">
                      {benefit.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {benefit.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-slate-950 py-20 text-white sm:py-24">
        <div className="mx-auto max-w-6xl px-5 text-center sm:px-8">
          <span className="text-sm font-black uppercase tracking-[0.2em] text-green-400">
            How It Works
          </span>
          <h2 className="mt-3 text-3xl font-black sm:text-4xl">
            Get started in three simple steps
          </h2>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {[
              ['01', 'Create an account', 'Register your S.O.J account in a few moments.'],
              ['02', 'Fund your wallet', 'Add money to your wallet using the available funding option.'],
              ['03', 'Choose a service', 'Select what you need and complete your transaction.'],
            ].map(([number, title, description]) => (
              <div key={number} className="relative">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-green-500 text-lg font-black shadow-lg shadow-green-500/20">
                  {number}
                </div>
                <h3 className="mt-5 text-lg font-black">{title}</h3>
                <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-slate-400">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-green-600 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-5 text-center sm:px-8">
          <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
            Ready to get started?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-green-50">
            Join S.O.J and manage your digital services from one convenient wallet.
          </p>

          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex h-12 items-center justify-center rounded-xl bg-white px-7 font-bold text-green-700 transition hover:bg-green-50"
            >
              Create Account
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex h-12 items-center justify-center rounded-xl border border-white/30 bg-white/10 px-7 font-bold text-white transition hover:bg-white/20"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
