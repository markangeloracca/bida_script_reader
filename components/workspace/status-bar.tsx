"use client";

import { pageAtLine, sceneAtLine, type LineType } from "@/lib/fountain";
import { plural } from "@/lib/format";
import { useDocumentStore } from "@/lib/store/document-store";

const ELEMENT_LABELS: Record<LineType, string> = {
  empty: "—",
  title_page: "Title page",
  scene_heading: "Scene heading",
  action: "Action",
  character: "Character",
  dialogue: "Dialogue",
  parenthetical: "Parenthetical",
  transition: "Transition",
  centered: "Centered",
  lyrics: "Lyrics",
  page_break: "Page break",
  section: "Section",
  synopsis: "Synopsis",
  note: "Note",
  boneyard: "Boneyard",
};

/** Page, scene, word count and the element type under the cursor. */
export function StatusBar() {
  const pages = useDocumentStore((s) => s.pages);
  const outline = useDocumentStore((s) => s.outline);
  const stats = useDocumentStore((s) => s.stats);
  const cursorLine = useDocumentStore((s) => s.cursorLine);
  const lineType = useDocumentStore((s) => s.script.lines[s.cursorLine]?.type ?? "empty");
  const scene = sceneAtLine(outline, cursorLine);

  return (
    <footer className="flex h-7 shrink-0 items-center gap-4 border-t bg-background px-3 text-xs text-muted-foreground tabular-nums">
      <span>
        Page {pageAtLine(pages, cursorLine)} of {pages.length}
      </span>
      <span className="hidden min-w-0 truncate sm:inline">
        {scene?.kind === "scene" ? `Scene ${scene.sceneNumber}: ${scene.text}` : "No scene"}
      </span>
      <span className="ml-auto hidden sm:inline">{plural(stats.scenes, "scene")}</span>
      <span>{plural(stats.words, "word")}</span>
      <span className="w-24 text-right" aria-live="polite">
        {ELEMENT_LABELS[lineType]}
      </span>
    </footer>
  );
}
