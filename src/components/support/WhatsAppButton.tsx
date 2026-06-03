"use client";

import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function WhatsAppButton() {
  const handleSupport = () => {
    // Placeholder WhatsApp link
    window.open('https://wa.me/1234567890?text=Hello%20VirtuLink%20Support!%20I%20need%20help%20with%20an%20order.', '_blank');
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button
        onClick={handleSupport}
        className="rounded-full h-14 w-14 bg-[#25D366] hover:bg-[#128C7E] shadow-xl transition-all hover:scale-110 active:scale-95"
      >
        <MessageCircle className="h-7 w-7 text-white fill-current" />
      </Button>
    </div>
  );
}