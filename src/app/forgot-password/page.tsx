"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, KeyRound, Loader2, Mail } from "lucide-react";
import { sendPasswordResetEmail } from "firebase/auth";
import { useAuth } from "@/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function ForgotPasswordPage() {
  const auth = useAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!auth) {
      toast({
        variant: "destructive",
        title: "Request Failed",
        description: "Unable to connect right now. Please try again."
      });
      return;
    }

    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email.trim());

      toast({
        title: "Reset Email Sent",
        description: "If this email is registered, check your inbox and follow the instructions."
      });

      setEmail("");
    } catch (error: any) {
      let message = "Unable to send the reset email. Please try again.";

      if (error?.code === "auth/network-request-failed") {
        message = "Unable to connect. Please check your internet connection and try again.";
      } else if (error?.code === "auth/too-many-requests") {
        message = "Too many requests. Please wait a moment and try again.";
      }

      toast({
        variant: "destructive",
        title: "Request Failed",
        description: message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 py-12">
      <Card className="w-full max-w-md border-none ring-1 ring-border shadow-2xl">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center mb-3">
            <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <KeyRound className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>

          <CardTitle className="text-2xl font-black font-headline">
            Reset Password
          </CardTitle>

          <CardDescription>
            Enter your email address and we'll send you instructions to reset your password.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleReset} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>

              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 font-bold"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Reset Instructions"
              )}
            </Button>

            <Link
              href="/login"
              className="flex items-center justify-center text-sm font-bold text-primary hover:underline"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Login
            </Link>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
