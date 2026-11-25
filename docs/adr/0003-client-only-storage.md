# ADR 0003: Client-only storage (IndexedDB + File System Access API)

- Status: Accepted
- Date: 2026-11-24

## Context

No database or backend. Users must be able to reopen recent scripts and, where possible,
save back to the original file.

## Decision

- **IndexedDB** (via `idb-keyval`) stores recents metadata, autosaved text snapshots and
  `FileSystemFileHandle`s (structured-cloneable) in separate stores.
- **File System Access API** adapter on Chromium: open/save in place, permission is
  re-requested from a user gesture when reopening.
- **Download adapter** fallback (Firefox/Safari): `<input type=file>` to open, download to save.
- UI depends only on interfaces in `lib/storage/types.ts`; `createScriptService` receives
  repositories and the file adapter by injection (Repository + Adapter + Facade).
- Recents are capped at 20 entries; preferences live in `localStorage`.

## Consequences

- Works offline and privately; nothing leaves the browser.
- Data is per-browser; clearing site data removes recents and unsaved snapshots.
- A future sync backend can implement the same repository interfaces.
