"use client";

import { useEffect, useRef, type MouseEvent } from "react";
import { useElementWidth } from "@/hooks/use-element-width";
import type { Page, PaperSize, TitlePageEntry } from "@/lib/fountain";
import { ScreenplayPage } from "./screenplay-page";
import { TitlePage } from "./title-page";

const GUTTER_PX = 48;
const CSS_PX_PER_INCH = 96;

export interface ScreenplayPreviewProps {
  pages: Page[];
  titlePage: TitlePageEntry[];
  paper: PaperSize;
  showSceneNumbers: boolean;
  /** Source line to keep in view (follows the editor cursor). */
  followLine?: number;
  /** One-shot request to scroll a line to the top. */
  navigation?: { line: number; nonce: number } | null;
  /** Called when the reader clicks an element. */
  onSelectLine?(line: number): void;
}

/** Finds the rendered element for the closest source line at or before `line`. */
function elementForLine(root: HTMLElement, line: number): HTMLElement | null {
  let best: HTMLElement | null = null;
  let bestLine = -1;
  for (const element of root.querySelectorAll<HTMLElement>("[data-line]")) {
    const value = Number(element.dataset.line);
    if (value <= line && value >= bestLine) {
      best = element;
      bestLine = value;
    }
  }
  return best;
}

/** Paginated, print-ready screenplay view that scales to its container. */
export function ScreenplayPreview({
  pages,
  titlePage,
  paper,
  showSceneNumbers,
  followLine,
  navigation,
  onSelectLine,
}: ScreenplayPreviewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const pagesRef = useRef<HTMLDivElement>(null);
  const width = useElementWidth(scrollRef);
  const zoom = width ? Math.min(1, (width - GUTTER_PX) / (paper.widthIn * CSS_PX_PER_INCH)) : 1;
  const followed = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (followLine === undefined || !pagesRef.current) return;
    const target = elementForLine(pagesRef.current, followLine);
    if (target && target !== followed.current) {
      followed.current = target;
      target.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [followLine, pages]);

  useEffect(() => {
    if (!navigation || !pagesRef.current) return;
    elementForLine(pagesRef.current, navigation.line)?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [navigation]);

  const onClick = (event: MouseEvent) => {
    const target = (event.target as HTMLElement).closest<HTMLElement>("[data-line]");
    if (target && onSelectLine) onSelectLine(Number(target.dataset.line));
  };

  return (
    <div ref={scrollRef} className="h-full overflow-auto bg-(--script-desk)">
      <div
        ref={pagesRef}
        onClick={onClick}
        style={{ zoom }}
        className="print-area mx-auto flex w-fit flex-col items-center gap-8 px-6 py-8"
      >
        <TitlePage entries={titlePage} paper={paper} />
        {pages.map((page) => (
          <ScreenplayPage key={page.number} page={page} paper={paper} showSceneNumbers={showSceneNumbers} />
        ))}
      </div>
    </div>
  );
}
