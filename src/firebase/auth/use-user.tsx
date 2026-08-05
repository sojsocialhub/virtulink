'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged, User, AuthError } from 'firebase/auth';
import { useAuth } from '../provider';

/**
 * Hook to manage and provide the current Firebase Authentication user.
 * Handles loading states and potential network errors during auth state transitions.
 */
export function useUser() {
  const auth = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        setUser(user);
        setLoading(false);
      },
      (error: AuthError) => {
        // Log network errors specifically but don't crash the hook
        if (error.code === 'auth/network-request-failed') {
          console.error('Firebase Auth Network Error: Please check your internet connection or if the domain is authorized.');
        } else {
          console.error('Auth state change error:', error);
        }
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [auth]);

  return { user, loading };
}
