import { titleValue, type PaperSize, type TitlePageEntry } from "@/lib/fountain";
import { cn } from "@/lib/utils";
import { InlineText } from "./inline-text";
import { Sheet } from "./screenplay-page";

const CENTER_KEYS = ["title", "credit", "author", "authors", "source"] as const;
const CORNER_KEYS = ["draft date", "date", "contact", "copyright", "notes", "revision"] as const;

/** Renders the title-page values for a group of keys, one block per key. */
function TitleGroup({ entries, keys, className }: { entries: TitlePageEntry[]; keys: readonly string[]; className: string }) {
  return (
    <div className={className}>
      {keys.map((key) => {
        const values = titleValue(entries, key);
        if (values.length === 0) return null;
        return (
          <div key={key} className={key === "title" ? "font-bold uppercase" : undefined}>
            {values.map((value, i) => (
              <p key={i}>
                <InlineText text={value} />
              </p>
            ))}
          </div>
        );
      })}
    </div>
  );
}

/** The Fountain title page as its own (unnumbered) printed sheet. */
export function TitlePage({ entries, paper }: { entries: TitlePageEntry[]; paper: PaperSize }) {
  if (entries.length === 0) return null;
  return (
    <Sheet paper={paper} label="Title page">
      <TitleGroup
        entries={entries}
        keys={CENTER_KEYS}
        className="absolute inset-x-[1in] top-[3.5in] flex flex-col items-center gap-(--line) text-center"
      />
      <TitleGroup entries={entries} keys={CORNER_KEYS} className="absolute bottom-[1in] left-[1.5in] flex flex-col gap-(--line)" />
    </Sheet>
  );
}

/** The title page as a header block for the continuous reading layout. */
export function TitleBlock({ entries, className }: { entries: TitlePageEntry[]; className?: string }) {
  if (entries.length === 0) return null;
  return (
    <header aria-label="Title page" className={cn("flex flex-col gap-(--line) pb-[calc(var(--line)*2)]", className)}>
      <TitleGroup entries={entries} keys={CENTER_KEYS} className="flex flex-col items-center gap-(--line) pt-(--line) text-center" />
      <TitleGroup entries={entries} keys={CORNER_KEYS} className="flex flex-col gap-(--line) text-[0.85em] text-(--script-muted)" />
    </header>
  );
}
