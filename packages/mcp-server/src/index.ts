import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import { createRemotionProject } from './tools/create_remotion_project.js'
import { generateComposition } from './tools/generate_composition.js'
import { validateTimeline } from './tools/validate_timeline.js'
import { renderVideo } from './tools/render_video.js'
import { listTemplates } from './tools/list_templates.js'
import { applyTemplate } from './tools/apply_template.js'
import { addCaptions } from './tools/add_captions.js'
import { previewComposition } from './tools/preview_composition.js'

const server = new McpServer({
  name: 'remotion-editor-mcp',
  version: '1.0.0',
})

server.tool(
  'create_remotion_project',
  'Initializes the Remotion project structure if missing.',
  {},
  async () => {
    const result = await createRemotionProject()
    return { content: [{ type: 'text', text: result }] }
  }
)

server.tool(
  'generate_composition',
  'Creates or updates a Remotion composition from timeline JSON.',
  {
    timeline: z.record(z.unknown()).describe('Timeline JSON object'),
    outputPath: z.string().optional().describe('Path to write the timeline JSON (defaults to /timeline/current.json)'),
  },
  async ({ timeline, outputPath }) => {
    const result = await generateComposition(timeline, outputPath)
    return { content: [{ type: 'text', text: result }] }
  }
)

server.tool(
  'validate_timeline',
  'Checks timeline JSON for missing assets, invalid timestamps, and format issues.',
  {
    timeline: z.record(z.unknown()).describe('Timeline JSON to validate'),
  },
  async ({ timeline }) => {
    const result = await validateTimeline(timeline)
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
  }
)

server.tool(
  'render_video',
  'Runs the Remotion render command and exports MP4 to /exports.',
  {
    timelinePath: z.string().optional().describe('Path to timeline JSON (defaults to /timeline/current.json)'),
    outputFilename: z.string().optional().describe('Output filename (defaults to output-<timestamp>.mp4)'),
  },
  async ({ timelinePath, outputFilename }) => {
    const result = await renderVideo(timelinePath, outputFilename)
    return { content: [{ type: 'text', text: result }] }
  }
)

server.tool(
  'list_templates',
  'Returns available video templates.',
  {},
  async () => {
    const result = await listTemplates()
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
  }
)

server.tool(
  'apply_template',
  'Takes user assets and a template name, generates a timeline JSON.',
  {
    templateName: z.string().describe('Template name: social_ad | ig_reel | tiktok_caption_video | youtube_short | luxury_restaurant_promo | analytics_portfolio_demo'),
    assets: z.array(z.object({
      src: z.string(),
      type: z.enum(['video', 'image', 'audio']),
      filename: z.string().optional(),
    })).describe('List of asset paths to include'),
    title: z.string().optional().describe('Video title'),
  },
  async ({ templateName, assets, title }) => {
    const result = await applyTemplate(templateName, assets, title)
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
  }
)

server.tool(
  'add_captions',
  'Adds captions/subtitles from user text or transcript to a timeline.',
  {
    timeline: z.record(z.unknown()).describe('Timeline JSON'),
    sceneId: z.string().describe('Scene ID to add captions to'),
    transcript: z.string().describe('Caption text — use newlines to separate caption segments'),
    fps: z.number().default(30).describe('Frames per second'),
  },
  async ({ timeline, sceneId, transcript, fps }) => {
    const result = await addCaptions(timeline, sceneId, transcript, fps)
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
  }
)

server.tool(
  'preview_composition',
  'Opens Remotion Studio or local preview for the current timeline.',
  {
    timelinePath: z.string().optional().describe('Path to timeline JSON'),
  },
  async ({ timelinePath }) => {
    const result = await previewComposition(timelinePath)
    return { content: [{ type: 'text', text: result }] }
  }
)

const transport = new StdioServerTransport()
await server.connect(transport)
console.error('remotion-editor-mcp server running on stdio')
