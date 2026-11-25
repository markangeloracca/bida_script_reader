/**
 * Storage contracts. UI and state code depend on these interfaces only
 * (Dependency Inversion); IndexedDB and browser file APIs live behind them.
 */

export const RECENT_SCHEMA_VERSION = 1;

/** Metadata for one entry in the recent-scripts list. */
export interface RecentScript {
  schemaVersion: typeof RECENT_SCHEMA_VERSION;
  id: string;
  title: string;
  fileName: string;
  lastOpenedAt: number;
  lastEditedAt: number;
  sizeBytes: number;
  pageCount: number;
  /** First characters of the script body, for the recents card. */
  preview: string;
  /** True when a file handle is stored, so saves can go back to the original file. */
  hasHandle: boolean;
}

export interface RecentsRepository {
  list(): Promise<RecentScript[]>;
  get(id: string): Promise<RecentScript | undefined>;
  put(entry: RecentScript): Promise<void>;
  remove(id: string): Promise<void>;
}

/** Latest text snapshot of each script (autosave). */
export interface DocumentRepository {
  load(id: string): Promise<string | undefined>;
  save(id: string, text: string): Promise<void>;
  remove(id: string): Promise<void>;
}

/** Persisted File System Access handles (structured-cloneable). */
export interface HandleRepository {
  get(id: string): Promise<FileSystemFileHandle | undefined>;
  set(id: string, handle: FileSystemFileHandle): Promise<void>;
  remove(id: string): Promise<void>;
}

/** A file the user opened, regardless of how it was opened. */
export interface OpenedFile {
  name: string;
  text: string;
  sizeBytes: number;
  handle?: FileSystemFileHandle;
  /** True when the file was not valid UTF-8 and a fallback decoder was used. */
  lossyDecode?: boolean;
}

export interface SavedFile {
  fileName: string;
  /** Present when the save target can be written to again later. */
  handle?: FileSystemFileHandle;
}

export interface FileOpener {
  /** Shows a file picker. Resolves to null when the user cancels. */
  open(): Promise<OpenedFile | null>;
}

export interface FileSaver {
  /** Saves to a new location. Resolves to null when the user cancels. */
  saveAs(text: string, suggestedName: string): Promise<SavedFile | null>;
}

/** Read/write access through a persisted handle (File System Access API only). */
export interface HandleFileIO {
  ensurePermission(handle: FileSystemFileHandle, mode: "read" | "readwrite"): Promise<boolean>;
  read(handle: FileSystemFileHandle): Promise<OpenedFile>;
  write(handle: FileSystemFileHandle, text: string): Promise<void>;
}

/** A file-access adapter: always opens and saves, optionally supports handles. */
export interface FileAccess extends FileOpener, FileSaver {
  readonly handles?: HandleFileIO;
}

/** Derived, display-only facts about a script's text. */
export interface ScriptSummary {
  title: string;
  pageCount: number;
  preview: string;
}

export type ScriptErrorCode = "not_found" | "permission_denied" | "unsupported_file" | "storage_unavailable" | "write_failed";

export class ScriptError extends Error {
  constructor(
    readonly code: ScriptErrorCode,
    message: string,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = "ScriptError";
  }
}
