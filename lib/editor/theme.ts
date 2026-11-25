import { EditorView } from "@codemirror/view";

/**
 * Screenplay-style editor theme. Colours come from CSS variables defined in
 * globals.css, so the editor follows light/dark mode without reconfiguring.
 * Indents are percentages of the 64ch column (e.g. character cue 22ch ≈ 34%),
 * so the screenplay shape is kept on narrow phone screens too.
 */
export const fountainTheme = EditorView.theme({
  "&": {
    height: "100%",
    backgroundColor: "var(--script-paper)",
    color: "var(--script-ink)",
    fontSize: "var(--editor-font-size, 16px)",
  },
  "&.cm-focused": { outline: "none" },
  ".cm-scroller": {
    fontFamily: "var(--font-screenplay), 'Courier Prime', 'Courier New', monospace",
    lineHeight: "1.6",
  },
  ".cm-content": {
    // CodeMirror makes the content flex-grow; pin it to a centred screenplay column.
    flexGrow: "0",
    flexShrink: "1",
    width: "min(calc(64ch + 2.5rem), 100%)",
    margin: "0 auto",
    padding: "2.5rem 1.25rem 40vh",
    caretColor: "var(--script-ink)",
  },
  ".cm-line": { padding: "0" },
  ".cm-cursor, .cm-dropCursor": { borderLeftColor: "var(--script-ink)", borderLeftWidth: "2px" },
  "&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection": {
    backgroundColor: "var(--script-selection) !important",
  },
  ".cm-activeLine": { backgroundColor: "transparent" },

  ".cm-fountain-scene-heading": { fontWeight: "700", textTransform: "uppercase", paddingTop: "1.2em" },
  ".cm-fountain-character": { paddingLeft: "34%", textTransform: "uppercase" },
  ".cm-fountain-dialogue": { paddingLeft: "16%", paddingRight: "20%" },
  ".cm-fountain-parenthetical": { paddingLeft: "25%", paddingRight: "25%" },
  ".cm-fountain-lyrics": { paddingLeft: "16%", fontStyle: "italic" },
  ".cm-fountain-transition": { textAlign: "right", textTransform: "uppercase" },
  ".cm-fountain-centered": { textAlign: "center" },
  ".cm-fountain-page-break": { color: "var(--script-muted)", textAlign: "center" },
  ".cm-fountain-section": {
    color: "var(--script-accent)",
    fontFamily: "var(--font-sans), system-ui, sans-serif",
    fontWeight: "700",
  },
  ".cm-fountain-synopsis": { color: "var(--script-muted)", fontStyle: "italic" },
  ".cm-fountain-title-page": { color: "var(--script-muted)" },
  ".cm-fountain-note, .cm-fountain-note *": { color: "var(--script-note)" },
  ".cm-fountain-boneyard, .cm-fountain-boneyard *": { color: "var(--script-muted)", opacity: "0.6" },
  ".cm-fountain-marker": { color: "var(--script-muted)", opacity: "0.55" },
  ".cm-fountain-bold": { fontWeight: "700" },
  ".cm-fountain-italic": { fontStyle: "italic" },
  ".cm-fountain-underline": { textDecoration: "underline" },

  ".cm-tooltip.cm-tooltip-autocomplete": {
    backgroundColor: "var(--popover)",
    color: "var(--popover-foreground)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    overflow: "hidden",
  },
  ".cm-tooltip-autocomplete ul li[aria-selected]": {
    backgroundColor: "var(--accent)",
    color: "var(--accent-foreground)",
  },
  ".cm-panels": { backgroundColor: "var(--popover)", color: "var(--popover-foreground)" },
  ".cm-searchMatch": { backgroundColor: "var(--script-selection)" },
});
