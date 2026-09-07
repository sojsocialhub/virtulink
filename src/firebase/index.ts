'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import {
  getAuth,
  Auth,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import { firebaseConfig } from './config';

let firebaseApp: FirebaseApp | undefined;
let firestore: Firestore | undefined;
let auth: Auth | undefined;
let persistenceConfigured = false;

export function initializeFirebase() {
  if (typeof window === 'undefined') {
    return {
      firebaseApp: null,
      firestore: null,
      auth: null,
    };
  }

  if (!firebaseApp) {
    firebaseApp =
      getApps().length > 0
        ? getApp()
        : initializeApp(firebaseConfig);
  }

  if (!firestore) {
    firestore = getFirestore(firebaseApp);
  }

  if (!auth) {
    auth = getAuth(firebaseApp);
  }

  if (!persistenceConfigured) {
    persistenceConfigured = true;

    setPersistence(auth, browserLocalPersistence).catch((error) => {
      console.error('Firebase Auth persistence setup failed:', error);
    });
  }

  return {
    firebaseApp,
    firestore,
    auth,
  };
}

export * from './provider';
export * from './client-provider';
export * from './auth/use-user';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './hooks/use-memo-firebase';
