"use client";

import { useEffect, useState } from "react";
import { PAPER_SIZES } from "@/lib/fountain";
import { notifyError } from "@/lib/notify";
import { useDocumentStore } from "@/lib/store/document-store";
import { useSettingsStore } from "@/lib/store/settings-store";
import { useScriptService } from "./use-script-service";

const PARSE_DELAY_MS = 150;
const AUTOSAVE_DELAY_MS = 1000;

export type SessionStatus = "loading" | "ready" | "missing";

/**
 * Owns the lifecycle of the open script: loading it into the store, keeping
 * derived data fresh while typing, autosaving to IndexedDB, and guarding
 * against closing the tab with changes that only exist in memory.
 */
export function useWorkspaceSession(id: string): SessionStatus {
  const service = useScriptService();
  const [status, setStatus] = useState<SessionStatus>("loading");
  const text = useDocumentStore((s) => s.text);
  const paperId = useSettingsStore((s) => s.paper);

  // Load
  useEffect(() => {
    let cancelled = false;
    const store = useDocumentStore.getState();
    service
      .load(id)
      .then((loaded) => {
        if (cancelled) return;
        if (!loaded) return setStatus("missing");
        store.open(loaded.meta, loaded.text);
        setStatus("ready");
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        notifyError(error, "Could not load the script.");
        setStatus("missing");
      });
    return () => {
      cancelled = true;
      flushAutosave();
      useDocumentStore.getState().close();
    };

    function flushAutosave() {
      const { meta, text: latest, autosave } = useDocumentStore.getState();
      if (meta?.id === id && autosave === "pending") void service.autosave(id, latest).catch(() => undefined);
    }
  }, [id, service]);

  // Keep paper size in sync with settings.
  useEffect(() => {
    useDocumentStore.getState().setPaper(PAPER_SIZES[paperId]);
  }, [paperId]);

  // Debounced parse while typing.
  useEffect(() => {
    if (status !== "ready") return;
    const timer = setTimeout(() => useDocumentStore.getState().reparse(), PARSE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [text, status]);

  // Debounced autosave to IndexedDB.
  useEffect(() => {
    const { meta, autosave } = useDocumentStore.getState();
    if (status !== "ready" || !meta || autosave !== "pending") return;
    const timer = setTimeout(async () => {
      const store = useDocumentStore.getState();
      try {
        const updated = await service.autosave(meta.id, store.text);
        store.setMeta(updated);
        // Only mark saved if nothing was typed while saving.
        if (useDocumentStore.getState().text === store.text) store.setAutosave("saved");
      } catch (error) {
        store.setAutosave("error");
        notifyError(error, "Autosave failed. Download a copy to keep your work.");
      }
    }, AUTOSAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [text, status, service]);

  // Warn before closing with changes not yet autosaved.
  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (useDocumentStore.getState().autosave !== "pending") return;
      event.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  return status;
}
