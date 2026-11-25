import { toSpans } from "@/lib/fountain";
import { cn } from "@/lib/utils";

/** Renders Fountain inline markup (bold, italic, underline) with notes removed. */
export function InlineText({ text }: { text: string }) {
  return (
    <>
      {toSpans(text).map((span, i) =>
        span.bold || span.italic || span.underline ? (
          <span key={i} className={cn(span.bold && "font-bold", span.italic && "italic", span.underline && "underline")}>
            {span.text}
          </span>
        ) : (
          span.text
        ),
      )}
    </>
  );
}
