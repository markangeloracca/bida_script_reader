# ADR 0002: CodeMirror 6 for the editor

- Status: Accepted
- Date: 2026-11-24

## Context

We need a plain-text editor that renders Fountain like a screenplay (indented cues and
dialogue, centred text) while typing, and stays fast on 120+ page scripts.

## Decision

Use CodeMirror 6 via `@uiw/react-codemirror`. `lib/editor` provides:

- a `StateField` of line types (from `classifyLines`) and a `ViewPlugin` that adds
  **line decorations** for visible lines only;
- Beat-style `Tab` element cycling, character/scene autocomplete, typewriter scrolling;
- a theme driven by CSS variables so light/dark mode needs no reconfiguration.

Rejected: `contentEditable` (fragile selection/undo), Monaco (heavy, code-oriented).

## Consequences

The editor is lazily loaded with the client-only workspace. `lib/editor` depends only on
CodeMirror and `lib/fountain`.
