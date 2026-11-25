import { del, get, set, values, type UseStore } from "idb-keyval";
import { RECENT_SCHEMA_VERSION, type DocumentRepository, type HandleRepository, type RecentScript, type RecentsRepository } from "./types";

/** IndexedDB-backed recents, newest first. Unknown schema versions are skipped. */
export function createRecentsRepository(store: UseStore): RecentsRepository {
  return {
    async list() {
      const all = await values<RecentScript>(store);
      return all.filter((entry) => entry.schemaVersion === RECENT_SCHEMA_VERSION).sort((a, b) => b.lastOpenedAt - a.lastOpenedAt);
    },
    get: (id) => get<RecentScript>(id, store),
    put: (entry) => set(entry.id, entry, store),
    remove: (id) => del(id, store),
  };
}

export function createDocumentRepository(store: UseStore): DocumentRepository {
  return {
    load: (id) => get<string>(id, store),
    save: (id, text) => set(id, text, store),
    remove: (id) => del(id, store),
  };
}

export function createHandleRepository(store: UseStore): HandleRepository {
  return {
    get: (id) => get<FileSystemFileHandle>(id, store),
    set: (id, handle) => set(id, handle, store),
    remove: (id) => del(id, store),
  };
}
