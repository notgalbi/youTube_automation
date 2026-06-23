import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import multer from 'multer'
import { resolve, extname } from 'path'
import { readdirSync, statSync, readFileSync, writeFileSync, existsSync } from 'fs'
import Anthropic from '@anthropic-ai/sdk'
import { renderVideo } from './tools/render_video.js'
import { validateTimeline } from './tools/validate_timeline.js'
import { generateComposition } from './tools/generate_composition.js'
import { listTemplates } from './tools/list_templates.js'
import { applyTemplate } from './tools/apply_template.js'
import { addCaptions } from './tools/add_captions.js'
import { previewComposition } from './tools/preview_composition.js'

const PROJECT_ROOT = resolve(new URL('.', import.meta.url).pathname, '../../../../')
const UPLOADS_DIR = resolve(PROJECT_ROOT, 'uploads')
const EXPORTS_DIR = resolve(PROJECT_ROOT, 'exports')
const TIMELINE_DIR = resolve(PROJECT_ROOT, 'timeline')

const app = express()
app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use('/uploads', express.static(UPLOADS_DIR))
app.use('/exports', express.static(EXPORTS_DIR))

// Multer setup
const storage = multer.diskStorage({
  destination: UPLOADS_DIR,
  filename: (_, file, cb) => {
    const ts = Date.now()
    cb(null, `${ts}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`)
  },
})
const upload = multer({ storage, limits: { fileSize: 500 * 1024 * 1024 } })

// Upload endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
  res.json({ path: `/uploads/${req.file.filename}`, filename: req.file.originalname })
})

// List exports
app.get('/api/exports', (_, res) => {
  try {
    const files = readdirSync(EXPORTS_DIR)
      .filter(f => f.endsWith('.mp4'))
      .map(f => {
        const stat = statSync(resolve(EXPORTS_DIR, f))
        return { filename: f, size: stat.size, createdAt: stat.birthtime.toISOString(), path: `/exports/${f}` }
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    res.json({ exports: files })
  } catch {
    res.json({ exports: [] })
  }
})

// Validate timeline
app.post('/api/validate', async (req, res) => {
  const result = await validateTimeline(req.body.timeline)
  res.json(result)
})

// Generate composition (save timeline JSON)
app.post('/api/composition', async (req, res) => {
  const result = await generateComposition(req.body.timeline, req.body.outputPath)
  res.json({ message: result })
})

// Preview
app.post('/api/preview', async (req, res) => {
  const { timeline } = req.body
  if (timeline) await generateComposition(timeline)
  const result = await previewComposition()
  res.json({ message: result })
})

// Render
app.post('/api/render', async (req, res) => {
  const { timeline, outputFilename } = req.body
  if (timeline) {
    writeFileSync(resolve(TIMELINE_DIR, 'current.json'), JSON.stringify(timeline, null, 2))
  }
  const result = await renderVideo(undefined, outputFilename)
  if (result.startsWith('Error') || result.startsWith('Render failed')) {
    return res.status(500).json({ error: result })
  }
  const match = result.match(/File: (.+\.mp4)/)
  res.json({ message: result, outputFile: match?.[1] ?? 'output.mp4' })
})

// List templates
app.get('/api/templates', async (_, res) => {
  const result = await listTemplates()
  res.json(result)
})

// Apply template
app.post('/api/templates/apply', async (req, res) => {
  const { templateName, assets, title } = req.body
  const result = await applyTemplate(templateName, assets, title)
  res.json(result)
})

// Add captions
app.post('/api/captions', async (req, res) => {
  const { timeline, sceneId, transcript, fps } = req.body
  const result = await addCaptions(timeline, sceneId, transcript, fps)
  res.json(result)
})

// ─── Claude AI Chat for custom edits ───────────────────────────────────────

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `You are an AI video editor assistant. The user will describe edits they want made to their video timeline.

You have access to the current timeline JSON. When the user requests a change, respond with:
1. A brief explanation of what you're doing
2. A JSON block (wrapped in \`\`\`json ... \`\`\`) with the COMPLETE updated timeline

The timeline JSON format:
{
  "id": "string",
  "title": "string",
  "aspectRatio": "9:16" | "16:9" | "1:1",
  "fps": 30,
  "scenes": [
    {
      "id": "string",
      "type": "video" | "image",
      "src": "/uploads/filename",
      "filename": "string",
      "startFrame": 0,
      "durationInFrames": 150,
      "textOverlays": [
        { "id": "string", "text": "string", "x": 50, "y": 80, "fontSize": 48, "color": "#ffffff", "startFrame": 0, "durationInFrames": 90 }
      ],
      "captions": [
        { "id": "string", "text": "string", "startFrame": 0, "durationInFrames": 60 }
      ],
      "transition": { "type": "fade" | "slide" | "none", "durationInFrames": 15 }
    }
  ],
  "backgroundMusic": { "src": "/uploads/audio.mp3", "volume": 0.5 } | null
}

Rules:
- Always return the complete updated timeline in a \`\`\`json block
- Keep existing scene IDs stable when modifying scenes
- Generate new unique IDs (e.g. "overlay-" + timestamp-like number) for new overlays/captions
- If the user asks to add text to "all scenes", apply to every scene
- If the user asks to change duration, update durationInFrames (30 frames = 1 second at 30fps)
- Be creative but respect what the user asks for
`

app.post('/api/claude/chat', async (req, res) => {
  const { message, timeline, history = [] } = req.body

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(400).json({ error: 'ANTHROPIC_API_KEY not set in .env file' })
  }

  const messages: Anthropic.MessageParam[] = [
    ...history,
    {
      role: 'user',
      content: `Current timeline:\n\`\`\`json\n${JSON.stringify(timeline, null, 2)}\n\`\`\`\n\nUser request: ${message}`,
    },
  ]

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8096,
      system: SYSTEM_PROMPT,
      messages,
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''

    // Extract updated timeline from JSON block if present
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/)
    let updatedTimeline: object | null = null
    if (jsonMatch) {
      try {
        updatedTimeline = JSON.parse(jsonMatch[1])
      } catch {
        // Claude returned malformed JSON — surface the text only
      }
    }

    res.json({
      text,
      updatedTimeline,
      assistantMessage: { role: 'assistant', content: text },
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message ?? 'Claude API error' })
  }
})

const PORT = Number(process.env.MCP_PORT ?? 3001)
app.listen(PORT, () => {
  console.log(`API server running at http://localhost:${PORT}`)
})
