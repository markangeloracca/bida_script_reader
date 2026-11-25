/**
 * Public API of the CodeMirror Fountain integration. Depends on
 * `@/lib/fountain` only; knows nothing about React, storage or app state.
 */
import { acceptCompletion, autocompletion } from "@codemirror/autocomplete";
import { Prec, type Extension } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { fountainCompletions } from "./autocomplete";
import { cycleElement } from "./element-cycle";
import { fountainDecorations, lineTypesField } from "./fountain-language";
import { fountainTheme } from "./theme";

export { cycleElement, forceElement, stripForcing, CYCLE } from "./element-cycle";
export { lineTypeAt, lineTypesField } from "./fountain-language";

export interface FountainEditorOptions {
  /** Keep the cursor line near the vertical centre (typewriter scrolling). */
  typewriter?: boolean;
}

const elementKeymap = Prec.high(
  keymap.of([
    { key: "Tab", run: (view) => acceptCompletion(view) || cycleElement(view, 1) },
    { key: "Shift-Tab", run: (view) => cycleElement(view, -1) },
  ]),
);

const typewriterScrolling = EditorView.scrollMargins.of((view) => {
  const margin = view.scrollDOM.clientHeight * 0.4;
  return { top: margin, bottom: margin };
});

/** All CodeMirror extensions for editing Fountain. */
export function fountainExtensions({ typewriter = false }: FountainEditorOptions = {}): Extension[] {
  return [
    lineTypesField,
    fountainDecorations,
    fountainTheme,
    EditorView.lineWrapping,
    autocompletion({ override: [fountainCompletions], icons: false }),
    elementKeymap,
    EditorView.contentAttributes.of({ "aria-label": "Screenplay editor", spellcheck: "true", autocapitalize: "sentences" }),
    ...(typewriter ? [typewriterScrolling] : []),
  ];
}
