#!/usr/bin/env node
// Standalone script: read timeline/current.json and render to exports/
import { bundle } from '@remotion/bundler'
import { renderMedia, selectComposition } from '@remotion/renderer'
import { readFileSync, existsSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = resolve(__dirname, '../../../..')
const TIMELINE_PATH = resolve(PROJECT_ROOT, 'timeline/current.json')
const EXPORTS_DIR = resolve(PROJECT_ROOT, 'exports')

if (!existsSync(TIMELINE_PATH)) {
  console.error('No timeline found at', TIMELINE_PATH)
  process.exit(1)
}

const timeline = JSON.parse(readFileSync(TIMELINE_PATH, 'utf-8'))
mkdirSync(EXPORTS_DIR, { recursive: true })

const outFile = resolve(EXPORTS_DIR, `output-${Date.now()}.mp4`)
const entryPoint = resolve(__dirname, '../src/index.ts')

console.log('Bundling Remotion...')
const bundled = await bundle({ entryPoint })

const dims = { '9:16': { width: 1080, height: 1920 }, '16:9': { width: 1920, height: 1080 }, '1:1': { width: 1080, height: 1080 } }
const { width, height } = dims[timeline.aspectRatio] ?? dims['9:16']
const totalFrames = timeline.scenes.reduce((acc, s) => acc + s.durationInFrames, 0)

console.log('Selecting composition...')
const composition = await selectComposition({
  serveUrl: bundled,
  id: 'MainComposition',
  inputProps: { timeline },
})

console.log(`Rendering ${totalFrames} frames to ${outFile}...`)
await renderMedia({
  composition: { ...composition, width, height, durationInFrames: totalFrames, fps: timeline.fps },
  serveUrl: bundled,
  codec: 'h264',
  outputLocation: outFile,
  inputProps: { timeline },
  onProgress: ({ progress }) => {
    process.stdout.write(`\rProgress: ${Math.round(progress * 100)}%`)
  },
})

console.log(`\nDone! Output: ${outFile}`)
