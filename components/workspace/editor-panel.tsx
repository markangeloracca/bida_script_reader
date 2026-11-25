"use client";

import FountainEditor from "@/components/editor/fountain-editor";
import { useDocumentStore } from "@/lib/store/document-store";
import { useSettingsStore } from "@/lib/store/settings-store";

/** Connects the presentational editor to the document and settings stores. */
export function EditorPanel() {
  const text = useDocumentStore((s) => s.text);
  const setText = useDocumentStore((s) => s.setText);
  const setCursorLine = useDocumentStore((s) => s.setCursorLine);
  const navigation = useDocumentStore((s) => s.navigation);
  const fontSize = useSettingsStore((s) => s.fontSize);
  const focusMode = useSettingsStore((s) => s.focusMode);

  return (
    <div className="h-full min-h-0 bg-(--script-paper)">
      <FountainEditor
        value={text}
        onChange={setText}
        onCursorLine={setCursorLine}
        navigation={navigation}
        fontSize={fontSize}
        typewriter={focusMode}
      />
    </div>
  );
}
