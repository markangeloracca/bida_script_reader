"use client";

import { useCallback, useSyncExternalStore } from "react";

/** Subscribes to a CSS media query. Returns `serverValue` during SSR. */
export function useMediaQuery(query: string, serverValue = true): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => serverValue,
  );
}

/** Below Tailwind's `md` breakpoint: phones and small tablets in portrait. */
export const MOBILE_QUERY = "(max-width: 767px)";

export function useIsMobile(): boolean {
  return useMediaQuery(MOBILE_QUERY, false);
}
