import { existsSync } from 'fs'
import { resolve } from 'path'

const PROJECT_ROOT = resolve(new URL('.', import.meta.url).pathname, '../../../../')

interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export async function validateTimeline(timeline: Record<string, unknown>): Promise<ValidationResult> {
  const errors: string[] = []
  const warnings: string[] = []

  if (!timeline.id) errors.push('Missing required field: id')
  if (!timeline.fps || typeof timeline.fps !== 'number') errors.push('Missing or invalid fps')
  if (!Array.isArray(timeline.scenes)) {
    errors.push('scenes must be an array')
    return { valid: false, errors, warnings }
  }

  if (timeline.scenes.length === 0) warnings.push('Timeline has no scenes')

  let expectedStart = 0
  for (const scene of timeline.scenes as any[]) {
    if (!scene.id) errors.push(`Scene missing id`)
    if (!scene.type || !['video', 'image'].includes(scene.type)) errors.push(`Scene ${scene.id}: invalid type "${scene.type}"`)
    if (!scene.src) errors.push(`Scene ${scene.id}: missing src`)
    if (typeof scene.durationInFrames !== 'number' || scene.durationInFrames < 1) {
      errors.push(`Scene ${scene.id}: invalid durationInFrames`)
    }

    if (scene.startFrame !== expectedStart) {
      warnings.push(`Scene ${scene.id}: startFrame ${scene.startFrame} expected ${expectedStart} — gap or overlap`)
    }
    expectedStart += (scene.durationInFrames ?? 0)

    // Check asset exists locally
    if (scene.src && scene.src.startsWith('/uploads/')) {
      const localPath = resolve(PROJECT_ROOT, scene.src.slice(1))
      if (!existsSync(localPath)) {
        errors.push(`Scene ${scene.id}: asset not found at ${localPath}`)
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}
