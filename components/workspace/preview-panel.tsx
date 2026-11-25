"use client";

import { ScreenplayPreview } from "@/components/preview/screenplay-preview";
import { useDocumentStore } from "@/lib/store/document-store";
import { useSettingsStore } from "@/lib/store/settings-store";

/** Connects the paginated preview to the stores; follows the cursor in split view. */
export function PreviewPanel({ split }: { split: boolean }) {
  const pages = useDocumentStore((s) => s.pages);
  const titlePage = useDocumentStore((s) => s.script.titlePage);
  const paper = useDocumentStore((s) => s.paper);
  const cursorLine = useDocumentStore((s) => s.cursorLine);
  const navigation = useDocumentStore((s) => s.navigation);
  const navigateTo = useDocumentStore((s) => s.navigateTo);
  const showSceneNumbers = useSettingsStore((s) => s.showSceneNumbers);

  return (
    <ScreenplayPreview
      pages={pages}
      titlePage={titlePage}
      paper={paper}
      showSceneNumbers={showSceneNumbers}
      followLine={split ? cursorLine : undefined}
      navigation={navigation?.target === "all" ? navigation : null}
      onSelectLine={split ? (line) => navigateTo(line, "editor") : undefined}
    />
  );
}
