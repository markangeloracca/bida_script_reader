import { toPlainText } from "./inline";
import type { TitlePageEntry } from "./tokens";

/** Returns the values for a title-page key (case-insensitive). */
export function titleValue(entries: readonly TitlePageEntry[], key: string): string[] {
  return entries.find((entry) => entry.key === key.toLowerCase())?.values ?? [];
}

/** Display title from the title page, falling back to the given name. */
export function getTitle(entries: readonly TitlePageEntry[], fallback: string): string {
  const title = titleValue(entries, "title").map(toPlainText).join(" ").trim();
  return title || fallback;
}
