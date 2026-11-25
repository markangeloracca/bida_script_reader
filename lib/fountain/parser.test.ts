import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { classifyLines } from "./classify";
import { parseFountain } from "./parser";
import { getTitle, titleValue } from "./title-page";
import type { LineType } from "./tokens";

const types = (source: string): LineType[] => classifyLines(source).map((line) => line.type);
const nonEmpty = (source: string) => types(source).filter((type) => type !== "empty");

describe("scene headings", () => {
  it.each(["INT. HOUSE - DAY", "EXT. BEACH - NIGHT", "EST. CITY", "INT./EXT. CAR - DAY", "I/E CAR - DAY", "int. kitchen"])(
    "recognises %s",
    (heading) => {
      expect(nonEmpty(`${heading}\n\nAction.`)[0]).toBe("scene_heading");
    },
  );

  it("requires a blank line before", () => {
    expect(types("Action.\nINT. HOUSE - DAY")).toEqual(["action", "action"]);
  });

  it("supports forced headings and scene numbers", () => {
    const { tokens } = parseFountain(".SNIPER SCOPE POV #12A#\n\nINT. HOUSE - DAY");
    expect(tokens[0]).toMatchObject({ type: "scene_heading", text: "SNIPER SCOPE POV", sceneNumber: "12A" });
    expect(tokens[1]).toMatchObject({ type: "scene_heading", sceneNumber: "2" });
  });

  it("does not treat an ellipsis as a forced heading", () => {
    expect(nonEmpty("...and then.")).toEqual(["action"]);
  });
});

describe("characters and dialogue", () => {
  it("parses a dialogue block", () => {
    expect(types("STEEL\n(quietly)\nThey're gone.\n")).toEqual(["character", "parenthetical", "dialogue", "empty"]);
  });

  it("requires dialogue after a cue", () => {
    expect(nonEmpty("\nBOOM.\n\nAction")).toEqual(["action", "action"]);
  });

  it("extracts extensions and dual dialogue", () => {
    const { tokens } = parseFountain("BRICK (V.O.) ^\nHi.");
    expect(tokens[0]).toEqual({ type: "character", name: "BRICK", extension: "(V.O.)", dual: true, line: 0 });
  });

  it("supports forced lower-case cues", () => {
    const { tokens } = parseFountain("@McCLANE\nYippee ki-yay.");
    expect(tokens[0]).toMatchObject({ type: "character", name: "McCLANE" });
  });

  it("allows lower-case extensions", () => {
    expect(types("HANS (cont'd)\nShoot the glass.")).toEqual(["character", "dialogue"]);
  });

  it("keeps dialogue going across a two-space line", () => {
    expect(types("DEALER\nTen.\n  \nFour.")).toEqual(["character", "dialogue", "dialogue", "dialogue"]);
  });
});

describe("other elements", () => {
  it("parses transitions", () => {
    expect(nonEmpty("\nCUT TO:\n\nAction")).toEqual(["transition", "action"]);
    expect(parseFountain("> Burn to white.").tokens[0]).toMatchObject({ type: "transition", text: "Burn to white." });
  });

  it("parses centered text before forced transitions", () => {
    expect(parseFountain(">THE END<").tokens[0]).toMatchObject({ type: "centered", text: "THE END" });
  });

  it("parses forced action, lyrics and page breaks", () => {
    expect(types("!SCANNING THE AISLES...")).toEqual(["action"]);
    expect(parseFountain("~Willy Wonka!").tokens[0]).toMatchObject({ type: "lyrics", text: "Willy Wonka!" });
    expect(types("===")).toEqual(["page_break"]);
  });

  it("parses sections and synopses", () => {
    const { tokens } = parseFountain("## Act Two\n\n= Things get worse.");
    expect(tokens).toEqual([
      { type: "section", text: "Act Two", depth: 2, line: 0 },
      { type: "synopsis", text: "Things get worse.", line: 2 },
    ]);
  });

  it("treats notes and boneyard as non-printing lines", () => {
    expect(types("[[A note]]\n/*\nCut\n*/\nAction")).toEqual(["note", "boneyard", "boneyard", "boneyard", "action"]);
    expect(types("[[Multi\nline note]]")).toEqual(["note", "note"]);
  });
});

describe("title page", () => {
  it("parses keys and indented multi-line values", () => {
    const script = parseFountain("Title: Big Fish\nAuthor: John\nContact:\n    123 Street\n    City\n\nINT. HOUSE - DAY");
    expect(titleValue(script.titlePage, "contact")).toEqual(["123 Street", "City"]);
    expect(getTitle(script.titlePage, "fallback")).toBe("Big Fish");
    expect(script.lines[6].type).toBe("scene_heading");
  });

  it("does not treat FADE IN: as a title page", () => {
    expect(parseFountain("FADE IN:\n\nINT. HOUSE - DAY").titlePage).toEqual([]);
  });

  it("falls back when there is no title", () => {
    expect(getTitle([], "untitled.fountain")).toBe("untitled.fountain");
  });
});

describe("sample script", () => {
  const sample = readFileSync(join(process.cwd(), "public/samples/the-last-lighthouse.fountain"), "utf8");
  const script = parseFountain(sample);

  it("parses every element type", () => {
    const found = new Set(script.lines.map((line) => line.type));
    for (const type of [
      "title_page",
      "section",
      "synopsis",
      "scene_heading",
      "action",
      "character",
      "parenthetical",
      "dialogue",
      "transition",
      "centered",
      "lyrics",
      "page_break",
      "note",
      "boneyard",
    ] as const) {
      expect(found, type).toContain(type);
    }
  });

  it("reads the title with emphasis removed", () => {
    expect(getTitle(script.titlePage, "x")).toBe("THE LAST LIGHTHOUSE");
  });

  it("parses a large script quickly", () => {
    const big = Array.from({ length: 40 }, () => sample.split("\n\n").slice(1).join("\n\n")).join("\n\n");
    const start = performance.now();
    parseFountain(big);
    expect(performance.now() - start).toBeLessThan(100);
  });
});
