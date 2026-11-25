import { titleValue, type PaperSize, type TitlePageEntry } from "@/lib/fountain";
import { InlineText } from "./inline-text";
import { Sheet } from "./screenplay-page";

const CENTER_KEYS = ["title", "credit", "author", "authors", "source"] as const;
const CORNER_KEYS = ["draft date", "date", "contact", "copyright", "notes", "revision"] as const;

function Values({ values }: { values: string[] }) {
  return values.map((value, i) => (
    <p key={i}>
      <InlineText text={value} />
    </p>
  ));
}

/** Renders the Fountain title page as its own (unnumbered) sheet. */
export function TitlePage({ entries, paper }: { entries: TitlePageEntry[]; paper: PaperSize }) {
  if (entries.length === 0) return null;
  return (
    <Sheet paper={paper} label="Title page">
      <div className="absolute inset-x-[1in] top-[3.5in] flex flex-col items-center gap-(--line) text-center">
        {CENTER_KEYS.map((key) => {
          const values = titleValue(entries, key);
          return values.length > 0 ? (
            <div key={key} className={key === "title" ? "uppercase" : undefined}>
              <Values values={values} />
            </div>
          ) : null;
        })}
      </div>
      <div className="absolute bottom-[1in] left-[1.5in] flex flex-col gap-(--line)">
        {CORNER_KEYS.map((key) => {
          const values = titleValue(entries, key);
          return values.length > 0 ? (
            <div key={key}>
              <Values values={values} />
            </div>
          ) : null;
        })}
      </div>
    </Sheet>
  );
}
