import { ScriptError, type OpenedFile } from "./types";

export const ACCEPTED_EXTENSIONS = [".fountain", ".spmd", ".txt"] as const;

/** Largest file we will sniff when its name gives no hint (scripts are tiny). */
const MAX_UNNAMED_BYTES = 5 * 1024 * 1024;

export function isFountainFileName(name: string): boolean {
  const lower = name.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

const hasExtension = (name: string) => /\.[^./\\]+$/.test(name);

/** Decodes UTF-8, falling back to Windows-1252 for legacy files. */
export function decodeText(buffer: ArrayBuffer): { text: string; lossy: boolean } {
  try {
    return { text: new TextDecoder("utf-8", { fatal: true }).decode(buffer), lossy: false };
  } catch {
    return { text: new TextDecoder("windows-1252").decode(buffer), lossy: true };
  }
}

const unsupported = (name: string) => new ScriptError("unsupported_file", `“${name}” is not a Fountain file (.fountain, .spmd or .txt).`);

/**
 * Reads a browser `File` into an `OpenedFile`, validating its type.
 *
 * Files are accepted by extension. Mobile pickers can't filter by `.fountain`,
 * and some Android providers (Drive, Downloads) hand over names without an
 * extension, so an extension-less file is also accepted when its content is
 * plain UTF-8 text; it is then named `<name>.fountain`.
 */
export async function readFile(file: File, handle?: FileSystemFileHandle): Promise<OpenedFile> {
  if (isFountainFileName(file.name)) {
    const { text, lossy } = decodeText(await file.arrayBuffer());
    return { name: file.name, text, sizeBytes: file.size, handle, lossyDecode: lossy };
  }

  const looksLikeText = !hasExtension(file.name) || file.type.startsWith("text/");
  if (!looksLikeText || file.size > MAX_UNNAMED_BYTES) throw unsupported(file.name);

  const { text, lossy } = decodeText(await file.arrayBuffer());
  if (lossy || text.includes("\u0000")) throw unsupported(file.name);
  const name = hasExtension(file.name) ? file.name : `${file.name || "Untitled"}.fountain`;
  return { name, text, sizeBytes: file.size, handle };
}
