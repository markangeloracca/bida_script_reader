/**
 * Paper geometry shared by the paginator (line budgets) and the preview
 * (CSS sizes), so the on-screen pages and the page count always agree.
 * Courier 12pt prints 10 characters per inch.
 */
export interface PaperSize {
  id: "letter" | "a4";
  label: string;
  widthIn: number;
  heightIn: number;
  /** Printable lines between the 1in top and bottom margins. */
  linesPerPage: number;
}

export const PAPER_SIZES = {
  letter: { id: "letter", label: "US Letter", widthIn: 8.5, heightIn: 11, linesPerPage: 55 },
  a4: { id: "a4", label: "A4", widthIn: 8.27, heightIn: 11.69, linesPerPage: 59 },
} as const satisfies Record<PaperSize["id"], PaperSize>;

/** Characters per line for each element, at 10 characters per inch. */
export const COLUMN_WIDTHS = {
  action: 61,
  character: 38,
  dialogue: 35,
  parenthetical: 26,
  dualDialogue: 28,
  dualParenthetical: 22,
} as const;
