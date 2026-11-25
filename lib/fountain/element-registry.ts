import type { LineType } from "./tokens";

/**
 * Context handed to each standalone element rule while classifying a line.
 */
export interface RuleContext {
  /** Raw line text. */
  text: string;
  /** Line text with surrounding whitespace removed. */
  trimmed: string;
  /** True when the previous line is blank or this is the first script line. */
  prevEmpty: boolean;
  /** True when the next line is blank or this is the last line. */
  nextEmpty: boolean;
}

/**
 * A rule that recognises one Fountain element. Rules are evaluated in order;
 * the first match wins. New element types are added by appending a rule here
 * (Open/Closed) rather than editing the classifier loop.
 */
export interface ElementRule {
  type: LineType;
  matches(ctx: RuleContext): boolean;
}

const SCENE_HEADING = /^(?:INT|EXT|EST|INT\.?\/EXT|I\/E|E\/I)[.\s]/i;
const TRANSITION = /^[A-Z0-9\s.'’-]*TO:$/;
const COMMON_TRANSITIONS = new Set(["FADE OUT.", "FADE TO BLACK.", "CUT TO BLACK."]);
const CENTERED = /^>.*<$/;
const WHOLE_LINE_NOTE = /^\[\[[\s\S]*\]\]$/;

/** Strips the parts of a character cue that may legally be lower-case. */
function cueName(trimmed: string): string {
  return trimmed
    .replace(/\[\[[\s\S]*?\]\]/g, "")
    .replace(/\^$/, "")
    .replace(/\(.*$/, "")
    .trim();
}

/** True when text contains a letter and no lower-case letters. */
export function isUpperCase(text: string): boolean {
  return /\p{L}/u.test(text) && text === text.toUpperCase();
}

/** Ordered rules for lines outside of a dialogue block. */
export const ELEMENT_RULES: readonly ElementRule[] = [
  { type: "page_break", matches: ({ trimmed }) => /^={3,}$/.test(trimmed) },
  { type: "section", matches: ({ trimmed }) => trimmed.startsWith("#") },
  { type: "synopsis", matches: ({ trimmed }) => /^=(?!=)/.test(trimmed) },
  { type: "note", matches: ({ trimmed }) => WHOLE_LINE_NOTE.test(trimmed) },
  { type: "centered", matches: ({ trimmed }) => CENTERED.test(trimmed) },
  { type: "scene_heading", matches: ({ trimmed }) => /^\.[^.]/.test(trimmed) },
  { type: "action", matches: ({ trimmed }) => trimmed.startsWith("!") },
  { type: "character", matches: ({ trimmed }) => trimmed.startsWith("@") },
  { type: "transition", matches: ({ trimmed }) => trimmed.startsWith(">") },
  { type: "lyrics", matches: ({ trimmed }) => trimmed.startsWith("~") },
  {
    type: "scene_heading",
    matches: ({ trimmed, prevEmpty }) => prevEmpty && SCENE_HEADING.test(trimmed),
  },
  {
    type: "transition",
    matches: ({ trimmed, prevEmpty, nextEmpty }) =>
      prevEmpty && nextEmpty && isUpperCase(trimmed) && (TRANSITION.test(trimmed) || COMMON_TRANSITIONS.has(trimmed)),
  },
  {
    type: "character",
    matches: ({ trimmed, prevEmpty, nextEmpty }) => {
      if (!prevEmpty || nextEmpty) return false;
      const name = cueName(trimmed);
      return name.length > 0 && isUpperCase(name);
    },
  },
];

/** Classifies a line inside a dialogue block (after a character cue). */
export function classifyDialogueLine(trimmed: string): LineType {
  if (/^\(.*\)$/.test(trimmed)) return "parenthetical";
  if (trimmed.startsWith("~")) return "lyrics";
  if (WHOLE_LINE_NOTE.test(trimmed)) return "note";
  return "dialogue";
}
