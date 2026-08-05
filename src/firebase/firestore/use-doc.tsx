'use client';

import { useState, useEffect } from 'react';
import {
  onSnapshot,
  DocumentReference,
  DocumentData,
  DocumentSnapshot,
  FirestoreError,
} from 'firebase/firestore';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

export function useDoc<T = DocumentData>(ref: DocumentReference<T> | null) {
  const [state, setState] = useState<{
    data: (T & { id: string }) | null;
    loading: boolean;
    error: Error | null;
  }>({
    data: null,
    loading: !!ref,
    error: null,
  });

  useEffect(() => {
    if (!ref) {
      setState(prev => (prev.loading || prev.data ? { data: null, loading: false, error: null } : prev));
      return;
    }

    const unsubscribe = onSnapshot(
      ref,
      (snapshot: DocumentSnapshot<T>) => {
        setState({
          data: snapshot.exists() ? ({ ...snapshot.data()!, id: snapshot.id } as T & { id: string }) : null,
          loading: false,
          error: null,
        });
      },
      (err: FirestoreError) => {
        if (err.code === 'permission-denied') {
          const permissionError = new FirestorePermissionError({
            path: ref.path,
            operation: 'get',
          });
          errorEmitter.emit('permission-error', permissionError);
        } else {
          console.error('Firestore Document Error:', err);
        }
        setState(prev => ({ ...prev, loading: false, error: err }));
      }
    );

    return () => unsubscribe();
  }, [ref]);

  return state;
}
