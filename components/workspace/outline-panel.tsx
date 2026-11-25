"use client";

import { ListTreeIcon } from "lucide-react";
import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { sceneAtLine, type OutlineItem } from "@/lib/fountain";
import { useDocumentStore } from "@/lib/store/document-store";
import { cn } from "@/lib/utils";

function OutlineEntry({ item, active, onSelect }: { item: OutlineItem; active: boolean; onSelect(line: number): void }) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (active) ref.current?.scrollIntoView({ block: "nearest" });
  }, [active]);

  return (
    <button
      ref={ref}
      type="button"
      onClick={() => onSelect(item.line)}
      aria-current={active ? "location" : undefined}
      className={cn(
        "flex w-full items-baseline gap-2 rounded-md px-2 py-2 text-left text-sm md:py-1 outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/50",
        active && "bg-accent text-accent-foreground",
        item.kind === "section" && "mt-3 font-semibold text-(--script-accent)",
        item.kind === "synopsis" && "text-xs text-muted-foreground italic",
      )}
      style={item.kind === "section" ? { paddingLeft: `${0.5 + (item.depth - 1) * 0.75}rem` } : undefined}
    >
      {item.kind === "scene" && (
        <span className="w-6 shrink-0 text-right text-xs text-muted-foreground tabular-nums">{item.sceneNumber}</span>
      )}
      <span
        className={cn(
          "min-w-0",
          item.kind === "scene" ? "truncate font-screenplay text-[0.8rem]" : "line-clamp-2",
          item.kind === "synopsis" && "pl-8",
        )}
      >
        {item.text}
      </span>
    </button>
  );
}

/** Navigator listing sections, scenes and synopses; highlights the current scene. */
export function OutlinePanel({ onNavigate }: { onNavigate?: () => void }) {
  const outline = useDocumentStore((s) => s.outline);
  const cursorLine = useDocumentStore((s) => s.cursorLine);
  const navigateTo = useDocumentStore((s) => s.navigateTo);
  const current = sceneAtLine(outline, cursorLine);
  const scenes = outline.filter((item) => item.kind === "scene").length;

  return (
    <nav aria-label="Script outline" className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-10 shrink-0 items-center gap-2 border-b px-3 text-xs font-medium text-muted-foreground">
        <ListTreeIcon className="size-3.5" aria-hidden />
        Outline
        <span className="ml-auto tabular-nums">{scenes} scenes</span>
      </div>
      {outline.length === 0 ? (
        <p className="p-4 text-sm text-muted-foreground">Scene headings, # sections and = synopses will appear here.</p>
      ) : (
        <ScrollArea className="min-h-0 flex-1">
          <div className="flex flex-col gap-0.5 p-2">
            {outline.map((item) => (
              <OutlineEntry
                key={`${item.kind}-${item.line}`}
                item={item}
                active={item === current}
                onSelect={(line) => {
                  navigateTo(line);
                  onNavigate?.();
                }}
              />
            ))}
          </div>
        </ScrollArea>
      )}
    </nav>
  );
}
