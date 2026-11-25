import { ScriptError, type OpenedFile } from "./types";

export const ACCEPTED_EXTENSIONS = [".fountain", ".spmd", ".txt"] as const;

export function isFountainFileName(name: string): boolean {
  const lower = name.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

/** Decodes UTF-8, falling back to Windows-1252 for legacy files. */
export function decodeText(buffer: ArrayBuffer): { text: string; lossy: boolean } {
  try {
    return { text: new TextDecoder("utf-8", { fatal: true }).decode(buffer), lossy: false };
  } catch {
    return { text: new TextDecoder("windows-1252").decode(buffer), lossy: true };
  }
}

/** Reads a browser `File` into an `OpenedFile`, validating its type. */
export async function readFile(file: File, handle?: FileSystemFileHandle): Promise<OpenedFile> {
  if (!isFountainFileName(file.name)) {
    throw new ScriptError("unsupported_file", `“${file.name}” is not a Fountain file (.fountain, .spmd or .txt).`);
  }
  const { text, lossy } = decodeText(await file.arrayBuffer());
  return { name: file.name, text, sizeBytes: file.size, handle, lossyDecode: lossy };
}
