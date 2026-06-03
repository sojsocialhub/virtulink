
export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-20 max-w-3xl space-y-8">
      <h1 className="text-4xl font-black font-headline">Terms of Service</h1>
      <p className="text-muted-foreground">Last updated: May 2024</p>
      
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">1. Agreement to Terms</h2>
        <p className="text-muted-foreground leading-relaxed">
          By accessing S.O.J VTU Hub, you agree to be bound by these Terms of Service. If you do not agree, please do not use our services.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">2. Wallet & Payments</h2>
        <p className="text-muted-foreground leading-relaxed">
          - All wallet funding via manual transfer must be accompanied by proof of payment.<br/>
          - Funds added to the wallet are non-refundable except under our specific Refund Policy conditions.<br/>
          - S.O.J VTU is not responsible for money sent to the wrong bank account details. Always use the details provided on the 'Fund Wallet' page.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">3. Product Delivery</h2>
        <p className="text-muted-foreground leading-relaxed">
          - Digital products (Airtime, Data, Numbers, Logs) are delivered instantly or within a maximum of 30 minutes for manual verification.<br/>
          - Ensure the recipient phone number or email is correct. S.O.J VTU cannot reverse successful transactions sent to the wrong number.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">4. Prohibited Uses</h2>
        <p className="text-muted-foreground leading-relaxed">
          Users are strictly prohibited from using our digital products for fraudulent activities, spamming, or any illegal acts under Nigerian law.
        </p>
      </section>
    </div>
  );
}
