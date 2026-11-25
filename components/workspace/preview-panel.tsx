"use client";

import { ScreenplayPreview } from "@/components/preview/screenplay-preview";
import { useIsMobile } from "@/hooks/use-media-query";
import { useDocumentStore } from "@/lib/store/document-store";
import { resolveReaderLayout, useSettingsStore } from "@/lib/store/settings-store";

/**
 * Connects the reader to the stores. In split view it follows the editor
 * cursor; when reading on its own, the scroll position becomes the current
 * position, so the outline and status bar track what you are reading.
 */
export function PreviewPanel({ split }: { split: boolean }) {
  const blocks = useDocumentStore((s) => s.blocks);
  const pages = useDocumentStore((s) => s.pages);
  const titlePage = useDocumentStore((s) => s.script.titlePage);
  const paper = useDocumentStore((s) => s.paper);
  const cursorLine = useDocumentStore((s) => s.cursorLine);
  const navigation = useDocumentStore((s) => s.navigation);
  const navigateTo = useDocumentStore((s) => s.navigateTo);
  const setCursorLine = useDocumentStore((s) => s.setCursorLine);
  const showSceneNumbers = useSettingsStore((s) => s.showSceneNumbers);
  const fontSize = useSettingsStore((s) => s.fontSize);
  const readerLayout = useSettingsStore((s) => s.readerLayout);
  const isMobile = useIsMobile();

  return (
    <ScreenplayPreview
      layout={resolveReaderLayout(readerLayout, isMobile)}
      blocks={blocks}
      pages={pages}
      titlePage={titlePage}
      paper={paper}
      showSceneNumbers={showSceneNumbers}
      fontSize={fontSize}
      followLine={split ? cursorLine : undefined}
      navigation={navigation?.target === "all" ? navigation : null}
      onSelectLine={split ? (line) => navigateTo(line, "editor") : undefined}
      onVisibleLine={split ? undefined : setCursorLine}
    />
  );
}
