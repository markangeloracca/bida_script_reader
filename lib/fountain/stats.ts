import { toPlainText } from "./inline";
import type { Token } from "./tokens";

export interface CharacterStat {
  name: string;
  /** Number of dialogue blocks spoken. */
  cues: number;
  /** Words of dialogue spoken. */
  words: number;
}

export interface ScriptStats {
  scenes: number;
  words: number;
  characters: CharacterStat[];
}

const countWords = (text: string) => {
  const plain = toPlainText(text).trim();
  return plain === "" ? 0 : plain.split(/\s+/).length;
};

/** Computes scene, word and per-character dialogue statistics. */
export function computeStats(tokens: readonly Token[]): ScriptStats {
  let scenes = 0;
  let words = 0;
  const byName = new Map<string, CharacterStat>();
  let speaker: CharacterStat | undefined;

  for (const token of tokens) {
    switch (token.type) {
      case "scene_heading":
        scenes++;
        words += countWords(token.text);
        speaker = undefined;
        break;
      case "character": {
        const name = token.name.toUpperCase();
        speaker = byName.get(name) ?? { name, cues: 0, words: 0 };
        speaker.cues++;
        byName.set(name, speaker);
        words += countWords(token.name);
        break;
      }
      case "dialogue":
      case "lyrics": {
        const count = countWords(token.text);
        words += count;
        if (speaker) speaker.words += count;
        break;
      }
      case "parenthetical":
        words += countWords(token.text);
        break;
      case "action":
      case "centered":
      case "transition":
        words += countWords(token.text);
        speaker = undefined;
        break;
      default:
        break;
    }
  }

  const characters = [...byName.values()].sort((a, b) => b.cues - a.cues || a.name.localeCompare(b.name));
  return { scenes, words, characters };
}
