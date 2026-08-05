'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import { initializeFirebase } from './index';
import { FirebaseProvider } from './provider';
import { FirebaseApp } from 'firebase/app';
import { Firestore } from 'firebase/firestore';
import { Auth } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

export function FirebaseClientProvider({ children }: { children: ReactNode }) {
  const [instances, setInstances] = useState<{
    firebaseApp: FirebaseApp;
    firestore: Firestore;
    auth: Auth;
  } | null>(null);

  useEffect(() => {
    // initializeFirebase is now robust against multiple calls
    const results = initializeFirebase();
    if (results.firebaseApp) {
      setInstances(results as { firebaseApp: FirebaseApp; firestore: Firestore; auth: Auth });
    }
  }, []);

  // Show a clean loader while Firebase initializes to prevent race conditions in components
  if (!instances) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground font-medium animate-pulse">Initializing Security Hub...</p>
        </div>
      </div>
    );
  }

  return (
    <FirebaseProvider
      firebaseApp={instances.firebaseApp}
      firestore={instances.firestore}
      auth={instances.auth}
    >
      <FirebaseErrorListener />
      {children}
    </FirebaseProvider>
  );
}
