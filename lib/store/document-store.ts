import { create } from "zustand";
import {
  buildOutline,
  computeStats,
  paginate,
  parseFountain,
  PAPER_SIZES,
  type OutlineItem,
  type Page,
  type PaperSize,
  type ParsedScript,
  type ScriptStats,
} from "@/lib/fountain";
import type { RecentScript } from "@/lib/storage/types";

export type AutosaveStatus = "saved" | "pending" | "error";

export interface NavigationRequest {
  line: number;
  nonce: number;
  /** `editor` moves only the editor cursor (e.g. after clicking the preview). */
  target: "all" | "editor";
}

interface Derived {
  script: ParsedScript;
  pages: Page[];
  outline: OutlineItem[];
  stats: ScriptStats;
}

export interface DocumentState extends Derived {
  meta: RecentScript | null;
  text: string;
  /** Text has changed since it was last written to a file. */
  dirty: boolean;
  autosave: AutosaveStatus;
  /** Zero-based line of the editor cursor. */
  cursorLine: number;
  /** One-shot navigation request; the nonce lets the same line be requested twice. */
  navigation: NavigationRequest | null;
  paper: PaperSize;

  open(meta: RecentScript, text: string): void;
  close(): void;
  setText(text: string): void;
  /** Recomputes parse-derived data (called debounced while typing). */
  reparse(): void;
  setPaper(paper: PaperSize): void;
  setMeta(meta: RecentScript): void;
  markFileSaved(): void;
  setAutosave(status: AutosaveStatus): void;
  setCursorLine(line: number): void;
  navigateTo(line: number, target?: NavigationRequest["target"]): void;
}

function derive(text: string, paper: PaperSize): Derived {
  const script = parseFountain(text);
  return {
    script,
    pages: paginate(script.tokens, { paper }),
    outline: buildOutline(script.tokens),
    stats: computeStats(script.tokens),
  };
}

const EMPTY = derive("", PAPER_SIZES.letter);

/** State of the currently open script (Observer: components subscribe via selectors). */
export const useDocumentStore = create<DocumentState>()((set, get) => ({
  ...EMPTY,
  meta: null,
  text: "",
  dirty: false,
  autosave: "saved",
  cursorLine: 0,
  navigation: null,
  paper: PAPER_SIZES.letter,

  open: (meta, text) => set({ ...derive(text, get().paper), meta, text, dirty: false, autosave: "saved", cursorLine: 0, navigation: null }),
  close: () => set({ ...EMPTY, meta: null, text: "", dirty: false, autosave: "saved", navigation: null }),
  setText: (text) => {
    if (text === get().text) return;
    set({ text, dirty: true, autosave: "pending" });
  },
  reparse: () => set(derive(get().text, get().paper)),
  setPaper: (paper) => set({ paper, ...derive(get().text, paper) }),
  setMeta: (meta) => set({ meta }),
  markFileSaved: () => set({ dirty: false }),
  setAutosave: (autosave) => set({ autosave }),
  setCursorLine: (cursorLine) => {
    if (cursorLine !== get().cursorLine) set({ cursorLine });
  },
  navigateTo: (line, target = "all") => set({ navigation: { line, target, nonce: Date.now() } }),
}));
