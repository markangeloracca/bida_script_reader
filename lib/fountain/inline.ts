/**
 * Inline Fountain markup: emphasis, inline notes and inline boneyard.
 *
 * `findInlineRanges` is used by the editor to decorate source text;
 * `toSpans` is used by the preview to render formatted text. Both share the
 * same matching logic so the two views can never disagree.
 */

export type InlineKind = "bold_italic" | "bold" | "italic" | "underline" | "note" | "boneyard";

export interface InlineRange {
  kind: InlineKind;
  /** Start offset (inclusive), including the opening marker. */
  from: number;
  /** End offset (exclusive), including the closing marker. */
  to: number;
  /** Length of the opening/closing marker. */
  markerLength: number;
}

export interface Span {
  text: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
}

const MASK = "\u0001";

const HIDDEN_RULES: ReadonlyArray<{ kind: InlineKind; pattern: RegExp; markerLength: number }> = [
  { kind: "note", pattern: /\[\[[\s\S]*?\]\]/g, markerLength: 2 },
  { kind: "boneyard", pattern: /\/\*[\s\S]*?\*\//g, markerLength: 2 },
];

const EMPHASIS_RULES: ReadonlyArray<{ kind: InlineKind; pattern: RegExp; markerLength: number }> = [
  { kind: "bold_italic", pattern: /\*\*\*(?=\S)([\s\S]*?\S)\*\*\*/g, markerLength: 3 },
  { kind: "bold", pattern: /\*\*(?=\S)([\s\S]*?\S)\*\*/g, markerLength: 2 },
  { kind: "italic", pattern: /\*(?=\S)([\s\S]*?\S)\*/g, markerLength: 1 },
  { kind: "underline", pattern: /_(?=\S)([\s\S]*?\S)_/g, markerLength: 1 },
];

const mask = (text: string, from: number, to: number) => text.slice(0, from) + MASK.repeat(to - from) + text.slice(to);

/** Finds every inline markup range in a line of text. */
export function findInlineRanges(text: string): InlineRange[] {
  // Escaped markers (\* and \_) must never open or close emphasis.
  let work = text.replace(/\\[*_]/g, MASK + MASK);
  const ranges: InlineRange[] = [];

  for (const rule of HIDDEN_RULES) {
    for (const match of work.matchAll(rule.pattern)) {
      const from = match.index;
      const to = from + match[0].length;
      ranges.push({ kind: rule.kind, from, to, markerLength: rule.markerLength });
      work = mask(work, from, to);
    }
  }

  for (const rule of EMPHASIS_RULES) {
    for (const match of work.matchAll(rule.pattern)) {
      const from = match.index;
      const to = from + match[0].length;
      ranges.push({ kind: rule.kind, from, to, markerLength: rule.markerLength });
      // Mask only the markers so nested emphasis is still found.
      work = mask(work, from, from + rule.markerLength);
      work = mask(work, to - rule.markerLength, to);
    }
  }

  return ranges.sort((a, b) => a.from - b.from);
}

/** Converts a line of Fountain text into styled spans with markup removed. */
export function toSpans(text: string): Span[] {
  const n = text.length;
  const hidden = new Array<boolean>(n).fill(false);
  const bold = new Array<boolean>(n).fill(false);
  const italic = new Array<boolean>(n).fill(false);
  const underline = new Array<boolean>(n).fill(false);

  for (const match of text.matchAll(/\\[*_]/g)) hidden[match.index] = true;

  for (const range of findInlineRanges(text)) {
    const inner = (fill: boolean[]) => {
      for (let i = range.from + range.markerLength; i < range.to - range.markerLength; i++) fill[i] = true;
    };
    if (range.kind === "note" || range.kind === "boneyard") {
      for (let i = range.from; i < range.to; i++) hidden[i] = true;
      continue;
    }
    for (let i = 0; i < range.markerLength; i++) {
      hidden[range.from + i] = true;
      hidden[range.to - 1 - i] = true;
    }
    if (range.kind === "bold" || range.kind === "bold_italic") inner(bold);
    if (range.kind === "italic" || range.kind === "bold_italic") inner(italic);
    if (range.kind === "underline") inner(underline);
  }

  const spans: Span[] = [];
  for (let i = 0; i < n; i++) {
    if (hidden[i]) continue;
    const last = spans[spans.length - 1];
    if (last && last.bold === bold[i] && last.italic === italic[i] && last.underline === underline[i]) {
      last.text += text[i];
    } else {
      spans.push({ text: text[i], bold: bold[i], italic: italic[i], underline: underline[i] });
    }
  }
  return spans;
}

/** Text with all inline markup, notes and boneyard removed. */
export function toPlainText(text: string): string {
  return toSpans(text)
    .map((span) => span.text)
    .join("");
}
