# ADR 0001: Write our own line-based Fountain parser

- Status: Accepted
- Date: 2026-11-24

## Context

The editor formats each line as its screenplay element as you type, so it needs the
element type of **every source line**. The outline, statistics and paginated preview
need block-level tokens. Existing libraries (e.g. `fountain-js`) produce HTML and do
not expose per-line classification.

## Decision

Implement a small, pure-TypeScript parser in `lib/fountain`:

- `classifyLines` – line-oriented state machine (title page, boneyard, notes, dialogue)
  plus an ordered **element rule registry** (`element-registry.ts`) for standalone lines.
- `parseFountain` – lines → tokens; `buildBlocks` / `paginate` – tokens → pages.
- `inline.ts` – one matcher for emphasis/notes used by both editor and preview.

`lib/fountain` must not import React, the DOM, CodeMirror or storage (ESLint-enforced).

## Consequences

- One source of truth for Fountain syntax; editor and preview cannot disagree.
- New elements are added by appending a rule (Open/Closed).
- We own spec coverage; the Vitest suite tracks the spec examples.
