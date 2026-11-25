import { buildBlocks, type Block, type DialogueBlock, type DialoguePart, type PageElement } from "./blocks";
import { COLUMN_WIDTHS, PAPER_SIZES, type PaperSize } from "./paper";
import type { Token } from "./tokens";
import { joinWrapped, wrapText, type WrappedLine } from "./wrap";

export interface Page {
  /** One-based page number. */
  number: number;
  elements: PageElement[];
}

export interface PaginationOptions {
  linesPerPage: number;
}

/** Swappable layout algorithm (Strategy), e.g. line-based now, DOM-measured later. */
export interface PaginationStrategy {
  paginate(blocks: readonly Block[], options: PaginationOptions): Page[];
}

/** Removes notes and boneyard so they never take up printed space. */
const printable = (text: string) => text.replace(/\[\[[\s\S]*?\]\]|\/\*[\s\S]*?\*\//g, "").trim();

const MIN_SPLIT_LINES = 2;

interface WrappedPart {
  part: DialoguePart;
  lines: WrappedLine[];
}

function wrapDialogue(block: DialogueBlock, dual = false): WrappedPart[] {
  return block.parts.map((part) => {
    const width =
      part.type === "parenthetical"
        ? dual
          ? COLUMN_WIDTHS.dualParenthetical
          : COLUMN_WIDTHS.parenthetical
        : dual
          ? COLUMN_WIDTHS.dualDialogue
          : COLUMN_WIDTHS.dialogue;
    return { part, lines: wrapText(printable(part.text), width) };
  });
}

const dialogueHeight = (block: DialogueBlock, dual = false) =>
  1 + wrapDialogue(block, dual).reduce((sum, wrapped) => sum + wrapped.lines.length, 0);

/** Height in lines of a printable element. */
export function measure(element: PageElement): number {
  switch (element.kind) {
    case "dialogue":
      return dialogueHeight(element);
    case "dual_dialogue":
      return Math.max(dialogueHeight(element.left, true), dialogueHeight(element.right, true));
    case "action":
    case "scene_heading":
    case "centered":
    case "transition":
    case "lyrics":
      return wrapText(printable(element.text), COLUMN_WIDTHS.action).length;
  }
}

/** Splits dialogue so that `firstLines` wrapped lines stay on the current page. */
function splitDialogue(block: DialogueBlock, firstLines: number): [DialogueBlock, DialogueBlock] {
  const head: DialoguePart[] = [];
  const tail: DialoguePart[] = [];
  let remaining = firstLines;
  for (const { part, lines } of wrapDialogue(block)) {
    if (remaining >= lines.length) head.push(part);
    else if (remaining <= 0) tail.push(part);
    else {
      head.push({ ...part, text: joinWrapped(lines.slice(0, remaining)) });
      tail.push({ ...part, text: joinWrapped(lines.slice(remaining)) });
    }
    remaining -= lines.length;
  }
  return [
    { ...block, parts: head, more: true },
    { ...block, parts: tail, contd: true, more: block.more },
  ];
}

/**
 * Approximate, line-counting pagination in the spirit of screenplay software:
 * one blank line between elements, scene headings kept with what follows,
 * long action split between lines, and long dialogue split with (MORE)/(CONT'D).
 */
export const lineBasedPagination: PaginationStrategy = {
  paginate(blocks, { linesPerPage }) {
    const pages: Page[] = [{ number: 1, elements: [] }];
    let used = 0;

    const current = () => pages[pages.length - 1];
    const newPage = () => {
      if (current().elements.length === 0) return;
      pages.push({ number: pages.length + 1, elements: [] });
      used = 0;
    };
    const place = (element: PageElement, height: number) => {
      used += (used === 0 ? 0 : 1) + height;
      current().elements.push(element);
    };
    const free = () => linesPerPage - used - (used === 0 ? 0 : 1);

    for (const block of blocks) {
      if (block.kind === "page_break") {
        newPage();
        continue;
      }

      const height = measure(block);
      // Keep scene headings with at least two lines of what follows.
      const needed = block.kind === "scene_heading" ? height + 1 + MIN_SPLIT_LINES : height;
      if (needed <= free()) {
        place(block, height);
        continue;
      }

      const available = free();
      if (block.kind === "action" && available >= MIN_SPLIT_LINES && height - available >= MIN_SPLIT_LINES) {
        const lines = wrapText(printable(block.text), COLUMN_WIDTHS.action);
        place({ ...block, text: joinWrapped(lines.slice(0, available)) }, available);
        newPage();
        const rest = lines.slice(available);
        place({ ...block, text: joinWrapped(rest) }, rest.length);
        continue;
      }

      // Character + 2 lines + (MORE) must fit, and 2 lines must carry over.
      const dialogueRoom = available - 2;
      if (block.kind === "dialogue" && dialogueRoom >= MIN_SPLIT_LINES && height - 1 - dialogueRoom >= MIN_SPLIT_LINES) {
        const [head, tail] = splitDialogue(block, dialogueRoom);
        place(head, available);
        newPage();
        place(tail, measure(tail));
        continue;
      }

      newPage();
      place(block, height);
    }

    return pages;
  },
};

export interface PaginateOptions {
  paper?: PaperSize;
  strategy?: PaginationStrategy;
}

/** Lays out pre-built blocks onto pages (lets callers reuse the blocks). */
export function paginateBlocks(blocks: readonly Block[], options: PaginateOptions = {}): Page[] {
  const { paper = PAPER_SIZES.letter, strategy = lineBasedPagination } = options;
  return strategy.paginate(blocks, { linesPerPage: paper.linesPerPage });
}

/** Lays out script tokens onto pages. */
export function paginate(tokens: readonly Token[], options: PaginateOptions = {}): Page[] {
  return paginateBlocks(buildBlocks(tokens), options);
}

/**
 * Maps the source line of each page's first element to its page number, so a
 * continuous (unpaginated) view can show where printed pages begin.
 */
export function pageStartLines(pages: readonly Page[]): Map<number, number> {
  const starts = new Map<number, number>();
  for (const page of pages) {
    const first = page.elements[0];
    if (first && !starts.has(first.line)) starts.set(first.line, page.number);
  }
  return starts;
}

/** One-based page number containing a source line (1 when before any content). */
export function pageAtLine(pages: readonly Page[], line: number): number {
  let result = 1;
  for (const page of pages) {
    const first = page.elements[0];
    if (first && first.line > line) break;
    if (first) result = page.number;
  }
  return result;
}
