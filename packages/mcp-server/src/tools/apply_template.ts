import { readFileSync, existsSync, writeFileSync } from 'fs'
import { resolve } from 'path'

const PROJECT_ROOT = resolve(new URL('.', import.meta.url).pathname, '../../../../')

interface Asset {
  src: string
  type: 'video' | 'image' | 'audio'
  filename?: string
}

export async function applyTemplate(templateName: string, assets: Asset[], title?: string): Promise<object> {
  const templatePath = resolve(PROJECT_ROOT, 'templates', `${templateName}.json`)

  if (!existsSync(templatePath)) {
    return { error: `Template "${templateName}" not found. Run list_templates to see available templates.` }
  }

  const template = JSON.parse(readFileSync(templatePath, 'utf-8'))

  const mediaAssets = assets.filter(a => a.type !== 'audio')
  const audioAssets = assets.filter(a => a.type === 'audio')

  const scenes = mediaAssets.map((asset, idx) => ({
    id: `scene-${idx + 1}`,
    type: asset.type as 'video' | 'image',
    src: asset.src,
    filename: asset.filename ?? asset.src.split('/').pop() ?? `file-${idx}`,
    startFrame: idx * (template.defaultSceneDuration ?? 150),
    durationInFrames: template.defaultSceneDuration ?? 150,
    textOverlays: template.scenes?.[idx]?.textOverlays ?? [],
    captions: template.scenes?.[idx]?.captions ?? [],
    transition: template.defaultTransition ?? { type: 'fade', durationInFrames: 15 },
  }))

  const timeline = {
    id: `project-${Date.now()}`,
    title: title ?? template.title ?? 'My Video',
    aspectRatio: template.aspectRatio ?? '9:16',
    fps: template.fps ?? 30,
    scenes,
    backgroundMusic: audioAssets[0]
      ? { src: audioAssets[0].src, volume: 0.4 }
      : null,
  }

  const outPath = resolve(PROJECT_ROOT, 'timeline/current.json')
  writeFileSync(outPath, JSON.stringify(timeline, null, 2), 'utf-8')

  return { timeline, savedTo: outPath }
}
