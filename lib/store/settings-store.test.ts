import { describe, expect, it } from "vitest";
import { resolveReaderLayout, resolveViewMode } from "./settings-store";

describe("resolveViewMode", () => {
  it("keeps the chosen mode on desktop", () => {
    expect(resolveViewMode("split", { isMobile: false, focusMode: false })).toBe("split");
  });

  it("reads instead of splitting on phones", () => {
    expect(resolveViewMode("split", { isMobile: true, focusMode: false })).toBe("read");
    expect(resolveViewMode("edit", { isMobile: true, focusMode: false })).toBe("edit");
  });

  it("always edits in focus mode", () => {
    expect(resolveViewMode("read", { isMobile: true, focusMode: true })).toBe("edit");
  });
});

describe("resolveReaderLayout", () => {
  it("reflows automatically on phones only", () => {
    expect(resolveReaderLayout("auto", true)).toBe("flow");
    expect(resolveReaderLayout("auto", false)).toBe("pages");
  });

  it("honours an explicit choice", () => {
    expect(resolveReaderLayout("pages", true)).toBe("pages");
    expect(resolveReaderLayout("flow", false)).toBe("flow");
  });
});
