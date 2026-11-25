import {
  RECENT_SCHEMA_VERSION,
  ScriptError,
  type DocumentRepository,
  type FileAccess,
  type HandleRepository,
  type OpenedFile,
  type RecentScript,
  type RecentsRepository,
  type ScriptSummary,
} from "./types";

export const MAX_RECENTS = 20;

export interface ScriptServiceDeps {
  recents: RecentsRepository;
  documents: DocumentRepository;
  handles: HandleRepository;
  files: FileAccess;
  /** Derives title, page count and preview from text (injected to keep storage free of parsing). */
  summarize(text: string, fileName: string): ScriptSummary;
  now?: () => number;
  createId?: () => string;
}

export interface LoadedScript {
  meta: RecentScript;
  text: string;
}

export interface SaveOutcome {
  /** `file` when written to disk, `download` when the browser downloaded a copy. */
  target: "file" | "download";
  fileName: string;
}

export interface ScriptService {
  /** True when saves can go back to the original file. */
  readonly canSaveInPlace: boolean;
  listRecents(): Promise<RecentScript[]>;
  removeRecent(id: string): Promise<void>;
  /** Shows the open picker and imports the chosen file. Null when cancelled. */
  openWithPicker(): Promise<RecentScript | null>;
  importFile(file: OpenedFile): Promise<RecentScript>;
  createScript(text: string, fileName: string): Promise<RecentScript>;
  /** Re-reads a recent script from disk when permitted (call from a user gesture). */
  reopen(id: string): Promise<RecentScript>;
  load(id: string): Promise<LoadedScript | null>;
  autosave(id: string, text: string): Promise<RecentScript>;
  save(id: string, text: string, options?: { saveAs?: boolean }): Promise<SaveOutcome | null>;
}

const sizeOf = (text: string) => new Blob([text]).size;

/**
 * Application service for scripts: coordinates repositories and file access.
 * Depends only on interfaces, so every collaborator can be swapped in tests.
 */
export function createScriptService(deps: ScriptServiceDeps): ScriptService {
  const { recents, documents, handles, files, summarize } = deps;
  const now = deps.now ?? Date.now;
  const createId = deps.createId ?? (() => crypto.randomUUID());

  const getMeta = async (id: string) => {
    const meta = await recents.get(id);
    if (!meta) throw new ScriptError("not_found", "This script is no longer in your recent list.");
    return meta;
  };

  const forget = async (id: string) => {
    await Promise.all([recents.remove(id), documents.remove(id), handles.remove(id)]);
  };

  const prune = async () => {
    const all = await recents.list();
    await Promise.all(all.slice(MAX_RECENTS).map((entry) => forget(entry.id)));
  };

  /** Finds an existing recent entry for the same file, to avoid duplicates. */
  const findExisting = async (file: OpenedFile) => {
    for (const entry of await recents.list()) {
      if (file.handle && entry.hasHandle) {
        const stored = await handles.get(entry.id);
        if (stored && (await stored.isSameEntry(file.handle))) return entry;
      } else if (!file.handle && !entry.hasHandle && entry.fileName === file.name) {
        return entry;
      }
    }
    return undefined;
  };

  const record = async (id: string, text: string, fileName: string, patch: Partial<RecentScript>) => {
    const previous = await recents.get(id);
    const timestamp = now();
    const entry: RecentScript = {
      schemaVersion: RECENT_SCHEMA_VERSION,
      id,
      fileName,
      lastOpenedAt: previous?.lastOpenedAt ?? timestamp,
      lastEditedAt: previous?.lastEditedAt ?? timestamp,
      hasHandle: previous?.hasHandle ?? false,
      sizeBytes: sizeOf(text),
      ...summarize(text, fileName),
      ...patch,
    };
    await documents.save(id, text);
    await recents.put(entry);
    return entry;
  };

  const service: ScriptService = {
    canSaveInPlace: Boolean(files.handles),

    listRecents: () => recents.list(),

    removeRecent: forget,

    async openWithPicker() {
      const file = await files.open();
      return file ? service.importFile(file) : null;
    },

    async importFile(file) {
      const existing = await findExisting(file);
      const id = existing?.id ?? createId();
      if (file.handle) await handles.set(id, file.handle);
      const entry = await record(id, file.text, file.name, {
        lastOpenedAt: now(),
        hasHandle: Boolean(file.handle) || (existing?.hasHandle ?? false),
      });
      await prune();
      return entry;
    },

    async createScript(text, fileName) {
      const entry = await record(createId(), text, fileName, { lastOpenedAt: now(), hasHandle: false });
      await prune();
      return entry;
    },

    async reopen(id) {
      const meta = await getMeta(id);
      const handle = meta.hasHandle ? await handles.get(id) : undefined;
      if (handle && files.handles && (await files.handles.ensurePermission(handle, "readwrite"))) {
        try {
          const file = await files.handles.read(handle);
          return await record(id, file.text, file.name, { lastOpenedAt: now() });
        } catch {
          // File moved or deleted on disk: fall back to the stored snapshot.
        }
      }
      const entry = { ...meta, lastOpenedAt: now() };
      await recents.put(entry);
      return entry;
    },

    async load(id) {
      const [meta, text] = await Promise.all([recents.get(id), documents.load(id)]);
      return meta && text !== undefined ? { meta, text } : null;
    },

    async autosave(id, text) {
      const meta = await getMeta(id);
      return record(id, text, meta.fileName, { lastEditedAt: now() });
    },

    async save(id, text, options = {}) {
      const meta = await getMeta(id);
      const handle = !options.saveAs && meta.hasHandle ? await handles.get(id) : undefined;

      if (handle && files.handles) {
        if (!(await files.handles.ensurePermission(handle, "readwrite"))) {
          throw new ScriptError("permission_denied", "Permission to save to this file was denied.");
        }
        await files.handles.write(handle, text);
        await record(id, text, meta.fileName, { lastEditedAt: now() });
        return { target: "file", fileName: meta.fileName };
      }

      const saved = await files.saveAs(text, meta.fileName);
      if (!saved) return null;
      if (saved.handle) await handles.set(id, saved.handle);
      await record(id, text, saved.fileName, { lastEditedAt: now(), hasHandle: Boolean(saved.handle) || meta.hasHandle });
      return { target: saved.handle ? "file" : "download", fileName: saved.fileName };
    },
  };

  return service;
}
