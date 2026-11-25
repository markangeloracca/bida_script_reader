import { describe, expect, it } from "vitest";
import { findInlineRanges, toPlainText, toSpans } from "./inline";

describe("inline markup", () => {
  it("finds bold, italic, underline and bold-italic", () => {
    expect(findInlineRanges("**b** *i* _u_ ***bi***").map((r) => r.kind)).toEqual(["bold", "italic", "underline", "bold_italic"]);
  });

  it("supports nesting", () => {
    expect(toSpans("**bold *both***")).toEqual([
      { text: "bold ", bold: true, italic: false, underline: false },
      { text: "both", bold: true, italic: true, underline: false },
    ]);
  });

  it("ignores escaped markers", () => {
    expect(toPlainText("Steel enters the code: \\*9765\\*")).toBe("Steel enters the code: *9765*");
  });

  it("leaves unmatched markers as text", () => {
    expect(toPlainText("5 * 3 = 15")).toBe("5 * 3 = 15");
  });

  it("removes inline notes and boneyard", () => {
    expect(toPlainText("He leaves[[ maybe?]] quickly /* cut */now.")).toBe("He leaves quickly now.");
  });
});
