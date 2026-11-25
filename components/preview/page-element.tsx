import { assertNever, type DialogueBlock, type PageElement } from "@/lib/fountain";
import { cn } from "@/lib/utils";
import { InlineText } from "./inline-text";

/**
 * Indents and widths come from CSS variables (see `geometry.ts`), so the same
 * markup renders printed pages and the continuous mobile layout.
 */
function Dialogue({ block, dual = false }: { block: DialogueBlock; dual?: boolean }) {
  const cue = dual ? "pl-(--sp-dual-character)" : "pl-(--sp-character)";
  return (
    <div data-line={block.line}>
      <p className={cn("uppercase", cue)}>
        {block.character}
        {block.extension && ` ${block.extension}`}
        {block.contd && !/CONT['’]D/i.test(block.extension ?? "") && " (CONT'D)"}
      </p>
      {block.parts.map((part, i) => (
        <p
          key={i}
          data-line={part.line}
          className={cn(
            "whitespace-pre-wrap",
            part.type === "parenthetical"
              ? dual
                ? "ml-(--sp-dual-paren) max-w-(--sp-dual-paren-w)"
                : "ml-(--sp-paren) max-w-(--sp-paren-w)"
              : dual
                ? "ml-(--sp-dual-dialogue) max-w-(--sp-dual-dialogue-w)"
                : "ml-(--sp-dialogue) max-w-(--sp-dialogue-w)",
            part.type === "lyrics" && "italic",
          )}
        >
          <InlineText text={part.text} />
        </p>
      ))}
      {block.more && <p className={cue}>(MORE)</p>}
    </div>
  );
}

interface PageElementViewProps {
  element: PageElement;
  showSceneNumbers: boolean;
}

/** One screenplay element, positioned by the surrounding layout's geometry. */
export function PageElementView({ element, showSceneNumbers }: PageElementViewProps) {
  switch (element.kind) {
    case "scene_heading":
      return (
        <h3 data-line={element.line} className="relative font-bold uppercase">
          {showSceneNumbers && (
            <>
              <span className="absolute left-(--sp-scene-left) select-none">{element.sceneNumber}</span>
              <span className="absolute right-(--sp-scene-right) select-none [display:var(--sp-scene-right-display)]">
                {element.sceneNumber}
              </span>
            </>
          )}
          <InlineText text={element.text} />
        </h3>
      );
    case "action":
      return (
        <p data-line={element.line} className="whitespace-pre-wrap">
          <InlineText text={element.text} />
        </p>
      );
    case "centered":
      return (
        <p data-line={element.line} className="text-center">
          <InlineText text={element.text} />
        </p>
      );
    case "transition":
      return (
        <p data-line={element.line} className="text-right uppercase">
          <InlineText text={element.text} />
        </p>
      );
    case "lyrics":
      return (
        <p data-line={element.line} className="ml-(--sp-lyrics) italic">
          <InlineText text={element.text} />
        </p>
      );
    case "dialogue":
      return <Dialogue block={element} />;
    case "dual_dialogue":
      return (
        <div data-line={element.line} className="grid gap-(--sp-dual-gap) [grid-template-columns:var(--sp-dual-cols)]">
          <Dialogue block={element.left} dual />
          <Dialogue block={element.right} dual />
        </div>
      );
    default:
      return assertNever(element);
  }
}
