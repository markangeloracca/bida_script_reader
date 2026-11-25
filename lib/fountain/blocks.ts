import type { Token } from "./tokens";

export interface DialoguePart {
  type: "dialogue" | "parenthetical" | "lyrics";
  text: string;
  line: number;
}

export interface DialogueBlock {
  kind: "dialogue";
  character: string;
  extension?: string;
  parts: DialoguePart[];
  line: number;
  /** Rendered with `(MORE)` because it continues on the next page. */
  more?: boolean;
  /** Rendered with `(CONT'D)` because it continues from the previous page. */
  contd?: boolean;
}

export interface DualDialogueBlock {
  kind: "dual_dialogue";
  left: DialogueBlock;
  right: DialogueBlock;
  line: number;
}

/** A printable element placed on a page. */
export type PageElement =
  | { kind: "scene_heading"; text: string; sceneNumber: string; line: number }
  | { kind: "action"; text: string; line: number }
  | { kind: "centered"; text: string; line: number }
  | { kind: "transition"; text: string; line: number }
  | { kind: "lyrics"; text: string; line: number }
  | DialogueBlock
  | DualDialogueBlock;

/** Layout input: page elements plus explicit page breaks. */
export type Block = PageElement | { kind: "page_break"; line: number };

/**
 * Groups line-level tokens into layout blocks: adjacent action lines become
 * one paragraph, cues gather their dialogue, and `^` cues pair up as dual
 * dialogue. Sections and synopses are not printed.
 */
export function buildBlocks(tokens: readonly Token[]): Block[] {
  const blocks: Block[] = [];
  let dialogue: DialogueBlock | null = null;
  let dualPending = false;
  let lastLine = -2;

  const closeDialogue = () => {
    if (!dialogue) return;
    const previous = blocks[blocks.length - 2];
    if (dualPending && previous?.kind === "dialogue") {
      blocks.splice(blocks.length - 2, 2, {
        kind: "dual_dialogue",
        left: previous,
        right: dialogue,
        line: previous.line,
      });
    }
    dialogue = null;
    dualPending = false;
  };

  for (const token of tokens) {
    const adjacent = token.line === lastLine + 1;
    lastLine = token.line;

    if (dialogue && (token.type === "dialogue" || token.type === "parenthetical" || (token.type === "lyrics" && adjacent))) {
      dialogue.parts.push({ type: token.type, text: token.text, line: token.line });
      continue;
    }
    closeDialogue();

    const last = blocks[blocks.length - 1];
    switch (token.type) {
      case "action":
        if (adjacent && last?.kind === "action") last.text += `\n${token.text}`;
        else blocks.push({ kind: "action", text: token.text, line: token.line });
        break;
      case "character":
        dialogue = { kind: "dialogue", character: token.name, extension: token.extension, parts: [], line: token.line };
        dualPending = token.dual;
        blocks.push(dialogue);
        break;
      case "scene_heading":
        blocks.push({ kind: "scene_heading", text: token.text, sceneNumber: token.sceneNumber, line: token.line });
        break;
      case "centered":
      case "transition":
      case "lyrics":
        blocks.push({ kind: token.type, text: token.text, line: token.line });
        break;
      case "page_break":
        blocks.push({ kind: "page_break", line: token.line });
        break;
      case "dialogue":
      case "parenthetical":
      case "section":
      case "synopsis":
        break;
    }
  }
  closeDialogue();
  return blocks;
}
