import { StateField, type EditorState, type Range } from "@codemirror/state";
import { Decoration, ViewPlugin, type DecorationSet, type EditorView, type ViewUpdate } from "@codemirror/view";
import { classifyLines, findInlineRanges, type LineType } from "@/lib/fountain";

/** Line types of the whole document, recomputed on every change. */
export const lineTypesField = StateField.define<LineType[]>({
  create: (state) => classify(state),
  update: (value, tr) => (tr.docChanged ? classify(tr.state) : value),
});

function classify(state: EditorState): LineType[] {
  return classifyLines(state.doc.toString()).map((line) => line.type);
}

/** Returns the Fountain type of a 1-based CodeMirror line number. */
export function lineTypeAt(state: EditorState, lineNumber: number): LineType {
  return state.field(lineTypesField)[lineNumber - 1] ?? "empty";
}

export const lineClass = (type: LineType) => `cm-fountain-${type.replace("_", "-")}`;

const lineDecorations = new Map<LineType, Decoration>();
const lineDecoration = (type: LineType) => {
  let deco = lineDecorations.get(type);
  if (!deco) {
    deco = Decoration.line({ class: lineClass(type) });
    lineDecorations.set(type, deco);
  }
  return deco;
};

const mark = (className: string) => Decoration.mark({ class: className });
const MARKS = {
  marker: mark("cm-fountain-marker"),
  bold: mark("cm-fountain-bold"),
  italic: mark("cm-fountain-italic"),
  bold_italic: mark("cm-fountain-bold cm-fountain-italic"),
  underline: mark("cm-fountain-underline"),
  note: mark("cm-fountain-note"),
  boneyard: mark("cm-fountain-boneyard"),
} as const;

/** Leading characters that force an element type (dimmed in the editor). */
const FORCING_MARKER: Partial<Record<LineType, RegExp>> = {
  scene_heading: /^\s*\./,
  character: /^\s*@/,
  action: /^\s*!/,
  transition: /^\s*>/,
  centered: /^\s*>/,
  lyrics: /^\s*~/,
  section: /^\s*#+/,
  synopsis: /^\s*=/,
};

function lineMarks(type: LineType, text: string, from: number): Range<Decoration>[] {
  const ranges: Range<Decoration>[] = [];
  const forced = FORCING_MARKER[type]?.exec(text);
  if (forced) ranges.push(MARKS.marker.range(from + forced.index, from + forced[0].length));
  if (type === "centered" && text.trimEnd().endsWith("<")) {
    const end = text.trimEnd().length;
    ranges.push(MARKS.marker.range(from + end - 1, from + end));
  }
  if (type === "scene_heading") {
    const number = /#[\w.-]+#\s*$/.exec(text);
    if (number) ranges.push(MARKS.marker.range(from + number.index, from + text.length));
  }
  if (type === "note" || type === "boneyard" || type === "title_page") return ranges;

  for (const range of findInlineRanges(text)) {
    if (range.to <= range.from) continue;
    ranges.push(MARKS[range.kind].range(from + range.from, from + range.to));
    if (range.kind !== "note" && range.kind !== "boneyard") {
      ranges.push(MARKS.marker.range(from + range.from, from + range.from + range.markerLength));
      ranges.push(MARKS.marker.range(from + range.to - range.markerLength, from + range.to));
    }
  }
  return ranges;
}

function buildDecorations(view: EditorView): DecorationSet {
  const types = view.state.field(lineTypesField);
  const ranges: Range<Decoration>[] = [];
  for (const { from, to } of view.visibleRanges) {
    for (let pos = from; pos <= to;) {
      const line = view.state.doc.lineAt(pos);
      const type = types[line.number - 1] ?? "empty";
      ranges.push(lineDecoration(type).range(line.from));
      ranges.push(...lineMarks(type, line.text, line.from));
      pos = line.to + 1;
    }
  }
  return Decoration.set(ranges, true);
}

/** Formats each visible line as its screenplay element. */
export const fountainDecorations = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    constructor(view: EditorView) {
      this.decorations = buildDecorations(view);
    }
    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged) this.decorations = buildDecorations(update.view);
    }
  },
  { decorations: (plugin) => plugin.decorations },
);
