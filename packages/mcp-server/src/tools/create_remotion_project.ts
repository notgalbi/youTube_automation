import { existsSync } from 'fs'
import { resolve } from 'path'

const PROJECT_ROOT = resolve(new URL('.', import.meta.url).pathname, '../../../../')

export async function createRemotionProject(): Promise<string> {
  const remotionSrc = resolve(PROJECT_ROOT, 'packages/remotion/src')
  const uploadsDir = resolve(PROJECT_ROOT, 'uploads')
  const exportsDir = resolve(PROJECT_ROOT, 'exports')
  const timelineDir = resolve(PROJECT_ROOT, 'timeline')
  const templatesDir = resolve(PROJECT_ROOT, 'templates')

  const status: string[] = []

  for (const dir of [remotionSrc, uploadsDir, exportsDir, timelineDir, templatesDir]) {
    if (existsSync(dir)) {
      status.push(`✓ ${dir} exists`)
    } else {
      status.push(`✗ ${dir} missing — run npm install from project root`)
    }
  }

  const indexExists = existsSync(resolve(remotionSrc, 'index.ts'))
  status.push(indexExists ? '✓ Remotion entry point exists' : '✗ Remotion entry point missing')

  return ['Remotion project check:', ...status].join('\n')
}
