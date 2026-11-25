"use client";

import { useMemo } from "react";
import { flushSync } from "react-dom";
import { toast } from "sonner";
import { notifyError } from "@/lib/notify";
import { useDocumentStore } from "@/lib/store/document-store";
import { useSettingsStore } from "@/lib/store/settings-store";
import { downloadText } from "@/lib/storage";
import { useScriptService } from "./use-script-service";

/** File-level commands for the open script: save, save as, download, print. */
export function useScriptActions() {
  const service = useScriptService();

  return useMemo(() => {
    const save = async (saveAs = false) => {
      const { meta, text } = useDocumentStore.getState();
      if (!meta) return;
      try {
        const outcome = await service.save(meta.id, text, { saveAs });
        if (!outcome) return;
        const store = useDocumentStore.getState();
        const updated = await service.load(meta.id);
        if (updated) store.setMeta(updated.meta);
        if (store.text === text) {
          store.markFileSaved();
          store.setAutosave("saved");
        }
        toast.success(outcome.target === "file" ? `Saved to ${outcome.fileName}` : `Downloaded ${outcome.fileName}`);
      } catch (error) {
        notifyError(error, "Could not save the script.");
      }
    };

    return {
      canSaveInPlace: service.canSaveInPlace,
      save: () => save(false),
      saveAs: () => save(true),
      download: () => {
        const { meta, text } = useDocumentStore.getState();
        if (meta) downloadText(text, meta.fileName);
      },
      print: () => {
        // Printing renders the paginated preview, so switch to read mode first.
        const settings = useSettingsStore.getState();
        const previous = settings.viewMode;
        flushSync(() => settings.setViewMode("read"));
        useDocumentStore.getState().reparse();
        requestAnimationFrame(() => {
          window.print();
          if (previous !== "read") useSettingsStore.getState().setViewMode(previous);
        });
      },
    };
  }, [service]);
}
