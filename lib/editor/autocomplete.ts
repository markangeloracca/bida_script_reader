import type { Completion, CompletionContext, CompletionResult } from "@codemirror/autocomplete";
import type { EditorState } from "@codemirror/state";
import { lineTypeAt, lineTypesField } from "./fountain-language";

const SCENE_START = /^(?:INT|EXT|EST|INT\.?\/EXT|I\/E)[.\s]/i;
const CUE_SO_FAR = /^@?[A-Z0-9][A-Z0-9 .'’-]*$/;
const SCENE_PREFIXES = ["INT. ", "EXT. ", "INT./EXT. "];

/** Unique values of a given line type across the document, in first-seen order. */
function collect(state: EditorState, type: "character" | "scene_heading", exclude: number): string[] {
  const seen = new Set<string>();
  state.field(lineTypesField).forEach((lineType, index) => {
    if (lineType !== type || index === exclude) return;
    const text = state.doc.line(index + 1).text.trim();
    const value =
      type === "character"
        ? text.replace(/^@/, "").replace(/\^$/, "").replace(/\(.*$/, "").trim().toUpperCase()
        : text
            .replace(/^\./, "")
            .replace(/#[\w.-]+#\s*$/, "")
            .trim()
            .toUpperCase();
    if (value) seen.add(value);
  });
  return [...seen];
}

/** Completes character cues and scene headings from names already in the script. */
export function fountainCompletions(context: CompletionContext): CompletionResult | null {
  const { state, pos } = context;
  const line = state.doc.lineAt(pos);
  const before = line.text.slice(0, pos - line.from);
  const prevEmpty = line.number === 1 || lineTypeAt(state, line.number - 1) === "empty";
  if (!prevEmpty || before.trim() === "") return null;

  if (SCENE_START.test(before)) {
    const options: Completion[] = collect(state, "scene_heading", line.number - 1).map((label) => ({
      label,
      type: "scene",
    }));
    return options.length ? { from: line.from, options, validFor: /^[^\n]*$/ } : null;
  }

  if (CUE_SO_FAR.test(before)) {
    const forced = before.startsWith("@") ? 1 : 0;
    const typed = before.slice(forced);
    const options: Completion[] = [
      ...collect(state, "character", line.number - 1)
        .filter((name) => name !== typed)
        .map((label) => ({ label, type: "character", apply: `${label}\n` })),
      ...(forced ? [] : SCENE_PREFIXES.map((label) => ({ label, type: "scene", boost: -1 }))),
    ];
    return options.length ? { from: line.from + forced, options, validFor: CUE_SO_FAR } : null;
  }

  return null;
}
