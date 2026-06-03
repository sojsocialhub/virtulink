import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const FAQS = [
  {
    q: "How fast do I receive my virtual number after payment?",
    a: "Once you upload your proof of payment, our team reviews it within 15-30 minutes during business hours. After verification, your product details are sent instantly to your dashboard."
  },
  {
    q: "Do your virtual numbers support OTP for Telegram/WhatsApp?",
    a: "Yes, our premium virtual numbers are specifically selected to support major platforms like WhatsApp, Telegram, and Google verification."
  },
  {
    q: "Can I use the eSIM in multiple countries?",
    a: "Depending on the plan you choose. Our 'Europe Travel' eSIM works across all EU countries seamlessly. Regional and local plans are also available."
  },
  {
    q: "What payment methods do you accept?",
    a: "We currently prioritize Bank Transfers to keep our fees low for customers. Simply follow the instructions at checkout and upload your screenshot."
  },
  {
    q: "Do you offer a refund if the service doesn't work?",
    a: "Yes, we have a 100% money-back guarantee if the digital product fails to activate as described. Contact our WhatsApp support for immediate assistance."
  }
];

export default function FAQPage() {
  return (
    <div className="container mx-auto px-4 py-20 max-w-3xl">
      <header className="text-center mb-16 space-y-4">
        <h1 className="text-4xl lg:text-5xl font-bold font-headline">Frequently Asked Questions</h1>
        <p className="text-muted-foreground text-lg">
          Everything you need to know about our services and delivery process.
        </p>
      </header>

      <div className="bg-card rounded-2xl ring-1 ring-border p-8 shadow-sm">
        <Accordion type="single" collapsible className="w-full space-y-2">
          {FAQS.map((faq, i) => (
            <AccordionItem key={i} value={`item-${i}`} className="border-none ring-1 ring-border rounded-lg px-4 hover:ring-primary/30 transition-all">
              <AccordionTrigger className="text-lg font-bold text-left hover:no-underline py-6">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-base pb-6 leading-relaxed">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      <div className="mt-16 text-center p-10 rounded-2xl bg-primary text-primary-foreground">
        <h3 className="text-2xl font-bold mb-4">Still have questions?</h3>
        <p className="mb-8 opacity-80">Our support team is available 24/7 to help you with your order.</p>
        <button className="bg-accent text-accent-foreground font-bold py-3 px-8 rounded-full hover:bg-accent/90 transition-colors">
          Contact Support on WhatsApp
        </button>
      </div>
    </div>
  );
}