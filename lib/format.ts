import { formatDistanceToNow } from "date-fns";

export const timeAgo = (timestamp: number) => formatDistanceToNow(timestamp, { addSuffix: true });

export const plural = (count: number, word: string) => `${count.toLocaleString()} ${word}${count === 1 ? "" : "s"}`;

/** Display string for a shortcut, using ⌘ on Apple platforms. */
export function shortcutLabel(combo: string, isMac: boolean): string {
  return combo
    .split("+")
    .map((part) => {
      if (part === "mod") return isMac ? "⌘" : "Ctrl";
      if (part === "shift") return isMac ? "⇧" : "Shift";
      if (part === "alt") return isMac ? "⌥" : "Alt";
      return part.length === 1 ? part.toUpperCase() : part;
    })
    .join(isMac ? "" : "+");
}
