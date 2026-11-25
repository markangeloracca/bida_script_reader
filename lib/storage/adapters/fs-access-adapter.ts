import { readFile } from "../read-file";
import { ScriptError, type FileAccess, type HandleFileIO } from "../types";

const PICKER_TYPES: FilePickerAcceptType[] = [
  { description: "Fountain screenplay", accept: { "text/plain": [".fountain", ".spmd", ".txt"] } },
];

const isAbort = (error: unknown) => error instanceof DOMException && error.name === "AbortError";

/** True when the browser supports the File System Access API. */
export function supportsFileSystemAccess(): boolean {
  return (
    typeof window !== "undefined" && typeof window.showOpenFilePicker === "function" && typeof window.showSaveFilePicker === "function"
  );
}

const handleIO: HandleFileIO = {
  async ensurePermission(handle, mode) {
    if (!handle.queryPermission || !handle.requestPermission) return true;
    if ((await handle.queryPermission({ mode })) === "granted") return true;
    try {
      return (await handle.requestPermission({ mode })) === "granted";
    } catch {
      // requestPermission throws without a user gesture; treat as not granted.
      return false;
    }
  },
  async read(handle) {
    return readFile(await handle.getFile(), handle);
  },
  async write(handle, text) {
    try {
      const writable = await handle.createWritable();
      await writable.write(text);
      await writable.close();
    } catch (error) {
      throw new ScriptError("write_failed", `Could not write “${handle.name}”.`, { cause: error });
    }
  },
};

/** Adapter for Chromium browsers: native pickers and save-in-place. */
export function createFsAccessAdapter(): FileAccess {
  return {
    handles: handleIO,
    async open() {
      try {
        const [handle] = await window.showOpenFilePicker!({ types: PICKER_TYPES, id: "fountain" });
        return handle ? handleIO.read(handle) : null;
      } catch (error) {
        if (isAbort(error)) return null;
        throw error;
      }
    },
    async saveAs(text, suggestedName) {
      try {
        const handle = await window.showSaveFilePicker!({ suggestedName, types: PICKER_TYPES, id: "fountain" });
        await handleIO.write(handle, text);
        return { fileName: handle.name, handle };
      } catch (error) {
        if (isAbort(error)) return null;
        throw error;
      }
    },
  };
}
