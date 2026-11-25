## What & why

<!-- One or two sentences. Link the issue if there is one. -->

## How to verify

<!-- Steps or screenshots. -->

## Checklist (see PLAN.md §1)

- [ ] **KISS / YAGNI** — the simplest change that meets the requirement; no speculative abstractions
- [ ] **Single responsibility** — each new module/component does one thing
- [ ] **Open/Closed** — new behaviour added via registries/interfaces, not by growing existing branches
- [ ] **Dependency direction** — `app → components → hooks → lib/store → lib/{editor,storage} → lib/fountain` (lint enforces)
- [ ] **Loose coupling** — UI depends on interfaces (`lib/storage/types.ts`), not on IndexedDB/browser APIs
- [ ] **High cohesion** — code lives in its feature folder; public API exported via `index.ts`
- [ ] **No Fountain syntax re-interpreted** outside `lib/fountain`
- [ ] Unit tests added/updated; `npm run check` passes
- [ ] Works in light **and** dark mode; keyboard accessible; no hydration warnings
