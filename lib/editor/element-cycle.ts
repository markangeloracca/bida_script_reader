import { EditorSelection } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";
import { isUpperCase, type LineType } from "@/lib/fountain";
import { lineTypeAt } from "./fountain-language";

/** Order in which Tab cycles a line's element type (Shift-Tab goes backwards). */
export const CYCLE: readonly LineType[] = ["action", "scene_heading", "character", "transition", "centered"];

const SCENE_PREFIX = /^(?:INT|EXT|EST|INT\.?\/EXT|I\/E|E\/I)[.\s]/i;

/** Removes forcing markers so text can be re-forced as another element. */
export function stripForcing(text: string): string {
  let bare = text.trim();
  if (/^>.*<$/.test(bare)) bare = bare.slice(1, -1);
  else bare = bare.replace(/^[.@!>~](?!\.)/, "");
  return bare.trim();
}

/** Rewrites text so the parser classifies it as `type`. */
export function forceElement(bare: string, type: LineType, prevEmpty: boolean): string {
  switch (type) {
    case "scene_heading":
      return prevEmpty && SCENE_PREFIX.test(bare) ? bare.toUpperCase() : `.${bare}`;
    case "character":
      return `@${bare}`;
    case "transition":
      return `>${bare}`;
    case "centered":
      return `>${bare}<`;
    case "action":
      return isUpperCase(bare) || SCENE_PREFIX.test(bare) ? `!${bare}` : bare;
    default:
      return bare;
  }
}

/**
 * Tab behaviour modelled on Beat:
 * - on an empty line inside dialogue, inserts a parenthetical;
 * - on dialogue, toggles between dialogue and parenthetical;
 * - otherwise cycles the line through action → scene → character → transition → centered.
 */
export function cycleElement(view: EditorView, direction: 1 | -1): boolean {
  const { state } = view;
  const line = state.doc.lineAt(state.selection.main.head);
  const type = lineTypeAt(state, line.number);
  const prevType = line.number > 1 ? lineTypeAt(state, line.number - 1) : "empty";
  const replace = (insert: string, cursor = insert.length) =>
    view.dispatch({
      changes: { from: line.from, to: line.to, insert },
      selection: EditorSelection.cursor(line.from + cursor),
      userEvent: "input.type",
    });

  if (line.text.trim() === "" && ["character", "dialogue", "parenthetical"].includes(prevType)) {
    replace("()", 1);
    return true;
  }
  if (type === "dialogue") {
    replace(`(${line.text.trim()})`);
    return true;
  }
  if (type === "parenthetical") {
    replace(line.text.trim().replace(/^\(|\)$/g, ""));
    return true;
  }

  const index = Math.max(0, CYCLE.indexOf(type));
  const next = CYCLE[(index + direction + CYCLE.length) % CYCLE.length];
  const prevEmpty = line.number === 1 || prevType === "empty";
  replace(forceElement(stripForcing(line.text), next, prevEmpty));
  return true;
}
