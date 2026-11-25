import { ACCEPTED_EXTENSIONS } from "./read-file";

type NavigatorLike = Pick<Navigator, "userAgent" | "platform" | "maxTouchPoints">;

/**
 * True on iPhone/iPad, including iPadOS in "desktop website" mode, which
 * reports itself as a Mac but has a touch screen.
 */
export function isAppleMobile(nav: NavigatorLike | undefined = globalThis.navigator): boolean {
  if (!nav) return false;
  if (/iPad|iPhone|iPod/.test(nav.userAgent)) return true;
  return nav.platform === "MacIntel" && nav.maxTouchPoints > 1;
}

/**
 * `accept` value for the fallback `<input type="file">`.
 *
 * iOS/iPadOS converts `accept` into Uniform Type Identifiers. `.fountain` and
 * `.spmd` have no system UTI, so filtering on them greys those files out in
 * the Files picker. On Apple mobile we therefore don't filter, and validate
 * the chosen file's extension after selection instead (see `readFile`).
 */
export function fileInputAccept(nav?: NavigatorLike): string | undefined {
  return isAppleMobile(nav) ? undefined : ACCEPTED_EXTENSIONS.join(",");
}
