import type { CSSProperties } from "react";

/**
 * Screenplay geometry as CSS custom properties, consumed by `PageElementView`.
 * One element renderer serves both layouts; only these values differ.
 */
type Geometry = Record<
  | "--sp-character"
  | "--sp-dialogue"
  | "--sp-dialogue-w"
  | "--sp-paren"
  | "--sp-paren-w"
  | "--sp-lyrics"
  | "--sp-dual-cols"
  | "--sp-dual-gap"
  | "--sp-dual-character"
  | "--sp-dual-dialogue"
  | "--sp-dual-dialogue-w"
  | "--sp-dual-paren"
  | "--sp-dual-paren-w"
  | "--sp-scene-left"
  | "--sp-scene-right"
  | "--sp-scene-right-display",
  string
>;

const asStyle = (geometry: Geometry) => geometry as unknown as CSSProperties;

/** Printed page: inches from the 1.5in left margin (industry standard). */
export const PAGE_GEOMETRY = asStyle({
  "--sp-character": "2.2in",
  "--sp-dialogue": "1in",
  "--sp-dialogue-w": "3.5in",
  "--sp-paren": "1.6in",
  "--sp-paren-w": "2.6in",
  "--sp-lyrics": "1in",
  "--sp-dual-cols": "1fr 1fr",
  "--sp-dual-gap": "0.2in",
  "--sp-dual-character": "1in",
  "--sp-dual-dialogue": "0px",
  "--sp-dual-dialogue-w": "2.8in",
  "--sp-dual-paren": "0.5in",
  "--sp-dual-paren-w": "2.2in",
  "--sp-scene-left": "-0.75in",
  "--sp-scene-right": "-0.6in",
  "--sp-scene-right-display": "inline",
});

/**
 * Continuous reading: the same proportions as a page, expressed as
 * percentages so they scale to any screen. Dual dialogue stacks, because two
 * columns are unreadable on a phone. Scene numbers sit in the left gutter only.
 */
export const FLOW_GEOMETRY = asStyle({
  "--sp-character": "33%",
  "--sp-dialogue": "12%",
  "--sp-dialogue-w": "76%",
  "--sp-paren": "22%",
  "--sp-paren-w": "60%",
  "--sp-lyrics": "12%",
  "--sp-dual-cols": "1fr",
  "--sp-dual-gap": "var(--line)",
  "--sp-dual-character": "33%",
  "--sp-dual-dialogue": "12%",
  "--sp-dual-dialogue-w": "76%",
  "--sp-dual-paren": "22%",
  "--sp-dual-paren-w": "60%",
  "--sp-scene-left": "-2.25rem",
  "--sp-scene-right": "0px",
  "--sp-scene-right-display": "none",
});
