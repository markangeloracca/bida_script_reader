"use client";

import { pageAtLine, sceneAtLine, type LineType } from "@/lib/fountain";
import { plural } from "@/lib/format";
import { useDocumentStore } from "@/lib/store/document-store";
import { cn } from "@/lib/utils";

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

/**
 * Page, scene, word count and the element under the cursor. While reading,
 * the position follows the scroll and the current scene is always shown.
 */
export function StatusBar({ reading = false }: { reading?: boolean }) {
  const pages = useDocumentStore((s) => s.pages);
  const outline = useDocumentStore((s) => s.outline);
  const stats = useDocumentStore((s) => s.stats);
  const cursorLine = useDocumentStore((s) => s.cursorLine);
  const lineType = useDocumentStore((s) => s.script.lines[s.cursorLine]?.type ?? "empty");
  const scene = sceneAtLine(outline, cursorLine);

  return (
    <footer className="flex min-h-7 shrink-0 items-center gap-4 border-t bg-background px-3 pb-[env(safe-area-inset-bottom)] text-xs text-muted-foreground tabular-nums">
      <span className="shrink-0">
        Page {pageAtLine(pages, cursorLine)} of {pages.length}
      </span>
      <span className={cn("min-w-0 truncate", reading ? "flex-1" : "hidden sm:inline")}>
        {scene?.kind === "scene" ? `Scene ${scene.sceneNumber}: ${scene.text}` : "No scene"}
      </span>
      <span className={"ml-auto hidden shrink-0 sm:inline"}>{plural(stats.scenes, "scene")}</span>
      <span className={cn("shrink-0", reading && "hidden sm:inline")}>{plural(stats.words, "word")}</span>
      {!reading && (
        <span className="w-24 shrink-0 text-right" aria-live="polite">
          {ELEMENT_LABELS[lineType]}
        </span>
      )}
    </footer>
  );
}
