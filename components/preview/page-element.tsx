import { assertNever, type DialogueBlock, type PageElement } from "@/lib/fountain";
import { cn } from "@/lib/utils";
import { InlineText } from "./inline-text";

/**
 * Screenplay geometry, relative to the 1.5in left margin:
 * character 2.2in, parenthetical 1.6in, dialogue 1.0in (3.5in wide).
 */
function Dialogue({ block, dual = false }: { block: DialogueBlock; dual?: boolean }) {
  return (
    <div data-line={block.line}>
      <p className={cn("uppercase", dual ? "pl-[1in]" : "pl-[2.2in]")}>
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
                ? "ml-[0.5in] max-w-[2.2in]"
                : "ml-[1.6in] max-w-[2.6in]"
              : dual
                ? "max-w-[2.8in]"
                : "ml-[1in] max-w-[3.5in]",
            part.type === "lyrics" && "italic",
          )}
        >
          <InlineText text={part.text} />
        </p>
      ))}
      {block.more && <p className={dual ? "pl-[1in]" : "pl-[2.2in]"}>(MORE)</p>}
    </div>
  );
}

interface PageElementViewProps {
  element: PageElement;
  showSceneNumbers: boolean;
}

/** One printable element on a screenplay page. */
export function PageElementView({ element, showSceneNumbers }: PageElementViewProps) {
  switch (element.kind) {
    case "scene_heading":
      return (
        <h3 data-line={element.line} className="relative font-bold uppercase">
          {showSceneNumbers && (
            <>
              <span className="absolute -left-[0.75in] select-none">{element.sceneNumber}</span>
              <span className="absolute -right-[0.6in] select-none">{element.sceneNumber}</span>
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
        <p data-line={element.line} className="ml-[1in] italic">
          <InlineText text={element.text} />
        </p>
      );
    case "dialogue":
      return <Dialogue block={element} />;
    case "dual_dialogue":
      return (
        <div data-line={element.line} className="grid grid-cols-2 gap-[0.2in]">
          <Dialogue block={element.left} dual />
          <Dialogue block={element.right} dual />
        </div>
      );
    default:
      return assertNever(element);
  }
}
