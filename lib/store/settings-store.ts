import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { PaperSize } from "@/lib/fountain";

export type ViewMode = "edit" | "split" | "read";

export const FONT_SIZES = [14, 16, 18, 20] as const;
export type FontSize = (typeof FONT_SIZES)[number];

export interface SettingsState {
  viewMode: ViewMode;
  showOutline: boolean;
  showSceneNumbers: boolean;
  focusMode: boolean;
  fontSize: FontSize;
  paper: PaperSize["id"];
  setViewMode(mode: ViewMode): void;
  toggleOutline(): void;
  toggleSceneNumbers(): void;
  toggleFocusMode(): void;
  setFontSize(size: FontSize): void;
  setPaper(paper: PaperSize["id"]): void;
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
      setViewMode: (viewMode) => set({ viewMode }),
      toggleOutline: () => set((s) => ({ showOutline: !s.showOutline })),
      toggleSceneNumbers: () => set((s) => ({ showSceneNumbers: !s.showSceneNumbers })),
      toggleFocusMode: () => set((s) => ({ focusMode: !s.focusMode })),
      setFontSize: (fontSize) => set({ fontSize }),
      setPaper: (paper) => set({ paper }),
    }),
    {
      name: "bida-settings",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    },
  ),
);
