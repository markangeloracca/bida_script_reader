export interface WrappedLine {
  text: string;
  /** True when this is the last wrapped line of a source paragraph. */
  endsParagraph: boolean;
}

/** Greedy word wrap at a fixed column width (monospace layout). */
export function wrapText(text: string, width: number): WrappedLine[] {
  const out: WrappedLine[] = [];
  for (const paragraph of text.split("\n")) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    let current = "";
    const flush = () => {
      out.push({ text: current, endsParagraph: false });
      current = "";
    };
    for (let word of words) {
      while (word.length > width) {
        if (current) flush();
        out.push({ text: word.slice(0, width), endsParagraph: false });
        word = word.slice(width);
      }
      if (!current) current = word;
      else if (current.length + 1 + word.length <= width) current += ` ${word}`;
      else {
        flush();
        current = word;
      }
    }
    out.push({ text: current, endsParagraph: true });
  }
  return out;
}

/** Re-joins wrapped lines into text, keeping original paragraph breaks. */
export function joinWrapped(lines: readonly WrappedLine[]): string {
  return lines.map((line, i) => line.text + (i === lines.length - 1 ? "" : line.endsParagraph ? "\n" : " ")).join("");
}
