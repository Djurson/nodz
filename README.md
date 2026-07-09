# Nodz

Nodz is a desktop app that visualizes a code repository's structure as an interactive node graph, files as nodes, imports/calls/class-usage as edges. It's built with [Wails v2](https://wails.io) (Go backend + React/Vite/TypeScript frontend) running in a single native window.

## Status

This is currently a **frontend-only prototype running on mock data**. There is no analysis engine yet:

- The Go backend exposes a single bound method (`Greet`), the Go/frontend bridge is a placeholder, not a real API.
- All graph, commit history, and file data shown in the UI comes from a hand-authored fake repository (`frontend/src/data/mock-repo.ts`), used to prototype the UI/UX ahead of a real parser.
- Nothing reads a real filesystem or `.git` directory yet.

See `CLAUDE.md` for detailed engineering context, architecture decisions, and known gotchas.

## Planned direction

- **Single repo per app instance** - point the app at one local repo path per launch.
- **Manual sync only** - no filesystem watchers or git hooks; the user explicitly triggers a re-scan.
- **JS/TS/Go parsing first** - other languages later, once the core pipeline is proven.

The exact parsing mechanism (tree-sitter, per-language parsers, or shelling out to existing tools) is still undecided.

## Tech stack

- **Backend:** Go, [Wails v2](https://wails.io)
- **Frontend:** React, TypeScript, Vite
- **Graph rendering:** force-graph
- **UI components:** shadcn (`base-nova` style), Tailwind CSS v4, Phosphor Icons

## Development

Requires [Wails v2](https://wails.io/docs/gettingstarted/installation) and Node.js.

Run the full app with hot reload (Go + frontend):

```bash
wails dev
```

This starts a Vite dev server with fast hot reload for frontend changes. A dev server also runs at `http://localhost:34115` if you want to open the app in a browser and call Go methods from devtools.

### Frontend only

From `frontend/`:

```bash
npm run dev      # Vite dev server
npm run lint      # ESLint
npx tsc -b       # Typecheck
npm run build    # Typecheck + production build
```

## Building

To build a redistributable production binary:

```bash
wails build
```

For a quick backend-only compile check without building the frontend:

```bash
go build -o /dev/null .
```

## Configuration

Project settings live in `wails.json`. See the [Wails project config reference](https://wails.io/docs/reference/project-config) for details.
