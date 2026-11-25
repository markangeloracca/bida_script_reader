import { describe, expect, it } from "vitest";
import { parseFountain } from "@/lib/fountain";
import { forceElement, stripForcing } from "./element-cycle";

const typeOf = (text: string) => parseFountain(`${text}\nNext line`).lines[0].type;

describe("element cycling helpers", () => {
  it("strips forcing markers", () => {
    expect(stripForcing("@McCLANE")).toBe("McCLANE");
    expect(stripForcing(">THE END<")).toBe("THE END");
    expect(stripForcing("...and then")).toBe("...and then");
  });

  it.each(["scene_heading", "character", "transition", "centered", "action"] as const)("forces text into a %s", (type) => {
    const forced = forceElement("the kitchen", type, true);
    expect(typeOf(forced)).toBe(type);
  });

  it("keeps natural scene headings unforced", () => {
    expect(forceElement("int. house - day", "scene_heading", true)).toBe("INT. HOUSE - DAY");
  });

  it("forces upper-case text to stay action", () => {
    expect(forceElement("BOOM", "action", true)).toBe("!BOOM");
  });
});
