import { spawn } from 'child_process'
import { resolve as pathResolve } from 'path'

const PROJECT_ROOT = pathResolve(new URL('.', import.meta.url).pathname, '../../../../')

export async function previewComposition(timelinePath?: string): Promise<string> {
  const remotionDir = pathResolve(PROJECT_ROOT, 'packages/remotion')

  try {
    // Launch Remotion Studio in background
    const child = spawn('npx', ['remotion', 'studio', 'src/index.ts'], {
      cwd: remotionDir,
      detached: true,
      stdio: 'ignore',
    })
    child.unref()

    return 'Remotion Studio launching at http://localhost:3000\nThe studio will reload automatically when you make changes.'
  } catch (err: any) {
    return `Failed to launch preview: ${err.message}`
  }
}
