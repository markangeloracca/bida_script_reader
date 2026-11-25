/**
 * Storage facade: the only entry point the rest of the app uses for
 * persistence and file access.
 */
import { getTitle, paginate, parseFountain, toPlainText, type Token } from "@/lib/fountain";
import { createDownloadAdapter, downloadText } from "./adapters/download-adapter";
import { createFsAccessAdapter, supportsFileSystemAccess } from "./adapters/fs-access-adapter";
import { getStores } from "./db";
import { createDocumentRepository, createHandleRepository, createRecentsRepository } from "./repositories";
import { createScriptService, type ScriptService } from "./script-service";
import type { FileAccess, ScriptSummary } from "./types";

export * from "./types";
export { readFile, isFountainFileName } from "./read-file";
export { downloadText };
export { MAX_RECENTS, type LoadedScript, type SaveOutcome, type ScriptService } from "./script-service";

const PREVIEW_LENGTH = 200;
const PREVIEW_TYPES = new Set<Token["type"]>(["scene_heading", "action", "dialogue", "centered", "transition", "lyrics"]);

/** Title, page count and preview snippet for the recents list. */
export function summarizeScript(text: string, fileName: string): ScriptSummary {
  const script = parseFountain(text);
  const body = script.tokens
    .flatMap((token) => (PREVIEW_TYPES.has(token.type) && "text" in token ? [toPlainText(token.text)] : []))
    .join(" ")
    .slice(0, PREVIEW_LENGTH);
  return {
    title: getTitle(script.titlePage, fileName.replace(/\.[^.]+$/, "")),
    pageCount: paginate(script.tokens).length,
    preview: body,
  };
}

/** Picks the best file adapter for this browser (Adapter + Strategy). */
export function createFileAccess(): FileAccess {
  return supportsFileSystemAccess() ? createFsAccessAdapter() : createDownloadAdapter();
}

/** Builds the production script service backed by IndexedDB. */
export function createBrowserScriptService(): ScriptService {
  const stores = getStores();
  return createScriptService({
    recents: createRecentsRepository(stores.recents),
    documents: createDocumentRepository(stores.documents),
    handles: createHandleRepository(stores.handles),
    files: createFileAccess(),
    summarize: summarizeScript,
  });
}
