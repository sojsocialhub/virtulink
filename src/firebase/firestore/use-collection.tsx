'use client';

import { useState, useEffect } from 'react';
import {
  onSnapshot,
  Query,
  DocumentData,
  QuerySnapshot,
  FirestoreError,
} from 'firebase/firestore';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

export function useCollection<T = DocumentData>(query: Query<T> | null) {
  const [state, setState] = useState<{
    data: (T & { id: string })[];
    loading: boolean;
    error: Error | null;
  }>({
    data: [],
    loading: !!query,
    error: null,
  });

  useEffect(() => {
    if (!query) {
      setState(prev => (prev.loading || prev.data.length > 0 ? { data: [], loading: false, error: null } : prev));
      return;
    }

    const unsubscribe = onSnapshot(
      query,
      (snapshot: QuerySnapshot<T>) => {
        const items = snapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        } as T & { id: string }));
        setState({ data: items, loading: false, error: null });
      },
      (err: FirestoreError) => {
        if (err.code === 'permission-denied') {
          const permissionError = new FirestorePermissionError({
            path: (query as any)._query?.path?.toString() || 'unknown',
            operation: 'list',
          });
          errorEmitter.emit('permission-error', permissionError);
        } else {
          console.error('Firestore Collection Error:', err);
        }
        setState(prev => ({ ...prev, loading: false, error: err }));
      }
    );

    return () => unsubscribe();
  }, [query]);

  return state;
}
