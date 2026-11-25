"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** True on Apple platforms (for ⌘ vs Ctrl labels). False during SSR. */
export function useIsMac(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent),
    () => false,
  );
}
