/**
 * Core Fountain domain types.
 *
 * This module is pure TypeScript and must not import React, the DOM, or
 * CodeMirror (enforced by ESLint). Everything else in the app consumes
 * these types; nothing re-interprets Fountain syntax on its own.
 */

/** Classification of a single source line. */
export type LineType =
  | "empty"
  | "title_page"
  | "scene_heading"
  | "action"
  | "character"
  | "dialogue"
  | "parenthetical"
  | "transition"
  | "centered"
  | "lyrics"
  | "page_break"
  | "section"
  | "synopsis"
  | "note"
  | "boneyard";

/** One source line with its classification and position in the document. */
export interface Line {
  /** Zero-based line index in the source text. */
  index: number;
  /** Raw line text, without the trailing newline. */
  text: string;
  type: LineType;
}

interface TokenBase {
  /** Zero-based source line index this token came from. */
  line: number;
}

export interface SceneHeadingToken extends TokenBase {
  type: "scene_heading";
  text: string;
  /** Explicit (`#12#`) or automatically assigned scene number. */
  sceneNumber: string;
}

export interface ActionToken extends TokenBase {
  type: "action";
  text: string;
}

export interface CenteredToken extends TokenBase {
  type: "centered";
  text: string;
}

export interface CharacterToken extends TokenBase {
  type: "character";
  /** Normalized cue name without forcing markers or extensions. */
  name: string;
  /** Extension such as `(V.O.)`, if present. */
  extension?: string;
  /** True when the cue ends with `^` (second half of dual dialogue). */
  dual: boolean;
}

export interface DialogueToken extends TokenBase {
  type: "dialogue";
  text: string;
}

export interface ParentheticalToken extends TokenBase {
  type: "parenthetical";
  text: string;
}

export interface LyricsToken extends TokenBase {
  type: "lyrics";
  text: string;
}

export interface TransitionToken extends TokenBase {
  type: "transition";
  text: string;
}

export interface PageBreakToken extends TokenBase {
  type: "page_break";
}

export interface SectionToken extends TokenBase {
  type: "section";
  text: string;
  depth: number;
}

export interface SynopsisToken extends TokenBase {
  type: "synopsis";
  text: string;
}

/** Block-level script element, as consumed by outline, stats and preview. */
export type Token =
  | SceneHeadingToken
  | ActionToken
  | CenteredToken
  | CharacterToken
  | DialogueToken
  | ParentheticalToken
  | LyricsToken
  | TransitionToken
  | PageBreakToken
  | SectionToken
  | SynopsisToken;

export type TokenType = Token["type"];

export interface TitlePageEntry {
  /** Lower-cased key, e.g. `title`, `credit`, `draft date`. */
  key: string;
  /** Value lines (multi-line values keep one entry per line). */
  values: string[];
}

export interface ParsedScript {
  titlePage: TitlePageEntry[];
  lines: Line[];
  tokens: Token[];
}

/** Compile-time exhaustiveness guard for discriminated unions. */
export function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${JSON.stringify(value)}`);
}
