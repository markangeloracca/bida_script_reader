import { toPlainText } from "./inline";
import type { Token } from "./tokens";

export type OutlineItem =
  | { kind: "section"; text: string; depth: number; line: number }
  | { kind: "scene"; text: string; sceneNumber: string; line: number }
  | { kind: "synopsis"; text: string; line: number };

/** Builds the navigator outline (sections, scenes, synopses) from tokens. */
export function buildOutline(tokens: readonly Token[]): OutlineItem[] {
  const items: OutlineItem[] = [];
  for (const token of tokens) {
    if (token.type === "section") {
      items.push({ kind: "section", text: token.text, depth: token.depth, line: token.line });
    } else if (token.type === "scene_heading") {
      items.push({
        kind: "scene",
        text: toPlainText(token.text).toUpperCase(),
        sceneNumber: token.sceneNumber,
        line: token.line,
      });
    } else if (token.type === "synopsis") {
      items.push({ kind: "synopsis", text: token.text, line: token.line });
    }
  }
  return items;
}

/** Returns the scene containing a source line, or undefined before the first scene. */
export function sceneAtLine(outline: readonly OutlineItem[], line: number): OutlineItem | undefined {
  let current: OutlineItem | undefined;
  for (const item of outline) {
    if (item.kind !== "scene") continue;
    if (item.line > line) break;
    current = item;
  }
  return current;
}
