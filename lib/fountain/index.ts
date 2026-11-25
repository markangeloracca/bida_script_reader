/**
 * Public API of the Fountain domain module. Consumers import from
 * `@/lib/fountain` only, never from internal files.
 */
export * from "./tokens";
export { parseFountain } from "./parser";
export { classifyLines } from "./classify";
export { isUpperCase } from "./element-registry";
export { findInlineRanges, toPlainText, toSpans, type InlineKind, type InlineRange, type Span } from "./inline";
export { buildOutline, sceneAtLine, type OutlineItem } from "./outline";
export { computeStats, type CharacterStat, type ScriptStats } from "./stats";
export type { Block, DialogueBlock, DialoguePart, DualDialogueBlock, PageElement } from "./blocks";
export { paginate, pageAtLine, lineBasedPagination, measure, type Page, type PaginationStrategy } from "./paginate";
export { PAPER_SIZES, type PaperSize } from "./paper";
export { getTitle, titleValue } from "./title-page";
