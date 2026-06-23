# AI Video Editor — Remotion + Claude

A local AI-assisted video editor powered by Remotion (rendering) and Claude (intelligent edits).

## Architecture

```
youTube_automation/
├── apps/editor/          # Vite React editor UI (port 5173)
├── packages/remotion/    # Remotion compositions
├── packages/mcp-server/  # Express API + MCP server for Claude Code
├── uploads/              # Uploaded media files
├── exports/              # Rendered MP4 outputs
├── templates/            # JSON video templates
└── timeline/             # Saved timeline JSON files
```

## Prerequisites

- Node.js 18+
- npm 9+
- ffmpeg (required by Remotion for rendering): `brew install ffmpeg`

## Setup

```bash
# 1. Clone / enter the project
cd youTube_automation

# 2. Copy env file and add your Anthropic API key
cp .env.example .env
# Edit .env: set ANTHROPIC_API_KEY=sk-ant-...

# 3. Install all dependencies
npm install

# 4. Start the API server (terminal 1)
npm run api:dev

# 5. Start the editor UI (terminal 2)
npm run dev

# Optional: Open Remotion Studio (terminal 3)
npm run remotion:studio
```

Open http://localhost:5173 in your browser.

## Commands

| Command | Description |
|---|---|
| `npm run dev` | Start editor UI at http://localhost:5173 |
| `npm run api:dev` | Start API + Claude backend at http://localhost:3001 |
| `npm run remotion:studio` | Open Remotion Studio at http://localhost:3000 |
| `npm run render` | Render current timeline to /exports |
| `npm run mcp:start` | Start MCP server (for Claude Code integration) |

## Editor Workflow

1. **Upload** — drag & drop video/image/audio files
2. **Arrange** — reorder scenes, set durations
3. **Edit** — add text overlays and captions per scene
4. **Claude** — use the AI chat panel (right side) to describe edits in plain English
5. **Preview** — open Remotion Studio to preview
6. **Render** — click "Render MP4" to export

## Claude AI Chat

The right panel lets you describe edits to Claude:

- "Add bold white text 'Subscribe!' to all scenes"
- "Make the first scene 5 seconds long"
- "Change to 16:9 YouTube format"
- "Add captions: Hello world\nThis is awesome"

Claude reads your current timeline and returns an updated version automatically applied.

Requires `ANTHROPIC_API_KEY` in your `.env` file.

## Templates

Six templates available:

| Template | Format | Use case |
|---|---|---|
| `tiktok_caption_video` | 9:16 | TikTok with captions |
| `ig_reel` | 9:16 | Instagram Reels |
| `youtube_short` | 9:16 | YouTube Shorts |
| `social_ad` | 1:1 | Square social ads |
| `luxury_restaurant_promo` | 16:9 | Cinematic promo |
| `analytics_portfolio_demo` | 16:9 | Portfolio walkthrough |

## MCP Server (Claude Code Integration)

### Connect to Claude Code

Add to your Claude Code MCP config (`~/.claude/claude_desktop_config.json` or via `claude mcp add`):

```json
{
  "mcpServers": {
    "remotion-editor-mcp": {
      "command": "node",
      "args": ["/absolute/path/to/youTube_automation/packages/mcp-server/dist/index.js"],
      "env": {
        "ANTHROPIC_API_KEY": "sk-ant-..."
      }
    }
  }
}
```

Or using `tsx` directly (no build needed):
```json
{
  "mcpServers": {
    "remotion-editor-mcp": {
      "command": "npx",
      "args": ["tsx", "/absolute/path/to/youTube_automation/packages/mcp-server/src/index.ts"]
    }
  }
}
```

### MCP Tools Available

- `create_remotion_project` — verify project structure
- `generate_composition` — save timeline JSON
- `validate_timeline` — check for errors before rendering
- `render_video` — render to MP4
- `list_templates` — see available templates
- `apply_template` — generate timeline from template + assets
- `add_captions` — add captions from text/transcript
- `preview_composition` — open Remotion Studio

## Timeline JSON Format

```json
{
  "id": "project-1",
  "title": "My Video",
  "aspectRatio": "9:16",
  "fps": 30,
  "scenes": [
    {
      "id": "scene-1",
      "type": "image",
      "src": "/uploads/photo.jpg",
      "filename": "photo.jpg",
      "startFrame": 0,
      "durationInFrames": 150,
      "textOverlays": [
        { "id": "o1", "text": "Hello!", "x": 50, "y": 20, "fontSize": 60, "color": "#fff", "startFrame": 0, "durationInFrames": 90 }
      ],
      "captions": [
        { "id": "c1", "text": "Welcome to my video", "startFrame": 30, "durationInFrames": 60 }
      ],
      "transition": { "type": "fade", "durationInFrames": 15 }
    }
  ],
  "backgroundMusic": { "src": "/uploads/music.mp3", "volume": 0.4 }
}
```
