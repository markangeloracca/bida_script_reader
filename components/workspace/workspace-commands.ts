import type { ReaderLayout, ViewMode } from "@/lib/store/settings-store";

/**
 * Commands shared by the header menu, the command palette and keyboard
 * shortcuts, so each action is defined once.
 */
export interface WorkspaceCommands {
  save(): void;
  saveAs(): void;
  download(): void;
  print(): void;
  open(): void;
  goHome(): void;
  setViewMode(mode: ViewMode): void;
  toggleOutline(): void;
  toggleSceneNumbers(): void;
  toggleFocusMode(): void;
  setReaderLayout(layout: ReaderLayout): void;
  showStats(): void;
  showPalette(): void;
}

export const SHORTCUTS = {
  save: "mod+s",
  saveAs: "mod+shift+s",
  open: "mod+o",
  print: "mod+p",
  palette: "mod+k",
  togglePreview: "mod+shift+p",
  toggleOutline: "mod+\\",
  focus: "mod+shift+f",
} as const;
