import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { PaperSize } from "@/lib/fountain";

export type ViewMode = "edit" | "split" | "read";

/**
 * How the reader lays out the script:
 * - `pages`: printed pages scaled to fit (faithful to the PDF);
 * - `flow`: continuous text reflowed to the screen width (comfortable on phones);
 * - `auto`: `flow` on small screens, `pages` otherwise.
 */
export type ReaderLayout = "auto" | "pages" | "flow";

export const FONT_SIZES = [14, 16, 18, 20] as const;
export type FontSize = (typeof FONT_SIZES)[number];

export interface SettingsState {
  viewMode: ViewMode;
  showOutline: boolean;
  showSceneNumbers: boolean;
  focusMode: boolean;
  fontSize: FontSize;
  paper: PaperSize["id"];
  readerLayout: ReaderLayout;
  setViewMode(mode: ViewMode): void;
  toggleOutline(): void;
  toggleSceneNumbers(): void;
  toggleFocusMode(): void;
  setFontSize(size: FontSize): void;
  setPaper(paper: PaperSize["id"]): void;
  setReaderLayout(layout: ReaderLayout): void;
}

/**
 * User preferences, persisted to localStorage. Hydration is skipped on the
 * server and triggered once on the client to avoid hydration mismatches.
 */
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      viewMode: "split",
      showOutline: true,
      showSceneNumbers: true,
      focusMode: false,
      fontSize: 16,
      paper: "letter",
      readerLayout: "auto",
      setViewMode: (viewMode) => set({ viewMode }),
      toggleOutline: () => set((s) => ({ showOutline: !s.showOutline })),
      toggleSceneNumbers: () => set((s) => ({ showSceneNumbers: !s.showSceneNumbers })),
      toggleFocusMode: () => set((s) => ({ focusMode: !s.focusMode })),
      setFontSize: (fontSize) => set({ fontSize }),
      setPaper: (paper) => set({ paper }),
      setReaderLayout: (readerLayout) => set({ readerLayout }),
    }),
    {
      name: "bida-settings",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    },
  ),
);

/** Device context that decides the effective view. */
export interface ViewContext {
  isMobile: boolean;
  focusMode: boolean;
}

/**
 * The view actually shown. Focus mode always edits; split view is too cramped
 * on phones, which are mostly used for reading, so it falls back to read.
 */
export function resolveViewMode(mode: ViewMode, { isMobile, focusMode }: ViewContext): ViewMode {
  if (focusMode) return "edit";
  if (isMobile && mode === "split") return "read";
  return mode;
}

/** The reader layout actually used: `auto` reflows on phones and shows pages elsewhere. */
export function resolveReaderLayout(layout: ReaderLayout, isMobile: boolean): Exclude<ReaderLayout, "auto"> {
  if (layout === "auto") return isMobile ? "flow" : "pages";
  return layout;
}
