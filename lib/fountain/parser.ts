import { classifyLines, matchTitleKey } from "./classify";
import type { CharacterToken, Line, ParsedScript, TitlePageEntry, Token } from "./tokens";

const SCENE_NUMBER = /\s*#([\w.-]+)#\s*$/;

function parseTitlePage(lines: Line[]): TitlePageEntry[] {
  const entries: TitlePageEntry[] = [];
  for (const line of lines) {
    if (line.type !== "title_page") break;
    const keyed = matchTitleKey(line.text);
    // Indented lines (or any non-key line) continue the previous value.
    if (keyed && !/^(\s{3,}|\t)/.test(line.text)) {
      entries.push({ key: keyed.key, values: keyed.value ? [keyed.value] : [] });
    } else if (entries.length > 0) {
      entries[entries.length - 1].values.push(line.text.trim());
    }
  }
  return entries;
}

function parseCharacter(trimmed: string, line: number): CharacterToken {
  let cue = trimmed.replace(/^@/, "").trim();
  const dual = cue.endsWith("^");
  if (dual) cue = cue.slice(0, -1).trim();
  const parenIndex = cue.indexOf("(");
  const name = (parenIndex === -1 ? cue : cue.slice(0, parenIndex)).trim();
  const extension = parenIndex === -1 ? undefined : cue.slice(parenIndex).trim();
  return { type: "character", name, extension, dual, line };
}

/** Converts one classified line into a token, or null if it produces none. */
function toToken(line: Line, nextSceneNumber: () => string): Token | null {
  const trimmed = line.text.trim();
  const at = line.index;
  switch (line.type) {
    case "scene_heading": {
      const raw = trimmed.replace(/^\./, "");
      const explicit = SCENE_NUMBER.exec(raw);
      const auto = nextSceneNumber();
      return {
        type: "scene_heading",
        text: raw.replace(SCENE_NUMBER, "").trim(),
        sceneNumber: explicit ? explicit[1] : auto,
        line: at,
      };
    }
    case "action":
      return { type: "action", text: line.text.replace(/^(\s*)!/, "$1").replace(/\t/g, "    "), line: at };
    case "centered":
      return { type: "centered", text: trimmed.slice(1, -1).trim(), line: at };
    case "character":
      return parseCharacter(trimmed, at);
    case "dialogue":
      return { type: "dialogue", text: trimmed, line: at };
    case "parenthetical":
      return { type: "parenthetical", text: trimmed, line: at };
    case "lyrics":
      return { type: "lyrics", text: trimmed.replace(/^~\s?/, ""), line: at };
    case "transition":
      return { type: "transition", text: trimmed.replace(/^>\s*/, ""), line: at };
    case "page_break":
      return { type: "page_break", line: at };
    case "section": {
      const depth = /^#+/.exec(trimmed)?.[0].length ?? 1;
      return { type: "section", text: trimmed.slice(depth).trim(), depth, line: at };
    }
    case "synopsis":
      return { type: "synopsis", text: trimmed.replace(/^=\s*/, ""), line: at };
    case "empty":
    case "title_page":
    case "note":
    case "boneyard":
      return null;
  }
}

/**
 * Parses a Fountain document into its title page, classified lines and
 * block-level tokens. This is the single source of truth for Fountain syntax.
 */
export function parseFountain(source: string): ParsedScript {
  const lines = classifyLines(source);
  let sceneCounter = 0;
  const nextSceneNumber = () => String(++sceneCounter);

  const tokens: Token[] = [];
  for (const line of lines) {
    const token = toToken(line, nextSceneNumber);
    if (token) tokens.push(token);
  }

  return { titlePage: parseTitlePage(lines), lines, tokens };
}
