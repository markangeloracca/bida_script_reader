import { describe, expect, it } from "vitest";
import { fileInputAccept, isAppleMobile } from "./platform";

const IPAD_UA =
  "Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const MAC_UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15";

describe("isAppleMobile", () => {
  it("detects iPad and iPhone user agents", () => {
    expect(isAppleMobile({ userAgent: IPAD_UA, platform: "iPad", maxTouchPoints: 5 })).toBe(true);
  });

  it("detects iPadOS requesting the desktop site", () => {
    expect(isAppleMobile({ userAgent: MAC_UA, platform: "MacIntel", maxTouchPoints: 5 })).toBe(true);
  });

  it("does not flag a real Mac", () => {
    expect(isAppleMobile({ userAgent: MAC_UA, platform: "MacIntel", maxTouchPoints: 0 })).toBe(false);
  });
});

describe("fileInputAccept", () => {
  it("does not filter on iPad, where .fountain has no system file type", () => {
    expect(fileInputAccept({ userAgent: IPAD_UA, platform: "iPad", maxTouchPoints: 5 })).toBeUndefined();
  });

  it("filters by extension elsewhere", () => {
    expect(fileInputAccept({ userAgent: MAC_UA, platform: "MacIntel", maxTouchPoints: 0 })).toBe(".fountain,.spmd,.txt");
  });
});
