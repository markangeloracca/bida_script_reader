import { memo, type CSSProperties, type ReactNode } from "react";
import type { Page, PaperSize } from "@/lib/fountain";
import { PAGE_GEOMETRY } from "./geometry";
import { PageElementView } from "./page-element";

/** CSS geometry for one sheet of paper; the line height matches the paginator's budget. */
export function paperStyle(paper: PaperSize): CSSProperties {
  return {
    ...PAGE_GEOMETRY,
    width: `${paper.widthIn}in`,
    height: `${paper.heightIn}in`,
    ["--line" as string]: `${(paper.heightIn - 2) / paper.linesPerPage}in`,
  };
}

export function Sheet({ paper, children, label }: { paper: PaperSize; children: ReactNode; label: string }) {
  return (
    <section
      aria-label={label}
      style={paperStyle(paper)}
      className="screenplay-page relative shrink-0 bg-(--script-paper) pt-[1in] pr-[1in] pb-[1in] pl-[1.5in] font-screenplay text-[12pt] leading-(--line) text-(--script-ink) shadow-(--script-shadow) [contain-intrinsic-size:auto_11in] [content-visibility:auto]"
    >
      {children}
    </section>
  );
}

interface ScreenplayPageProps {
  page: Page;
  paper: PaperSize;
  showSceneNumbers: boolean;
}

export const ScreenplayPage = memo(function ScreenplayPage({ page, paper, showSceneNumbers }: ScreenplayPageProps) {
  return (
    <Sheet paper={paper} label={`Page ${page.number}`}>
      {page.number > 1 && <span className="absolute top-[0.5in] right-[1in] select-none">{page.number}.</span>}
      <div className="[&>*+*]:mt-(--line)">
        {page.elements.map((element, i) => (
          <PageElementView key={`${element.line}-${i}`} element={element} showSceneNumbers={showSceneNumbers} />
        ))}
      </div>
    </Sheet>
  );
});
