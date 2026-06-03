
"use client";

import { Mail, Phone, MapPin, MessageCircle, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-20 max-w-6xl">
      <header className="text-center mb-16 space-y-4">
        <h1 className="text-4xl lg:text-5xl font-black font-headline">Get in Touch</h1>
        <p className="text-muted-foreground text-lg">Have questions? We're here to help you 24/7.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-none shadow-sm ring-1 ring-border">
            <CardContent className="p-8 space-y-8">
              <div className="flex items-start space-x-4">
                <div className="p-3 rounded-xl bg-primary/10 text-primary">
                  <Mail className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-bold">Email Us</h4>
                  <p className="text-sm text-muted-foreground">support@sojvtu.com</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="p-3 rounded-xl bg-green-100 text-green-600">
                  <MessageCircle className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-bold">WhatsApp Support</h4>
                  <p className="text-sm text-muted-foreground">+234 912 096 4447</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="p-3 rounded-xl bg-blue-100 text-blue-600">
                  <Phone className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-bold">Call Us</h4>
                  <p className="text-sm text-muted-foreground">Available Mon-Sat (9am - 6pm)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="border-none shadow-sm ring-1 ring-border overflow-hidden">
            <CardContent className="p-8">
              <form className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold">Your Name</label>
                    <Input placeholder="Enter your full name" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold">Email Address</label>
                    <Input type="email" placeholder="name@example.com" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold">Subject</label>
                  <Input placeholder="How can we help?" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold">Message</label>
                  <Textarea placeholder="Describe your issue or question in detail..." className="min-h-[150px]" />
                </div>
                <Button className="w-full h-12 font-bold text-lg">
                  <Send className="mr-2 h-4 w-4" /> Send Message
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
