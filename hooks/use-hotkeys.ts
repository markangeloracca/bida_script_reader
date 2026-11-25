"use client";

import { useEffect, useRef } from "react";

/** Hotkey string such as `mod+s`, `mod+shift+p` or `mod+\\` (mod = ⌘ on macOS, Ctrl elsewhere). */
export type HotkeyMap = Record<string, (event: KeyboardEvent) => void>;

function comboOf(event: KeyboardEvent): string {
  const parts: string[] = [];
  if (event.metaKey || event.ctrlKey) parts.push("mod");
  if (event.shiftKey) parts.push("shift");
  if (event.altKey) parts.push("alt");
  parts.push(event.key.toLowerCase());
  return parts.join("+");
}

/** Window-level keyboard shortcuts. Handlers may change between renders. */
export function useHotkeys(map: HotkeyMap): void {
  const ref = useRef(map);
  useEffect(() => {
    ref.current = map;
  });

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const handler = ref.current[comboOf(event)];
      if (!handler) return;
      event.preventDefault();
      handler(event);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}
