import { ACCEPTED_EXTENSIONS } from "./read-file";

export type NavigatorLike = Pick<Navigator, "userAgent" | "platform" | "maxTouchPoints">;

const currentNavigator = (): NavigatorLike | undefined => globalThis.navigator;

/**
 * True on iPhone/iPad, including iPadOS in "desktop website" mode, which
 * reports itself as a Mac but has a touch screen.
 */
export function isAppleMobile(nav: NavigatorLike | undefined = currentNavigator()): boolean {
  if (!nav) return false;
  if (/iPad|iPhone|iPod/.test(nav.userAgent)) return true;
  return nav.platform === "MacIntel" && nav.maxTouchPoints > 1;
}

/** True on Android phones and tablets (Chrome, Firefox, Samsung Internet, …). */
export function isAndroid(nav: NavigatorLike | undefined = currentNavigator()): boolean {
  return Boolean(nav && /Android/i.test(nav.userAgent));
}

/**
 * Mobile system pickers can't filter by `.fountain`:
 * - iOS/iPadOS maps `accept` to Uniform Type Identifiers, and `.fountain`
 *   has none, so matching files are greyed out.
 * - Android maps `accept` to MIME types; `.fountain` files are usually
 *   `application/octet-stream`, so they are hidden or unselectable.
 * On these platforms we show all files and validate after selection.
 */
export function needsUnfilteredPicker(nav: NavigatorLike | undefined = currentNavigator()): boolean {
  return isAppleMobile(nav) || isAndroid(nav);
}

/** `accept` value for the fallback `<input type="file">` (undefined = no filter). */
export function fileInputAccept(nav: NavigatorLike | undefined = currentNavigator()): string | undefined {
  return needsUnfilteredPicker(nav) ? undefined : ACCEPTED_EXTENSIONS.join(",");
}

const PICKER_TYPES: FilePickerAcceptType[] = [{ description: "Fountain screenplay", accept: { "text/plain": [...ACCEPTED_EXTENSIONS] } }];

/** `types` option for `showOpenFilePicker` / `showSaveFilePicker` (undefined = no filter). */
export function filePickerTypes(nav: NavigatorLike | undefined = currentNavigator()): FilePickerAcceptType[] | undefined {
  return needsUnfilteredPicker(nav) ? undefined : PICKER_TYPES;
}
