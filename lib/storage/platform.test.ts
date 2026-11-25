import { describe, expect, it } from "vitest";
import { fileInputAccept, filePickerTypes, isAndroid, isAppleMobile, needsUnfilteredPicker, type NavigatorLike } from "./platform";

const device = (userAgent: string, platform: string, maxTouchPoints: number): NavigatorLike => ({ userAgent, platform, maxTouchPoints });

const IPAD = device(
  "Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
  "iPad",
  5,
);
const IPAD_DESKTOP_MODE = device(
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15",
  "MacIntel",
  5,
);
const MAC = { ...IPAD_DESKTOP_MODE, maxTouchPoints: 0 };
const ANDROID_CHROME = device(
  "Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36",
  "Linux armv81",
  5,
);
const ANDROID_FIREFOX = device("Mozilla/5.0 (Android 15; Mobile; rv:140.0) Gecko/140.0 Firefox/140.0", "Linux aarch64", 5);
const WINDOWS = device(
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
  "Win32",
  0,
);

describe("platform detection", () => {
  it("detects iPad, including desktop-website mode, but not a real Mac", () => {
    expect(isAppleMobile(IPAD)).toBe(true);
    expect(isAppleMobile(IPAD_DESKTOP_MODE)).toBe(true);
    expect(isAppleMobile(MAC)).toBe(false);
  });

  it("detects Android in Chrome and Firefox", () => {
    expect(isAndroid(ANDROID_CHROME)).toBe(true);
    expect(isAndroid(ANDROID_FIREFOX)).toBe(true);
    expect(isAndroid(WINDOWS)).toBe(false);
  });

  it.each([
    ["iPad", IPAD, true],
    ["Android", ANDROID_CHROME, true],
    ["Mac", MAC, false],
    ["Windows", WINDOWS, false],
  ] as const)("needsUnfilteredPicker on %s is %s", (_name, nav, expected) => {
    expect(needsUnfilteredPicker(nav)).toBe(expected);
  });
});

describe("picker filters", () => {
  it("does not filter on mobile, where .fountain has no system file type", () => {
    for (const nav of [IPAD, ANDROID_CHROME, ANDROID_FIREFOX]) {
      expect(fileInputAccept(nav)).toBeUndefined();
      expect(filePickerTypes(nav)).toBeUndefined();
    }
  });

  it("filters by extension on desktop", () => {
    expect(fileInputAccept(WINDOWS)).toBe(".fountain,.spmd,.txt");
    expect(filePickerTypes(MAC)?.[0].accept["text/plain"]).toEqual([".fountain", ".spmd", ".txt"]);
  });
});
