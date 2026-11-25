import { fileInputAccept } from "../platform";
import { readFile } from "../read-file";
import type { FileAccess } from "../types";

/** Safari can cancel a download if its blob URL is revoked too soon. */
const REVOKE_DELAY_MS = 60_000;

/** Triggers a browser download of text as a file. */
export function downloadText(text: string, fileName: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
  const anchor = Object.assign(document.createElement("a"), { href: url, download: fileName });
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), REVOKE_DELAY_MS);
}

/**
 * Fallback adapter for browsers without the File System Access API
 * (Firefox, Safari, iPadOS): `<input type="file">` to open, a download to save.
 */
export function createDownloadAdapter(): FileAccess {
  return {
    open() {
      return new Promise((resolve, reject) => {
        const input = document.createElement("input");
        input.type = "file";
        const accept = fileInputAccept();
        if (accept) input.accept = accept;
        // Safari only fires `change` reliably for inputs attached to the document.
        input.hidden = true;
        document.body.append(input);

        const finish = () => input.remove();
        input.addEventListener("change", () => {
          const file = input.files?.[0];
          finish();
          if (!file) return resolve(null);
          readFile(file).then(resolve, reject);
        });
        input.addEventListener("cancel", () => {
          finish();
          resolve(null);
        });
        // Must run synchronously inside the user's tap for iOS to show the picker.
        input.click();
      });
    },
    async saveAs(text, suggestedName) {
      downloadText(text, suggestedName);
      return { fileName: suggestedName };
    },
  };
}
