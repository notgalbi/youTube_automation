import { readdirSync, readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

const PROJECT_ROOT = resolve(new URL('.', import.meta.url).pathname, '../../../../')

export async function listTemplates(): Promise<object> {
  const templatesDir = resolve(PROJECT_ROOT, 'templates')

  if (!existsSync(templatesDir)) {
    return { templates: [], error: 'Templates directory not found' }
  }

  const files = readdirSync(templatesDir).filter(f => f.endsWith('.json'))

  const templates = files.map(file => {
    try {
      const data = JSON.parse(readFileSync(resolve(templatesDir, file), 'utf-8'))
      return {
        name: file.replace('.json', ''),
        title: data.title ?? file.replace('.json', ''),
        aspectRatio: data.aspectRatio ?? '9:16',
        description: data.description ?? '',
        sceneCount: data.scenes?.length ?? 0,
      }
    } catch {
      return { name: file.replace('.json', ''), error: 'Failed to parse' }
    }
  })

  return { templates }
}
