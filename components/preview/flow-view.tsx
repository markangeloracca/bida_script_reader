import { Fragment, memo, useMemo, type CSSProperties } from "react";
import { pageStartLines, type Block, type Page, type TitlePageEntry } from "@/lib/fountain";
import { cn } from "@/lib/utils";
import { FLOW_GEOMETRY } from "./geometry";
import { PageElementView } from "./page-element";
import { TitleBlock } from "./title-page";

interface FlowViewProps {
  blocks: Block[];
  pages: Page[];
  titlePage: TitlePageEntry[];
  showSceneNumbers: boolean;
  fontSize: number;
}

/** Thin rule marking where a printed page begins, so readers can cite page numbers. */
function PageMarker({ number }: { number: number }) {
  return (
    <div role="separator" aria-label={`Page ${number}`} className="flex items-center gap-3 font-sans text-[0.7rem] text-(--script-muted)">
      <span className="h-px flex-1 bg-(--script-muted)/25" />
      <span className="tabular-nums">{number}.</span>
    </div>
  );
}

/**
 * Continuous, reflowed screenplay for small screens: whole blocks (no
 * `(MORE)`/`(CONT'D)` splits), readable type, and page markers in place of
 * page boundaries.
 */
export const FlowView = memo(function FlowView({ blocks, pages, titlePage, showSceneNumbers, fontSize }: FlowViewProps) {
  const pageStarts = useMemo(() => pageStartLines(pages), [pages]);
  const style = { ...FLOW_GEOMETRY, fontSize: `${fontSize}px`, "--line": "1.6em" } as CSSProperties;

  return (
    <article
      data-layout="flow"
      style={style}
      className={cn(
        "mx-auto w-full max-w-[66ch] pt-8 pb-[60vh] font-screenplay [&_[data-line]]:scroll-mt-6 leading-(--line) break-words text-(--script-ink) [&>*+*]:mt-(--line)",
        showSceneNumbers ? "pr-5 pl-11" : "px-5",
      )}
    >
      <TitleBlock entries={titlePage} />
      {blocks.map((block, i) => {
        const page = pageStarts.get(block.line);
        return (
          <Fragment key={`${block.line}-${i}`}>
            {page !== undefined && page > 1 && <PageMarker number={page} />}
            {block.kind === "page_break" ? null : <PageElementView element={block} showSceneNumbers={showSceneNumbers} />}
          </Fragment>
        );
      })}
    </article>
  );
});
