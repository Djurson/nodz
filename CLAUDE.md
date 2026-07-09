# CLAUDE.md

Engineering context for this repo. This file is ground truth for "what's actually built" and "how to work in this codebase".

## What this is

Nodz, a desktop app that visualizes a code repository's structure as an interactive node graph (files as nodes, imports/calls/class-usage as edges). Built with Wails v2 (Go backend + React/Vite/TS frontend in a single native window).

## Current implementation status

**This is a frontend-only prototype running on mock data.** There is no analysis engine yet.

- `app.go` exposes exactly one bound method: `Greet(name string) string`. That's the entire Go/frontend bridge today.
- The graph, commit history, file list, everything the UI shows, comes from `frontend/src/data/mock-repo.ts`, a hand-authored fake repo ("acme/orbit", 36 files, 14 commits, 56 edges). It exists to prototype the UI/UX, not as a fixture for a real backend.
- Nothing reads a real filesystem or `.git` directory yet.

Don't write code that assumes a working analysis backend exists, it doesn't. Don't casually extend the mock dataset's shape without checking whether that shape still makes sense once real parsing exists.

## Architecture decisions (settled)

- **Repo scope: single repo per app instance.** The app points at one local repo path per launch. The sidebar's "acme/orbit" chip and "Back to repos" link are mock scaffolding from the prototype UI, not a committed multi-repo feature, don't build persistence/repo-switching on the assumption they are.
- **Live updates: manual sync only.** No filesystem watcher, no git hooks. The user triggers a re-scan explicitly (e.g. a sync button). Do not add `fsnotify` or ambient watching.
- **Parsing language scope: JS/TS/Go first**, other languages later. Multi-language from day one is not the plan, get these three working before generalizing.

## Open questions (not yet decided, ask before assuming)

- **Parsing mechanism.** How the (future) Go backend will actually extract import/call/class-usage relationships is undecided, tree-sitter bindings, a language-specific parser per language, shelling out to existing tools (madge, dependency-cruiser, `go/ast`), or something else. Ask before implementing any of this.
- Whether the "Insights" and "Structure" sidebar nav items (currently inert, no click handler) get built out or removed. "Settings" is now built out (opens a real dialog, theme, label size, edge visibility, layout spread, see `frontend/src/components/settings/settings-dialog.tsx`).
- How "manual sync" will be wired from the frontend to a Go-side rescan (a bound Wails method presumably, but the method doesn't exist yet).

## Repo layout

```text
/                       Go module root (Wails backend)
  main.go               wails.Run() config, window options, Mac titlebar config
  app.go                App struct + bound methods (currently just Greet)
  wails.json            Wails project config
  project.md            Product vision doc (see note above)
frontend/                React/Vite/TS frontend
  src/
    App.tsx             Root component, view state (graph/history), layout composition
    data/mock-repo.ts    Fake repo dataset (placeholder for real backend data)
    types/repo-graph.ts  RepoNode/RepoEdge/RepoCommit types, the data contract the UI expects
    lib/repo-graph.ts    Commit-slicing, degree/centrality, circular-dependency detection
    lib/utils.ts         shadcn's cn() helper
    components/
      graph/             graph-canvas.tsx (force-graph wrapper), node-detail-panel.tsx
      layout/            app-sidebar, top-bar, bottom-toolbar, history-scrubber
      ui/                shadcn components (see below)
    style.css            Tailwind v4 entry point + theme tokens (CSS custom properties)
  components.json         shadcn config (style: base-nova, iconLibrary: phosphor)
  wailsjs/                Generated Wails bindings (do not hand-edit)
```

## Frontend conventions

### shadcn, always check the registry first

Before writing a UI element with raw HTML/divs, check whether a shadcn component already covers it (`npx shadcn@latest add <name>`, or check `components.json` / `src/components/ui/` for what's installed). Style is `base-nova`, base color `mist`, CSS variables on, no prefix. Currently installed: `avatar`, `badge`, `button`, `dialog`, `input`, `label`, `scroll-area`, `separator`, `slider`, `switch`, `tabs`, `tooltip`. Add new ones via the CLI rather than hand-rolling, it wires variants/CVA/base-ui correctly and matches the rest of the kit.

### Icons, phosphor-icons/react, non-deprecated exports only

Many phosphor icon exports are deprecated legacy names (e.g. `Cursor`, `Graph`, `Hand`) in favor of an `*Icon`-suffixed canonical export (`CursorIcon`, `GraphIcon`, `HandIcon`). Each icon's `.d.ts` in `node_modules/@phosphor-icons/react/dist/csr/<Name>.d.ts` says which is current, check before importing, always use the `*Icon` form. `iconLibrary` in `components.json` is already set to `phosphor`.

### Tailwind v4.3, CSS-first, not the old JS-config mental model

- No `tailwind.config.js`. Theme lives in `src/style.css` via `@theme inline { ... }` mapping CSS custom properties (defined in `:root` / `.dark`) to Tailwind tokens.
- Colors are `oklch()`, not hex/rgb.
- Theme: light/dark/system, user-selectable (Settings → Appearance), persisted to `localStorage` (`nodz-theme` key) via `frontend/src/hooks/use-theme.ts`. The `dark` class is toggled on `<html>`, a no-flash inline script in `index.html` applies it before first paint, kept in sync by hand with the hook's logic (same storage key). This was dark-only earlier in the project; if you ever read computed CSS custom properties from JS (e.g. canvas rendering), prefer `getComputedStyle(someElementInsideTheTree)` over `document.documentElement` defensively, since where the `.dark` class lives has moved before and canvas color resolution broke silently (rendered light-mode colors) when it didn't match, `graph-canvas.tsx` already does this correctly.
- Arbitrary-value / custom-property syntax differs from older Tailwind you may have learned, e.g. `shadow-[0_0_24px_-6px_var(--primary-glow)]`, `[--wails-draggable:no-drag]`. Check current Tailwind v4 docs/syntax before assuming v3-era patterns still apply.

### Path alias

`@/*` → `frontend/src/*` (set in both `tsconfig.json` `paths` and `vite.config.ts` `resolve.alias`, kept in sync manually, if you add/change one, update the other).

## Known gotchas (hard-won this session, don't rediscover)

- **`force-graph`'s `.d.ts` models the default export as a class**, but the actual runtime (Kapsule-based) is a double-invoked factory: `ForceGraph()(el)`. Calling it per the types (`new ForceGraph(el)`) doesn't match runtime behavior. `graph-canvas.tsx` casts the import through a manually-recovered generic factory type, see the comment there before touching it.
- **force-graph node click hit-testing is frame-async**, not a synchronous hit-test at click time, it relies on `hoverObj` set during the next animation frame after `mousemove`. Synthetic/programmatic click sequences that move-then-immediately-click can miss. Matters for automated UI testing of the graph, not for real users.

## Commands

Frontend (run from `frontend/`):

- `npm run dev`, Vite dev server
- `npm run lint`, ESLint (flat config, `eslint.config.ts`)
- `npx tsc -b`, typecheck (project references: root `tsconfig.json` + `tsconfig.node.json`)
- `npm run build`, `tsc && vite build`

Backend / full app (run from repo root):

- `wails dev`, full app with hot reload (Go + frontend)
- `wails build`, production binary
- `go build -o /dev/null .`, quick backend-only compile check

Always run `npx tsc -b` and `npm run lint` after frontend changes, both must be clean before considering work done.
