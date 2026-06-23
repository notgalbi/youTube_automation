import { execSync } from 'child_process'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

const PROJECT_ROOT = resolve(new URL('.', import.meta.url).pathname, '../../../../')

export async function renderVideo(timelinePath?: string, outputFilename?: string): Promise<string> {
  const tlPath = timelinePath
    ? resolve(PROJECT_ROOT, timelinePath)
    : resolve(PROJECT_ROOT, 'timeline/current.json')

  if (!existsSync(tlPath)) {
    return `Error: Timeline file not found at ${tlPath}. Run generate_composition first.`
  }

  const timeline = JSON.parse(readFileSync(tlPath, 'utf-8'))
  const timestamp = Date.now()
  const outFile = outputFilename ?? `output-${timestamp}.mp4`
  const outPath = resolve(PROJECT_ROOT, 'exports', outFile)

  const remotionDir = resolve(PROJECT_ROOT, 'packages/remotion')

  const propsJson = JSON.stringify({ timeline })
  const propsEncoded = Buffer.from(propsJson).toString('base64')

  try {
    const cmd = `cd "${remotionDir}" && npx remotion render src/index.ts MainComposition "${outPath}" --props='${propsJson}' --overwrite`
    execSync(cmd, { stdio: 'pipe', timeout: 300_000 })
    return `Render complete!\nOutput: ${outPath}\nFile: ${outFile}`
  } catch (err: any) {
    const msg = err?.stderr?.toString() ?? err?.message ?? String(err)
    return `Render failed:\n${msg}`
  }
}
