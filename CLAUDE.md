# CLAUDE.md — AI Video Editor

This file tells Claude Code how to work with this repo.

## Project overview

This is a local AI-assisted video editor:
- **`apps/editor`** — Vite React frontend (video editor UI, port 5173)
- **`packages/remotion`** — Remotion compositions (programmatic video rendering)
- **`packages/mcp-server`** — Express API (port 3001) + MCP server for Claude Code tools
- **`uploads/`** — user-uploaded media
- **`exports/`** — rendered MP4 files
- **`templates/`** — reusable JSON templates
- **`timeline/`** — saved timeline JSON files

## Key files

| File | Purpose |
|---|---|
| `packages/remotion/src/schema.ts` | Zod schemas for timeline JSON — edit this to change the data model |
| `packages/remotion/src/Root.tsx` | Remotion composition entry — defines how scenes are rendered |
| `packages/mcp-server/src/api.ts` | Express API routes + Claude AI chat endpoint |
| `packages/mcp-server/src/index.ts` | MCP server with all 8 tools |
| `apps/editor/src/App.tsx` | Root editor component — owns timeline state |
| `apps/editor/src/components/ClaudeChat.tsx` | Claude AI chat panel (right panel in UI) |

## MCP tools

When Claude Code uses this MCP server, prefer this workflow:
1. `validate_timeline` before rendering
2. `generate_composition` to save timeline JSON
3. `render_video` to export

## Running locally

```bash
# Terminal 1: API server
npm run api:dev

# Terminal 2: Editor UI
npm run dev

# Optional Terminal 3: Remotion Studio
npm run remotion:studio
```

## Adding a new Remotion component

1. Create file in `packages/remotion/src/components/`
2. Import it in `Root.tsx` if it needs to be in the composition
3. Add any new props to `packages/remotion/src/schema.ts` with Zod validation

## Adding a new MCP tool

1. Create `packages/mcp-server/src/tools/your_tool.ts`
2. Import and register it in `packages/mcp-server/src/index.ts`
3. If it needs an HTTP route, add it to `packages/mcp-server/src/api.ts`

## Adding a new template

Create `templates/your_template_name.json` following the structure of existing templates.

## Timeline JSON schema

The canonical schema lives in `packages/remotion/src/schema.ts`.
Key types: `Timeline`, `Scene`, `TextOverlay`, `Caption`.

## Do not

- Commit files from `uploads/` or `exports/`
- Commit `.env` files
- Modify `node_modules/`
- Run `npm install` in subdirectories — always run from root
