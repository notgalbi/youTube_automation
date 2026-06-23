import { spawn } from 'child_process'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

const PROJECT_ROOT = resolve(new URL('.', import.meta.url).pathname, '../../../../')

export interface RenderProgress {
  running: boolean
  progress: number        // 0–100
  frame: number
  totalFrames: number
  stage: string
  outputFile: string
  error: string
  done: boolean
}

export const renderState: RenderProgress = {
  running: false,
  progress: 0,
  frame: 0,
  totalFrames: 0,
  stage: '',
  outputFile: '',
  error: '',
  done: false,
}

function resetState() {
  renderState.running = false
  renderState.progress = 0
  renderState.frame = 0
  renderState.totalFrames = 0
  renderState.stage = ''
  renderState.outputFile = ''
  renderState.error = ''
  renderState.done = false
}

// Parse Remotion CLI output lines for progress info
function parseLine(line: string) {
  // Frame progress: "Rendering frame 45 of 300" or "(45/300)"
  const frameMatch = line.match(/(\d+)\s*\/\s*(\d+)/) ?? line.match(/frame\s+(\d+)\s+of\s+(\d+)/i)
  if (frameMatch) {
    const frame = parseInt(frameMatch[1], 10)
    const total = parseInt(frameMatch[2], 10)
    if (total > 0) {
      renderState.frame = frame
      renderState.totalFrames = total
      renderState.progress = Math.min(Math.round((frame / total) * 90), 90) // cap at 90% until encoding done
      renderState.stage = `Rendering frame ${frame} / ${total}`
      return
    }
  }

  // Percentage match: "45%"
  const pctMatch = line.match(/(\d+(?:\.\d+)?)%/)
  if (pctMatch) {
    const pct = parseFloat(pctMatch[1])
    if (pct >= 0 && pct <= 100) {
      renderState.progress = Math.min(Math.round(pct * 0.9), 90)
    }
  }

  // Stage hints
  const lower = line.toLowerCase()
  if (lower.includes('bundl')) renderState.stage = 'Bundling...'
  else if (lower.includes('encod')) { renderState.stage = 'Encoding video...'; renderState.progress = Math.max(renderState.progress, 91) }
  else if (lower.includes('mux') || lower.includes('finaliz')) { renderState.stage = 'Finalizing...'; renderState.progress = 97 }
}

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

  resetState()
  renderState.running = true
  renderState.stage = 'Starting render...'
  renderState.outputFile = outFile

  return new Promise(resolve_ => {
    const child = spawn(
      'npx',
      ['remotion', 'render', 'src/index.ts', 'MainComposition', outPath, `--props=${propsJson}`, '--overwrite'],
      { cwd: remotionDir, shell: false }
    )

    child.stdout.on('data', (data: Buffer) => {
      data.toString().split('\n').forEach(parseLine)
    })
    child.stderr.on('data', (data: Buffer) => {
      data.toString().split('\n').forEach(parseLine)
    })

    child.on('close', code => {
      if (code === 0) {
        renderState.progress = 100
        renderState.stage = 'Done!'
        renderState.done = true
        renderState.running = false
        resolve_(`Render complete!\nOutput: ${outPath}\nFile: ${outFile}`)
      } else {
        renderState.error = `Process exited with code ${code}`
        renderState.running = false
        renderState.done = true
        resolve_(`Render failed (exit ${code})`)
      }
    })

    child.on('error', err => {
      renderState.error = err.message
      renderState.running = false
      renderState.done = true
      resolve_(`Render failed: ${err.message}`)
    })
  })
}
