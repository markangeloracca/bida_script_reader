import { createStore, type UseStore } from "idb-keyval";

/**
 * IndexedDB stores. Each idb-keyval store lives in its own database, which
 * keeps upgrades independent and avoids a hand-written migration path.
 */
export interface Stores {
  recents: UseStore;
  documents: UseStore;
  handles: UseStore;
}

let stores: Stores | undefined;

export function getStores(): Stores {
  stores ??= {
    recents: createStore("bida-recents", "recents"),
    documents: createStore("bida-documents", "documents"),
    handles: createStore("bida-handles", "handles"),
  };
  return stores;
}
