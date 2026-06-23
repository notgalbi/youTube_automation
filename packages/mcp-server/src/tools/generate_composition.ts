import { writeFileSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'

const PROJECT_ROOT = resolve(new URL('.', import.meta.url).pathname, '../../../../')

export async function generateComposition(timeline: Record<string, unknown>, outputPath?: string): Promise<string> {
  const out = outputPath
    ? resolve(PROJECT_ROOT, outputPath)
    : resolve(PROJECT_ROOT, 'timeline/current.json')

  mkdirSync(dirname(out), { recursive: true })
  writeFileSync(out, JSON.stringify(timeline, null, 2), 'utf-8')

  const scenes = (timeline.scenes as any[])?.length ?? 0
  return `Timeline saved to ${out}\nScenes: ${scenes}\nReady for preview or render.`
}
