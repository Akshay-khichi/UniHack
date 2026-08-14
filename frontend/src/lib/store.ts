import { useSyncExternalStore } from "react";

/**
 * Minimal reactive store used by the mock service layer.
 * When the REST API lands, services keep the same signatures and this store
 * is replaced by TanStack Query caches.
 */
export function createStore<T>(initial: T) {
  let state = initial;
  const listeners = new Set<() => void>();

  return {
    get: () => state,
    set: (next: T) => {
      state = next;
      listeners.forEach((l) => l());
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export type Store<T> = ReturnType<typeof createStore<T>>;

export function useStore<T>(store: Store<T>): T {
  return useSyncExternalStore(store.subscribe, store.get, store.get);
}

export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
