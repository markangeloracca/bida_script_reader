import { classifyDialogueLine, ELEMENT_RULES, type RuleContext } from "./element-registry";
import type { Line, LineType } from "./tokens";

const KNOWN_TITLE_KEYS = new Set([
  "title",
  "credit",
  "author",
  "authors",
  "source",
  "draft date",
  "date",
  "contact",
  "copyright",
  "notes",
  "revision",
]);

const TITLE_KEY = /^([A-Za-z][A-Za-z0-9 _-]*?)\s*:(.*)$/;

/** Returns the title-page key on a line, or null if it is not a key line. */
export function matchTitleKey(text: string): { key: string; value: string } | null {
  const match = TITLE_KEY.exec(text.trim());
  if (!match) return null;
  const rawKey = match[1];
  const key = rawKey.toLowerCase();
  // Unknown ALL-CAPS keys are almost always screenplay text ("FADE IN:").
  if (!KNOWN_TITLE_KEYS.has(key) && rawKey === rawKey.toUpperCase()) return null;
  return { key, value: match[2].trim() };
}

/** Number of leading lines that form the title page (0 when there is none). */
function titlePageLength(rows: string[]): number {
  if (rows.length === 0 || !matchTitleKey(rows[0])) return 0;
  let i = 0;
  while (i < rows.length && rows[i].trim() !== "") i++;
  return i;
}

const isBlank = (text: string | undefined) => text === undefined || text.trim() === "";

/**
 * Classifies every source line of a Fountain document.
 *
 * Fountain is line-oriented: most elements are decided by the line itself plus
 * whether its neighbours are blank. Multi-line constructs (title page,
 * boneyard, notes, dialogue blocks) are tracked with a small state machine.
 */
export function classifyLines(source: string): Line[] {
  const rows = source.split(/\r?\n/);
  const lines: Line[] = [];
  const titleEnd = titlePageLength(rows);

  let inBoneyard = false;
  let inNote = false;
  let inDialogue = false;

  const push = (index: number, type: LineType) => lines.push({ index, text: rows[index], type });

  for (let i = 0; i < rows.length; i++) {
    const text = rows[i];
    const trimmed = text.trim();

    if (i < titleEnd) {
      push(i, "title_page");
      continue;
    }

    if (inBoneyard) {
      push(i, "boneyard");
      if (trimmed.includes("*/")) inBoneyard = false;
      continue;
    }

    if (inNote) {
      push(i, "note");
      if (trimmed.includes("]]")) inNote = false;
      continue;
    }

    if (trimmed.startsWith("/*")) {
      push(i, "boneyard");
      inBoneyard = !trimmed.includes("*/", 2);
      continue;
    }

    if (trimmed.startsWith("[[") && !trimmed.includes("]]")) {
      push(i, "note");
      inNote = true;
      continue;
    }

    if (trimmed === "") {
      // Two spaces keep a dialogue block going across an intentional blank line.
      if (inDialogue && text.length >= 2) {
        push(i, "dialogue");
      } else {
        inDialogue = false;
        push(i, "empty");
      }
      continue;
    }

    let type: LineType;
    if (inDialogue) {
      type = classifyDialogueLine(trimmed);
    } else {
      const prevType = lines[lines.length - 1]?.type;
      const ctx: RuleContext = {
        text,
        trimmed,
        prevEmpty: prevType === undefined || prevType === "empty" || prevType === "title_page",
        nextEmpty: isBlank(rows[i + 1]),
      };
      type = ELEMENT_RULES.find((rule) => rule.matches(ctx))?.type ?? "action";
      inDialogue = type === "character";
    }

    // A boneyard opened mid-line swallows the following lines.
    const open = text.lastIndexOf("/*");
    if (open !== -1 && text.indexOf("*/", open) === -1) inBoneyard = true;

    push(i, type);
  }

  return lines;
}
