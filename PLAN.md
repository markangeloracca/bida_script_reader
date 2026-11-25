# Implementation Plan — Fountain Script Reader & Editor

A browser-based Next.js app that opens, reads, and edits `.fountain` screenplay files. It's modeled on [Beat](https://www.beat-app.fi/): you write in plain Fountain text, the editor formats it like a screenplay as you type, and a paginated preview shows the printed script.

- **Stack:** Next.js (App Router, TypeScript), Tailwind CSS v4, shadcn/ui, next-themes
- **No database or backend.** Everything runs in the browser. Recently opened scripts are kept in IndexedDB.
- **Scope for v1:** reader + editor, recent-scripts tracking, light/dark mode

---

## 0. Required skills and roles

The project needs the following senior-level skill sets. One person may hold more than one role.

| Role                                    | Responsibilities in this project                                                                                                                                                                                                                                                                                                                                                |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Senior Next.js & Front-End Engineer** | App Router architecture and where the server/client boundary sits, CodeMirror 6 integration (decorations, keymaps, autocomplete), editor performance on long scripts, the zustand store, `next/dynamic` and `next/font`, hydration-safe theming, bundle size, and the Vitest and Playwright test setup                                                                          |
| **Senior UI/UX Engineer**               | Screenplay typography and page layout (Courier Prime, industry margins), the workspace layout and Edit/Split/Read flow, consistent shadcn/ui and Tailwind design tokens, light and dark palettes for both the UI and the script paper, keyboard-first interaction (command palette, Tab cycling), responsive behavior, empty and error states, and accessibility to WCAG 2.2 AA |
| **Senior Full-Stack Engineer**          | The Fountain parser and pagination engine, the storage layer (IndexedDB schema, FS Access API with fallback, persisting file handles and permissions), file encoding and error handling, data versioning and migrations for stored records, static deployment and CI, and keeping a clean seam so a backend or sync can be added later without rewrites                         |

---

## 1. Engineering standards and design principles

All source files must follow these standards. Code review checks against them.

### 1.1 Principles

- **KISS:** pick the simplest solution that meets the requirement. No speculative abstractions or premature generalization. Follow YAGNI: build v1 scope only.
- **DRY:** one source of truth for each concept. The parser is the only code that interprets Fountain syntax. The editor, outline, stats and preview all consume its tokens and never re-parse text themselves.
- **SOLID:**
  - **Single Responsibility:** each module or component does one thing. Examples: `parser.ts` only tokenizes, `paginate.ts` only paginates, `recents.ts` only manages recent entries.
  - **Open/Closed:** adding a Fountain element type or an export format means adding a handler to a registry (an element map, or an exporter interface), not editing existing branches.
  - **Liskov Substitution:** every implementation of a storage or file-access interface (FS Access API or the download fallback) can stand in for another without callers changing.
  - **Interface Segregation:** keep interfaces small and focused, for example `FileOpener`, `FileSaver` and `RecentsRepository`, rather than one large "storage service".
  - **Dependency Inversion:** UI and store code depend on interfaces in `lib/storage/types.ts`, not on IndexedDB or browser APIs directly. Concrete implementations are injected through a small provider or factory.
- **Loose coupling:**
  - `lib/fountain` is pure TypeScript with no React, DOM or CodeMirror imports, so it can be tested and reused on its own, for example in a future server-side export.
  - `lib/editor` depends on `lib/fountain`. `lib/fountain` never depends on `lib/editor`.
  - Components talk through the store and typed props, not by importing each other's internals.
  - Browser-specific APIs live behind adapters in `lib/storage/`.
- **High cohesion:** code is grouped by feature or domain (`fountain`, `editor`, `storage`, `workspace`, `home`, `preview`). Related types, logic and tests sit together. A folder's public API is exported through its `index.ts`.
- **Separation of concerns:** domain logic goes in `lib/`, state in `lib/store/`, presentation in `components/`, and routing in `app/`. Components hold no business logic beyond view state. Complex logic is pulled out into hooks such as `useRecents`, `useFileAccess` and `useOutline`.

### 1.2 Design patterns used

| Pattern                        | Where                                                                                                            |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| **Adapter**                    | `FsAccessFileAdapter` and `DownloadFallbackAdapter` both implement `FileOpener` / `FileSaver`                    |
| **Repository**                 | `RecentsRepository` and `DocumentRepository` sit over IndexedDB                                                  |
| **Strategy**                   | The pagination strategy (line-based now, measured-DOM later) and paper size (Letter now, A4 later) are swappable |
| **Registry / Factory**         | The element-type registry maps each Fountain element to its parse rule, CSS class and preview renderer           |
| **Observer / Store**           | zustand store with selectors. Autosave subscribes to document changes                                            |
| **Facade**                     | `lib/storage/index.ts` exposes a simple `openScript()`, `saveScript()`, `listRecents()` API                      |
| **Container / Presentational** | Workspace containers wire up the store. Presentational components stay pure and are easy to test                 |

### 1.3 Best practices

- **TypeScript:** `strict: true`, no `any` (use `unknown` plus narrowing), discriminated unions for token types, and exhaustive `switch` statements checked with `never`.
- **Next.js:** Server Components by default, with `"use client"` only where browser APIs or interactivity require it, and kept at the leaves. Browser-only libraries load with `next/dynamic` and `ssr: false`. Use `next/font` and the Metadata API. No `useEffect` used just to derive data.
- **React:** keep components small, around 150 lines or fewer, splitting when they grow. Use memoized selectors to avoid re-renders. Stable keys. Error boundaries around the editor and preview.
- **Styling:** Tailwind utilities plus shadcn tokens only, with no hard-coded colors. Combine classes with `cn()`. Script-specific styles go in one CSS layer.
- **Naming and files:** kebab-case file names, PascalCase components, one exported component per file, named exports (except where Next.js requires default exports).
- **Error handling:** typed `Result` objects or explicit errors at boundaries (file I/O, IndexedDB). Users see errors as toasts, never raw exceptions.
- **Testing:**
  - Parser, pagination and repositories each need unit tests, with at least 90% coverage on `lib/fountain`.
  - Critical flows are covered by Playwright tests.
  - Tests sit next to the code they cover.
- **Tooling:** ESLint (`next/core-web-vitals`, `@typescript-eslint`), Prettier, `import/no-cycle` to enforce the dependency direction, Husky with lint-staged for pre-commit lint, typecheck and tests, and Conventional Commits.
- **Documentation:** TSDoc on public module APIs, a README covering architecture and dependency direction, and ADRs in `docs/adr/` for key decisions (custom parser, CodeMirror, storage strategy).
- **Accessibility and performance budgets:** Lighthouse scores of at least 90 for performance, accessibility and best practices. Keystroke-to-paint under 16ms on a 120-page script.

---

## 2. Feature scope (taken from Beat)

| Area                                                                                                                                                     | v1 (this plan)                      | Later                       |
| -------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- | --------------------------- |
| Open `.fountain` / `.txt` (picker, drag-and-drop)                                                                                                        | ✅                                  | Open `.fdx` / `.highland`   |
| Save back to the same file, or download                                                                                                                  | ✅                                  | —                           |
| New blank script, title page template                                                                                                                    | ✅                                  | Templates                   |
| Editor formats each line as its screenplay element (scene heading, action, character, dialogue, parenthetical, transition, centered, lyrics, page break) | ✅                                  | —                           |
| Tab key cycles the current line's element type (as in Beat)                                                                                              | ✅                                  | —                           |
| Autocomplete for character names and scene headings (`INT.`/`EXT.`, known locations)                                                                     | ✅                                  | —                           |
| Outline sidebar: sections `#`, scenes, synopses `=`, click to jump                                                                                       | ✅                                  | Index cards, timeline       |
| Notes `[[ ]]` and boneyard `/* */` shown dimmed                                                                                                          | ✅                                  | Notes panel                 |
| Paginated screenplay preview / reader mode (Courier, US Letter)                                                                                          | ✅ (approximate pagination)         | Exact pagination, A4 toggle |
| Title page rendering                                                                                                                                     | ✅                                  | —                           |
| Scene numbers on/off                                                                                                                                     | ✅                                  | Locked scene numbers        |
| Stats: page count, scene count, word count, characters & line counts                                                                                     | ✅ (basic)                          | Full analysis view          |
| Focus / typewriter mode                                                                                                                                  | ✅ (simple)                         | —                           |
| Print / PDF export                                                                                                                                       | ✅ via `window.print()` + print CSS | Real PDF and FDX export     |
| Light / dark / system theme                                                                                                                              | ✅                                  | Custom editor themes        |
| Recent scripts list                                                                                                                                      | ✅                                  | Pinning, search             |
| Revision marks, tagging, collaboration                                                                                                                   | ❌                                  | Maybe                       |

---

## 3. Key technical decisions

### 3.1 Fountain parsing: write our own line-based parser

Fountain is line-oriented and its spec is short ([fountain.io/syntax](https://fountain.io/syntax)). The editor needs to know the **element type of every line** so it can format that line, and the preview needs a **token stream**. Existing libraries such as `fountain-js` produce HTML only, so they can't drive the editor.

- `lib/fountain/parser.ts` turns text into `Token[]`, each carrying `{ type, text, lineStart, lineEnd, sceneNumber?, dual? }`
- One parser feeds the editor's formatting, the outline, the stats, and the preview
- Handles: title page keys, scene headings (including forced `.`), action (including forced `!`), character (including forced `@` and `^` for dual dialogue), dialogue, parentheticals, transitions (including forced `>`), centered `>text<`, lyrics `~`, page break `===`, sections `#`, synopses `=`, notes, boneyard, emphasis (`*italic*`, `**bold**`, `_underline_`)
- Built test-first with Vitest against the spec examples, plus a few real public-domain scripts as fixtures

### 3.2 Editor: CodeMirror 6

- `@uiw/react-codemirror` with a custom Fountain extension:
  - **Line decorations** (`Decoration.line`) add a class per element type, e.g. `cm-fountain-character`. Tailwind/CSS then sets the screenplay indents (character about 3.7in, dialogue about 2.5in, parenthetical about 3.1in, transition right-aligned), which gives the formatted-as-you-type look
  - Inline decorations for emphasis, notes, boneyard
  - The parse runs incrementally on the visible viewport, with a full reparse debounced to about 150ms for the outline and stats
- Keymaps: `Tab` / `Shift-Tab` cycle element type (rewrites the line's prefix or case), `Mod-S` save, `Mod-O` open, `Mod-K` command palette, `Mod-Shift-P` toggle preview
- Autocomplete via `@codemirror/autocomplete`, drawing on character and location sets taken from the parse
- Why not ContentEditable or Monaco: CodeMirror handles large text well and has first-class line decorations, and it's lighter than Monaco

### 3.3 File access and the recent-scripts list (no DB)

- **File System Access API** (`showOpenFilePicker`, `showSaveFilePicker`) where available (Chromium browsers):
  - Saves write back to the original file
  - `FileSystemFileHandle` objects are structured-cloneable, so we **store the handle in IndexedDB**. Reopening a recent file then only needs a `requestPermission()` prompt
- **Fallback** for Firefox and Safari: `<input type="file">` to open, a Blob download to save
- **IndexedDB** (via `idb-keyval`, or `idb` if we need multiple stores) holds:
  - `recents`: `{ id, title, fileName, lastOpenedAt, lastEditedAt, sizeBytes, pageCount, preview (first ~200 chars), hasHandle }`, capped at 20 entries and sorted by `lastOpenedAt`
  - `documents/{id}`: the latest text snapshot (autosaved), so a recent script reopens even without a handle or in the fallback browsers
  - `handles/{id}`: the `FileSystemFileHandle`, when one exists
- Title comes from the title page `Title:` if present, otherwise the file name
- Settings (theme, preview on/off, scene numbers, font size) go in `localStorage`

### 3.4 Theming

- `next-themes` with `attribute="class"`, `defaultTheme="system"`, `enableSystem`, and `suppressHydrationWarning` on `<html>`
- shadcn's CSS-variable tokens (`--background`, `--foreground`, etc.) in `globals.css`, plus custom tokens for the editor (`--script-paper`, `--script-ink`, `--script-muted`, `--script-note`) with light and dark values
- `ThemeToggle` is a shadcn `DropdownMenu` with Light / Dark / System, placed in the header and also reachable from the command palette
- The preview "paper" follows the theme (dark paper in dark mode). Print CSS always forces white paper and black ink

### 3.5 State

- `zustand` store for the open document: `{ id, text, tokens, dirty, fileHandle?, settings }`, with selectors for the outline and stats
- Autosave to IndexedDB is debounced to about 1s. A dirty indicator appears in the header, and a `beforeunload` warning fires when there are unsaved changes that live only in memory

### 3.6 Rendering model

- Everything that touches files, IndexedDB, or CodeMirror is a **Client Component** (`"use client"`). Pages are thin server shells
- CodeMirror loads with `next/dynamic` and `ssr: false`
- Fonts: **Courier Prime** for the script via `next/font/google`, Geist or Inter for the UI

---

## 4. Routes and UI layout

```
/                    Home: recent scripts, "Open file", "New script", drop zone
/script/[id]         Workspace: editor + optional preview + outline
/script/[id]?mode=read   Reader-only (paginated preview, full width)
```

**Home (`/`)**

- Hero with Open / New buttons and a drag-and-drop zone over the whole page
- Recent scripts grid of shadcn `Card`s: title, file name, page count, "opened 2h ago", a preview snippet, and a context menu (Open, Remove from recents, Download copy)
- Empty state with a "Try a sample script" button that loads a bundled public-domain sample from `/public/samples/`

**Workspace (`/script/[id]`)**

```
┌──────────────────────────────────────────────────────────────┐
│ Header: ← Home | Title • dirty | Edit/Split/Read | ⌘K | ☀/🌙 │
├───────────┬───────────────────────────────┬──────────────────┤
│ Outline   │  Editor (CodeMirror)          │ Preview (paged)  │
│ sections  │  formatted Fountain           │ Courier, Letter  │
│ scenes    │                               │ page numbers     │
│ synopses  │                               │                  │
├───────────┴───────────────────────────────┴──────────────────┤
│ Status bar: page x/y · scenes · words · element at cursor     │
└──────────────────────────────────────────────────────────────┘
```

- Panels use shadcn `Resizable`. The outline is collapsible, and on mobile it moves into a `Sheet`
- The view switcher (`ToggleGroup`) offers **Edit / Split / Read**
- The command palette (shadcn `Command`) offers jump to scene, toggle theme, toggle scene numbers, save, export/print, and focus mode

---

## 5. Project structure

```
app/
  layout.tsx                 ThemeProvider, fonts, Toaster
  page.tsx                   Home (renders <RecentScripts/>, <OpenDropzone/>)
  script/[id]/page.tsx       Workspace shell → <Workspace id=…/>
  globals.css                Tailwind, shadcn tokens, script tokens, print CSS
components/
  ui/                        shadcn generated components
  theme-provider.tsx
  theme-toggle.tsx
  home/recent-scripts.tsx
  home/open-dropzone.tsx
  workspace/workspace.tsx
  workspace/header.tsx
  workspace/outline-panel.tsx
  workspace/status-bar.tsx
  workspace/command-palette.tsx
  editor/fountain-editor.tsx       CodeMirror wrapper (dynamic, ssr:false)
  preview/screenplay-preview.tsx   paginated renderer
  preview/title-page.tsx
hooks/
  use-recents.ts             wraps RecentsRepository for components
  use-file-access.ts         open/save via the injected adapter
  use-outline.ts             store selector → outline tree
lib/
  fountain/                  PURE TypeScript: no React/DOM/CodeMirror imports
    index.ts                 public API (parse, paginate, stats)
    parser.ts                text → Token[]
    tokens.ts                discriminated-union token types
    element-registry.ts      element → parse rule / class / renderer (Open/Closed)
    inline.ts                emphasis/notes → spans
    paginate.ts              Token[] → Page[] via PaginationStrategy
    stats.ts                 scene/word/character counts
    *.test.ts                Vitest specs next to the code + fixtures/*.fountain
  editor/                    depends on lib/fountain only
    index.ts
    fountain-language.ts     CM6 ViewPlugin with line + mark decorations
    element-cycle.ts         Tab/Shift-Tab behavior
    autocomplete.ts          character/scene completions
    keymap.ts
  storage/
    index.ts                 Facade: openScript, saveScript, listRecents…
    types.ts                 FileOpener, FileSaver, RecentsRepository interfaces
    db.ts                    idb setup (recents, documents, handles)
    recents-repository.ts    IndexedDB implementation of RecentsRepository
    document-repository.ts   snapshot persistence
    adapters/
      fs-access-adapter.ts   File System Access API implementation
      download-adapter.ts    <input>/download fallback implementation
  store/document-store.ts    zustand (depends on storage interfaces, not impls)
  utils.ts                   cn() from shadcn
docs/adr/                    Architecture Decision Records
public/samples/sample.fountain
```

**Dependency direction** (lint enforces no cycles): `app → components → hooks → store → lib/{editor, storage} → lib/fountain`. `lib/fountain` depends on nothing in the project.

---

## 6. Implementation phases

### Phase 0: Scaffold (about half a day)

1. `npx create-next-app@latest . --ts --tailwind --eslint --app --src-dir=false --import-alias "@/*" --yes`
2. `npx shadcn@latest init`, then add: `button card dropdown-menu dialog alert-dialog sheet resizable scroll-area tooltip separator toggle-group command context-menu sonner badge`
3. `npm i next-themes zustand idb-keyval @uiw/react-codemirror @codemirror/state @codemirror/view @codemirror/autocomplete @codemirror/commands date-fns`
4. `npm i -D vitest @testing-library/react jsdom @playwright/test`
5. ThemeProvider, ThemeToggle, and the base layout and fonts
6. Engineering guardrails from §1: TypeScript `strict`, ESLint with `import/no-cycle` and restricted-import rules (for example, `lib/fountain` must not import React or CodeMirror), Prettier, Husky with lint-staged, and a PR template with a checklist covering SOLID, KISS, coupling and cohesion
7. First ADRs: custom parser, CodeMirror 6, client-only storage strategy

- **Done when:** the app runs, the theme toggle works with no flash of the wrong theme on load, lint and typecheck pass, and the guardrails reject a deliberately bad import

### Phase 1: Fountain parser (1–2 days)

1. Token types plus a parser covering every element in §3.1
2. Inline formatting parser (emphasis, notes, boneyard)
3. Title page parser (multi-line values)
4. Vitest suite: one test group per spec section, plus round-trip fixture tests

- **Done when:** all spec examples parse correctly, and a 120-page script parses in under 30ms

### Phase 2: Storage and file handling (1 day)

1. `db.ts`, `recents.ts`, `file-access.ts` (FS Access API with fallback)
2. Home page: Open button, drag-and-drop, recent list with remove, sample script
3. Opening a file creates or updates its recent entry and routes to `/script/[id]`

- **Done when:** after opening a file and reloading the page, the file appears in recents. In Chromium it reopens from its handle after a permission prompt. In Firefox/Safari it reopens from the stored snapshot

### Phase 3: Reader / preview (1–2 days)

1. `screenplay-preview.tsx` renders tokens as screenplay pages: 8.5×11in paper, 1.5in left margin, 1in other margins, Courier Prime 12pt
2. `paginate.ts`: approximate pagination by line count (about 55 lines per page). Don't break a page right after a scene heading or a character cue. Split long dialogue with `(MORE)` / `(CONT'D)`
3. Title page, scene numbers toggle, dual dialogue side by side, page numbers
4. Read mode route option, plus print CSS so the browser's "Print → Save as PDF" output looks right

- **Done when:** a sample script's page count is within about 5% of Beat's or Highland's for the same file

### Phase 4: Editor (2–3 days)

1. CodeMirror wrapper, with text kept in sync with the zustand store
2. Fountain decorations (line classes and inline marks), with screenplay-style indents, uppercase styling for character and scene lines, and dimmed notes and boneyard
3. Tab element cycling, autocomplete, keymap (save, open, palette)
4. Autosave snapshot to IndexedDB, dirty state, save back to file / Save As / download
5. Edit / Split / Read switcher, with scroll sync between editor and preview by scene

- **Done when:** typing `INT. HOUSE - DAY` formats immediately, `Tab` on an empty line after action turns the line into a character cue, Cmd+S writes back to disk in Chromium, and typing stays smooth on a 120-page script

### Phase 5: Navigation and polish (1–2 days)

1. Outline panel (sections, scenes, synopses) that highlights the current scene and jumps to a scene on click
2. Status bar stats and a basic stats dialog (scenes, pages, dialogue lines per character)
3. Command palette and focus/typewriter mode
4. Responsive layout (outline in a Sheet on small screens), toasts, and empty and error states (non-UTF-8 files, permission denied)
5. Accessibility: keyboard reachability, ARIA labels on icon buttons, contrast in both themes

### Phase 6: Quality (1 day)

- Playwright smoke tests: open sample → edit → autosave → reload → recents shows it; theme toggle persists; read mode paginates
- Lighthouse check: no hydration warnings and no layout shift from fonts or theme

**Total estimate: about 8–12 working days for a solid v1.**

**Role ownership by phase:**

| Phase                     | Lead                       | Support                          |
| ------------------------- | -------------------------- | -------------------------------- |
| 0 Scaffold and guardrails | Next.js/FE                 | Full-Stack                       |
| 1 Parser                  | Full-Stack                 | Next.js/FE                       |
| 2 Storage and files       | Full-Stack                 | UI/UX (open flow, empty states)  |
| 3 Reader / preview        | UI/UX (typography, layout) | Full-Stack (pagination)          |
| 4 Editor                  | Next.js/FE                 | UI/UX (formatting, interactions) |
| 5 Navigation and polish   | UI/UX                      | Next.js/FE                       |
| 6 Quality                 | Next.js/FE                 | All                              |

**Definition of Done for every phase:**

- Code follows §1: KISS, SOLID, loose coupling, high cohesion, and the dependency direction
- Tests are written and passing, and there are no lint or type errors
- The work has been reviewed against the PR checklist

---

## 7. Risks and how to handle them

| Risk                                                 | Mitigation                                                                                                               |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Pagination never exactly matches Final Draft or Beat | Label it "approximate". Keep the line-based model swappable for a measured-DOM paginator later                           |
| Safari and Firefox lack the FS Access API            | Snapshot fallback in IndexedDB, plus download-to-save. Show a small "Saving downloads a copy in this browser" hint       |
| Stored file handles lose permission                  | Call `queryPermission` / `requestPermission` when reopening. If the user denies it, open the snapshot instead            |
| Editor slows down on long scripts                    | Viewport-only decorations, debounced full parse, memoized preview pages, and `content-visibility: auto` on preview pages |
| Theme flashes or hydration mismatch                  | `next-themes` script injection plus `suppressHydrationWarning`. Render theme-dependent icons only after mount            |
| IndexedDB quota or private mode                      | Wrap in try/catch, degrade to session-only use, and show a toast                                                         |

---

## 8. Open questions (defaults assumed)

- **Paper size:** default US Letter. A4 toggle comes later
- **Deployment:** a fully static, client-side app that can deploy to Vercel as-is with no server functions
- **Sample script:** bundle a public-domain Fountain sample, such as the _Brick & Steel_ example from fountain.io
