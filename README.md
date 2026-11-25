# Bida Script Reader

A browser-based reader and editor for [Fountain](https://fountain.io) screenplays, inspired by
[Beat](https://www.beat-app.fi/). Write in plain text, see it formatted as a screenplay while you
type, and read a paginated, print-ready version side by side. Everything stays in your browser.

## Features

- **Open** `.fountain` / `.spmd` / `.txt` files with the picker (⌘O) or drag-and-drop; **new script**; bundled sample
- **Editor** (CodeMirror 6): screenplay formatting as you type, `Tab`/`Shift-Tab` to cycle element type,
  character & scene autocomplete, dimmed notes/boneyard/markers, focus (typewriter) mode
- **Reader**: paginated US Letter / A4 pages in Courier Prime, title page, scene numbers, dual dialogue,
  `(MORE)` / `(CONT'D)` splits, print / save as PDF
- **Edit / Split / Read** views, outline navigator, ⌘K command palette, statistics
- **Recent scripts** stored in IndexedDB (no database); save back to the original file in Chromium browsers
- **Light / dark / system** theme

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
```

| Script          | Purpose                                                 |
| --------------- | ------------------------------------------------------- |
| `npm run check` | lint + typecheck + unit tests (also runs on pre-commit) |
| `npm test`      | Vitest unit tests (`lib/**`)                            |
| `npm run e2e`   | Playwright smoke tests (starts a dev server on :3100)   |
| `npm run build` | production build                                        |

## Keyboard shortcuts

| Shortcut   | Action                                                                  |
| ---------- | ----------------------------------------------------------------------- |
| ⌘S / ⌘⇧S   | Save / Save as                                                          |
| ⌘O         | Open script                                                             |
| ⌘K         | Command palette (jump to scene, run commands)                           |
| ⌘P         | Print / save as PDF                                                     |
| ⌘⇧P        | Toggle split preview                                                    |
| ⌘\\        | Toggle outline                                                          |
| ⌘⇧F        | Focus mode (Esc to exit)                                                |
| Tab / ⇧Tab | Cycle element type (action → scene → character → transition → centered) |

## Architecture

```
app/            routes (thin server shells)
components/     presentational + container components (ui/ = shadcn)
hooks/          React glue: session, actions, recents, hotkeys, DI context
lib/store/      zustand stores (document, settings)
lib/editor/     CodeMirror extensions (depends on lib/fountain only)
lib/storage/    repositories, file adapters, ScriptService facade
lib/fountain/   pure Fountain domain: parser, inline markup, outline, stats, pagination
```

Dependency direction (enforced by ESLint `no-restricted-imports` + `import/no-cycle`):

```
app → components → hooks → lib/store → lib/{editor, storage} → lib/fountain
```

Design principles (KISS, SOLID, loose coupling, high cohesion) and the patterns used
(Adapter, Repository, Strategy, Registry, Facade, Observer, Container/Presentational) are
described in [PLAN.md §1](PLAN.md). Key decisions are recorded in [`docs/adr`](docs/adr).

## Browser support

Saving back to the original file uses the File System Access API (Chrome, Edge, Opera).
In Firefox and Safari, scripts are kept in the browser and **Save** downloads a copy.

**iPad, iPhone and Android:** **Open script** shows the system file picker. Mobile pickers
can't filter by `.fountain` (the extension has no registered system file type or MIME type), so
the picker shows all files and the app checks the file after you choose it: Fountain extensions
are accepted, and so is extension-less plain text (some Android providers drop the extension).
Saving downloads the script (Files › Downloads on iOS, the Downloads folder on Android).
