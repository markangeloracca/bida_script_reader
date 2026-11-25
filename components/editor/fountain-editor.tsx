"use client";

import { EditorSelection } from "@codemirror/state";
import { EditorView, type ViewUpdate } from "@codemirror/view";
import CodeMirror from "@uiw/react-codemirror";
import { useCallback, useEffect, useMemo, useRef, type CSSProperties } from "react";
import { fountainExtensions } from "@/lib/editor";

export interface FountainEditorProps {
  value: string;
  onChange(value: string): void;
  fontSize: number;
  typewriter: boolean;
  /** One-shot request to move the cursor to a source line. */
  navigation?: { line: number; nonce: number } | null;
  /** Reports the zero-based line of the cursor. */
  onCursorLine?(line: number): void;
}

const BASIC_SETUP = {
  lineNumbers: false,
  foldGutter: false,
  highlightActiveLine: false,
  highlightActiveLineGutter: false,
  autocompletion: false,
  bracketMatching: false,
  indentOnInput: false,
  syntaxHighlighting: false,
  tabSize: 4,
} as const;

/** CodeMirror 6 editor that formats Fountain like a screenplay as you type. */
export default function FountainEditor({ value, onChange, fontSize, typewriter, navigation, onCursorLine }: FountainEditorProps) {
  const viewRef = useRef<EditorView | null>(null);
  const extensions = useMemo(() => fountainExtensions({ typewriter }), [typewriter]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view || !navigation) return;
    const lineNumber = Math.min(navigation.line + 1, view.state.doc.lines);
    const pos = view.state.doc.line(lineNumber).from;
    view.dispatch({
      selection: EditorSelection.cursor(pos),
      effects: EditorView.scrollIntoView(pos, { y: "start", yMargin: 48 }),
    });
    view.focus();
  }, [navigation]);

  const onUpdate = useCallback(
    (update: ViewUpdate) => {
      if (!onCursorLine || !(update.selectionSet || update.docChanged)) return;
      onCursorLine(update.state.doc.lineAt(update.state.selection.main.head).number - 1);
    },
    [onCursorLine],
  );

  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      onUpdate={onUpdate}
      onCreateEditor={(view) => {
        viewRef.current = view;
      }}
      extensions={extensions}
      basicSetup={BASIC_SETUP}
      indentWithTab={false}
      theme="none"
      autoFocus
      height="100%"
      className="h-full"
      style={{ "--editor-font-size": `${fontSize}px` } as CSSProperties}
    />
  );
}
