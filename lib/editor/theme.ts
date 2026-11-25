import { EditorView } from "@codemirror/view";

/**
 * Screenplay-style editor theme. Colours come from CSS variables defined in
 * globals.css, so the editor follows light/dark mode without reconfiguring.
 * Indents are in `ch` (Courier: 10 characters per inch, 1.5in left margin).
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
    width: "min(64ch, 100%)",
    maxWidth: "64ch",
    margin: "0 auto",
    padding: "3rem 1ch 40vh",
    caretColor: "var(--script-ink)",
  },
  ".cm-line": { padding: "0" },
  ".cm-cursor, .cm-dropCursor": { borderLeftColor: "var(--script-ink)", borderLeftWidth: "2px" },
  "&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection": {
    backgroundColor: "var(--script-selection) !important",
  },
  ".cm-activeLine": { backgroundColor: "transparent" },

  ".cm-fountain-scene-heading": { fontWeight: "700", textTransform: "uppercase", paddingTop: "1.2em" },
  ".cm-fountain-character": { paddingLeft: "22ch", textTransform: "uppercase" },
  ".cm-fountain-dialogue": { paddingLeft: "10ch", paddingRight: "15ch" },
  ".cm-fountain-parenthetical": { paddingLeft: "16ch", paddingRight: "19ch" },
  ".cm-fountain-lyrics": { paddingLeft: "10ch", fontStyle: "italic" },
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
