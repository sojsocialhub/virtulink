
"use client";

import { useMemo, useState } from 'react';
import { User, Mail, Shield, Calendar, Key, UserCircle, Loader2 } from 'lucide-react';
import { useDoc, useFirestore, useUser } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function ProfilePage() {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

  const userDocRef = useMemo(() => (db && user ? doc(db, 'users', user.uid) : null), [db, user]);
  const { data: userData, loading } = useDoc(userDocRef);

  const [name, setName] = useState(userData?.name || '');

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userDocRef) return;
    
    setIsUpdating(true);
    try {
      await updateDoc(userDocRef, { name });
      toast({ title: "Profile Updated", description: "Your display name has been changed." });
    } catch (error) {
      toast({ variant: "destructive", title: "Update Failed", description: "Could not save profile changes." });
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) return <div className="flex-1 flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="flex items-center gap-4 mb-8">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary border-2 border-primary/20 shadow-inner">
          <User className="h-8 w-8" />
        </div>
        <div>
          <h1 className="text-3xl font-black font-headline">My Account</h1>
          <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px]">Manage your S.O.J VTU profile</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-none ring-1 ring-border shadow-sm">
            <CardHeader className="bg-muted/30 border-b">
              <CardTitle className="text-sm uppercase tracking-wider font-black">Account Info</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Email Address</Label>
                <div className="flex items-center gap-2 text-sm font-bold">
                  <Mail className="h-4 w-4 text-primary" /> {userData?.email}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Account Status</Label>
                <div className="flex items-center gap-2 text-sm font-bold text-green-600">
                  <Shield className="h-4 w-4" /> Verified User
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Joined On</Label>
                <div className="flex items-center gap-2 text-sm font-bold">
                  <Calendar className="h-4 w-4 text-muted-foreground" /> 
                  {userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString() : 'N/A'}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none ring-1 ring-border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCircle className="h-5 w-5 text-primary" /> Personal Information
              </CardTitle>
              <CardDescription>Update your public display name</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input 
                    placeholder="Enter your name" 
                    defaultValue={userData?.name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <Button disabled={isUpdating} className="font-bold">
                  {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-none ring-1 ring-border shadow-sm bg-red-50/20 border-red-100">
            <CardHeader>
              <CardTitle className="text-red-700 flex items-center gap-2">
                <Key className="h-5 w-5" /> Security
              </CardTitle>
              <CardDescription>Change your login credentials</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground italic">
                Need to change your password? Click the button below to receive a reset link in your email.
              </p>
              <Button variant="outline" className="border-red-200 text-red-700 hover:bg-red-50 font-bold">
                Send Password Reset Email
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
