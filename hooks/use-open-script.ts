"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo } from "react";
import { toast } from "sonner";
import { notifyError } from "@/lib/notify";
import { readFile, type OpenedFile, type RecentScript } from "@/lib/storage";
import { useScriptService } from "./use-script-service";

export const SAMPLE_URL = "/samples/the-last-lighthouse.fountain";

const NEW_SCRIPT_TEMPLATE = `Title: Untitled Screenplay
Credit: Written by
Author: Your Name
Draft date: ${new Date().toLocaleDateString()}

FADE IN:

INT. LOCATION - DAY

`;

/** Every way of opening a script; each one navigates to the workspace on success. */
export function useOpenScript() {
  const service = useScriptService();
  const router = useRouter();

  const go = useCallback((entry: RecentScript | null) => entry && router.push(`/script/${entry.id}`), [router]);

  const run = useCallback(
    async (action: () => Promise<RecentScript | null>, failure: string) => {
      try {
        go(await action());
      } catch (error) {
        notifyError(error, failure);
      }
    },
    [go],
  );

  const importOpened = useCallback(
    async (file: OpenedFile) => {
      if (file.lossyDecode) toast.warning(`“${file.name}” was not UTF-8; some characters may look wrong.`);
      return service.importFile(file);
    },
    [service],
  );

  return useMemo(
    () => ({
      openWithPicker: () => run(() => service.openWithPicker(), "Could not open the file."),

      openFile: (file: File, handle?: FileSystemFileHandle) =>
        run(async () => importOpened(await readFile(file, handle)), "Could not open the file."),

      createNew: () => run(() => service.createScript(NEW_SCRIPT_TEMPLATE, "Untitled.fountain"), "Could not create a script."),

      openSample: () =>
        run(async () => {
          const response = await fetch(SAMPLE_URL);
          if (!response.ok) throw new Error(`Sample request failed: ${response.status}`);
          return service.importFile({
            name: "the-last-lighthouse.fountain",
            text: await response.text(),
            sizeBytes: 0,
          });
        }, "Could not load the sample script."),

      reopen: (id: string) => run(() => service.reopen(id), "Could not open the script."),
    }),
    [importOpened, run, service],
  );
}
