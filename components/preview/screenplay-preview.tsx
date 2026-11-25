"use client";

import { useEffect, useRef, type MouseEvent } from "react";
import { useElementWidth } from "@/hooks/use-element-width";
import type { Block, Page, PaperSize, TitlePageEntry } from "@/lib/fountain";
import { FlowView } from "./flow-view";
import { ScreenplayPage } from "./screenplay-page";
import { TitlePage } from "./title-page";

const GUTTER_PX = 48;
const CSS_PX_PER_INCH = 96;

export type PreviewLayout = "pages" | "flow";

export interface ScreenplayPreviewProps {
  layout: PreviewLayout;
  blocks: Block[];
  pages: Page[];
  titlePage: TitlePageEntry[];
  paper: PaperSize;
  showSceneNumbers: boolean;
  /** Text size for the continuous layout, in CSS pixels. */
  fontSize: number;
  /** Source line to keep in view (follows the editor cursor). */
  followLine?: number;
  /** One-shot request to scroll a line to the top. */
  navigation?: { line: number; nonce: number } | null;
  /** Called when the reader clicks an element. */
  onSelectLine?(line: number): void;
  /** Reports the source line at the top of the viewport while scrolling. */
  onVisibleLine?(line: number): void;
}

const lineOf = (element: HTMLElement) => Number(element.dataset.line);

/** Finds the rendered element for the closest source line at or before `line`. */
function elementForLine(root: HTMLElement, line: number): HTMLElement | null {
  let best: HTMLElement | null = null;
  let bestLine = -1;
  for (const element of root.querySelectorAll<HTMLElement>("[data-line]")) {
    const value = lineOf(element);
    if (value <= line && value >= bestLine) {
      best = element;
      bestLine = value;
    }
  }
  return best;
}

/** Binary-searches the first element whose bottom is below `top` (elements are in reading order). */
function firstVisibleLine(root: HTMLElement, top: number): number | undefined {
  const elements = root.querySelectorAll<HTMLElement>("[data-line]");
  let low = 0;
  let high = elements.length - 1;
  let found: HTMLElement | undefined;
  while (low <= high) {
    const mid = (low + high) >> 1;
    if (elements[mid].getBoundingClientRect().bottom > top) {
      found = elements[mid];
      high = mid - 1;
    } else {
      low = mid + 1;
    }
  }
  return found ? lineOf(found) : undefined;
}

/** Screenplay reader: printed pages scaled to fit, or a continuous reflowed layout. */
export function ScreenplayPreview({
  layout,
  blocks,
  pages,
  titlePage,
  paper,
  showSceneNumbers,
  fontSize,
  followLine,
  navigation,
  onSelectLine,
  onVisibleLine,
}: ScreenplayPreviewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const width = useElementWidth(scrollRef);
  const zoom = layout === "pages" && width ? Math.min(1, (width - GUTTER_PX) / (paper.widthIn * CSS_PX_PER_INCH)) : 1;
  const followed = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (followLine === undefined || !contentRef.current) return;
    const target = elementForLine(contentRef.current, followLine);
    if (target && target !== followed.current) {
      followed.current = target;
      target.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [followLine, pages, layout]);

  useEffect(() => {
    if (!navigation || !contentRef.current) return;
    elementForLine(contentRef.current, navigation.line)?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [navigation]);

  // Report reading position (throttled to one measurement per frame).
  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller || !onVisibleLine) return;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (!contentRef.current) return;
        const line = firstVisibleLine(contentRef.current, scroller.getBoundingClientRect().top + 8);
        if (line !== undefined) onVisibleLine(line);
      });
    };
    scroller.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      scroller.removeEventListener("scroll", onScroll);
    };
  }, [onVisibleLine, layout]);

  const onClick = (event: MouseEvent) => {
    const target = (event.target as HTMLElement).closest<HTMLElement>("[data-line]");
    if (target && onSelectLine) onSelectLine(lineOf(target));
  };

  return (
    <div
      ref={scrollRef}
      className={
        layout === "pages"
          ? "h-full overflow-auto overscroll-contain bg-(--script-desk)"
          : "h-full overflow-auto overscroll-contain bg-(--script-paper)"
      }
    >
      {layout === "pages" ? (
        <div
          ref={contentRef}
          onClick={onClick}
          style={{ zoom }}
          className="print-area mx-auto flex w-fit flex-col items-center gap-8 px-6 py-8"
        >
          <TitlePage entries={titlePage} paper={paper} />
          {pages.map((page) => (
            <ScreenplayPage key={page.number} page={page} paper={paper} showSceneNumbers={showSceneNumbers} />
          ))}
        </div>
      ) : (
        <div ref={contentRef} onClick={onClick} className="print-area">
          <FlowView blocks={blocks} pages={pages} titlePage={titlePage} showSceneNumbers={showSceneNumbers} fontSize={fontSize} />
        </div>
      )}
    </div>
  );
}
