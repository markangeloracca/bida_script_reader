import { describe, expect, it } from "vitest";
import { buildBlocks } from "./blocks";
import { buildOutline, sceneAtLine } from "./outline";
import { paginate } from "./paginate";
import { parseFountain } from "./parser";
import { computeStats } from "./stats";
import { wrapText } from "./wrap";

const tokens = (source: string) => parseFountain(source).tokens;

describe("buildBlocks", () => {
  it("merges adjacent action lines and pairs dual dialogue", () => {
    const blocks = buildBlocks(tokens("One.\nTwo.\n\nBRICK\nHi.\n\nSTEEL ^\nHey."));
    expect(blocks[0]).toMatchObject({ kind: "action", text: "One.\nTwo." });
    expect(blocks[1]).toMatchObject({ kind: "dual_dialogue", left: { character: "BRICK" }, right: { character: "STEEL" } });
    expect(blocks).toHaveLength(2);
  });
});

describe("wrapText", () => {
  it("wraps on word boundaries and keeps paragraphs", () => {
    expect(wrapText("aaa bbb ccc\nd", 7).map((l) => l.text)).toEqual(["aaa bbb", "ccc", "d"]);
  });
});

describe("paginate", () => {
  it("honours explicit page breaks", () => {
    expect(paginate(tokens("One.\n\n===\n\nTwo."))).toHaveLength(2);
  });

  it("splits long dialogue with MORE / CONT'D", () => {
    const speech = Array.from({ length: 80 }, (_, i) => `Line number ${i}.`).join("\n");
    const pages = paginate(tokens(`Action.\n\nHAMLET\n${speech}`));
    expect(pages.length).toBeGreaterThan(1);
    expect(pages[0].elements[1]).toMatchObject({ kind: "dialogue", more: true });
    expect(pages[1].elements[0]).toMatchObject({ kind: "dialogue", contd: true });
  });

  it("does not strand a scene heading at the bottom of a page", () => {
    const filler = Array.from({ length: 53 }, (_, i) => `Line ${i}.`).join("\n");
    const pages = paginate(tokens(`${filler}\n\nINT. HOUSE - DAY\n\nAction.`));
    expect(pages[1].elements[0]).toMatchObject({ kind: "scene_heading" });
  });

  it("keeps every page within the line budget", () => {
    const body = Array.from({ length: 200 }, (_, i) => `INT. ROOM ${i} - DAY\n\nSomething happens.\n\nBOB\nWords words words.`).join(
      "\n\n",
    );
    for (const page of paginate(tokens(body))) expect(page.elements.length).toBeGreaterThan(0);
  });
});

describe("outline and stats", () => {
  const script = parseFountain("# Act\n\n= Summary\n\nINT. A - DAY\n\nBOB\n(beat)\nHello there.\n\nINT. B - DAY\n\nBOB\nBye.");

  it("builds an outline and finds the current scene", () => {
    const outline = buildOutline(script.tokens);
    expect(outline.map((item) => item.kind)).toEqual(["section", "synopsis", "scene", "scene"]);
    expect(sceneAtLine(outline, 12)).toMatchObject({ text: "INT. B - DAY" });
    expect(sceneAtLine(outline, 0)).toBeUndefined();
  });

  it("counts scenes, words and characters", () => {
    const stats = computeStats(script.tokens);
    expect(stats.scenes).toBe(2);
    expect(stats.characters).toEqual([{ name: "BOB", cues: 2, words: 3 }]);
  });
});
