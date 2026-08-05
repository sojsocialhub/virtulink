import { useMemo, DependencyList } from 'react';

/**
 * A specialized wrapper around useMemo for stabilizing Firestore references and queries.
 * This is critical to prevent infinite render loops when using hooks like useCollection or useDoc.
 */
export function useMemoFirebase<T>(factory: () => T, deps: DependencyList | undefined): T {
  return useMemo(factory, deps);
}
