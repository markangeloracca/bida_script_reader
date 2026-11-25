"use client";

import { useCallback, useEffect, useState } from "react";
import { notifyError } from "@/lib/notify";
import type { RecentScript } from "@/lib/storage";
import { useScriptService } from "./use-script-service";

/** Recent scripts list with refresh and remove. */
export function useRecents() {
  const service = useScriptService();
  const [recents, setRecents] = useState<RecentScript[] | null>(null);

  const refresh = useCallback(async () => {
    try {
      setRecents(await service.listRecents());
    } catch (error) {
      setRecents([]);
      notifyError(error, "Recent scripts are unavailable in this browser.");
    }
  }, [service]);

  useEffect(() => {
    let cancelled = false;
    service
      .listRecents()
      .then((list) => !cancelled && setRecents(list))
      .catch((error: unknown) => {
        if (cancelled) return;
        setRecents([]);
        notifyError(error, "Recent scripts are unavailable in this browser.");
      });
    return () => {
      cancelled = true;
    };
  }, [service]);

  const remove = useCallback(
    async (id: string) => {
      try {
        await service.removeRecent(id);
        await refresh();
      } catch (error) {
        notifyError(error, "Could not remove the script.");
      }
    },
    [refresh, service],
  );

  return { recents, loading: recents === null, refresh, remove };
}
