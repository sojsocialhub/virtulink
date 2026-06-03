'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';

export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handleError = (error: FirestorePermissionError) => {
      // In production, we might just show a generic toast.
      // In development, the agent loop uses this to fix security rules.
      toast({
        variant: 'destructive',
        title: 'Permission Error',
        description: error.message,
      });
      
      // We throw the error so it shows up in the Next.js development overlay
      // if we are in development mode.
      if (process.env.NODE_ENV === 'development') {
        throw error;
      }
    };

    errorEmitter.on('permission-error', handleError);
    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, [toast]);

  return null;
}
