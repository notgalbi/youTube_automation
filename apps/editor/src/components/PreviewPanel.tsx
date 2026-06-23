import { useRef, useState, useEffect, useCallback } from 'react'
import { Play, Pause, SkipBack, SkipForward, ChevronLeft, ChevronRight } from 'lucide-react'
import type { TimelineData, Scene, TextOverlay, Caption } from '../App'

interface Props {
  timeline: TimelineData
  selectedSceneId: string | null
  onSelectScene: (id: string) => void
}

const ASPECT_RATIOS: Record<string, { w: number; h: number }> = {
  '9:16': { w: 9, h: 16 },
  '16:9': { w: 16, h: 9 },
  '1:1':  { w: 1, h: 1 },
}

function getActiveScene(timeline: TimelineData, globalFrame: number): { scene: Scene; localFrame: number } | null {
  let elapsed = 0
  for (const scene of timeline.scenes) {
    if (globalFrame >= elapsed && globalFrame < elapsed + scene.durationInFrames) {
      return { scene, localFrame: globalFrame - elapsed }
    }
    elapsed += scene.durationInFrames
  }
  return null
}

function getSceneStart(timeline: TimelineData, sceneId: string): number {
  let elapsed = 0
  for (const scene of timeline.scenes) {
    if (scene.id === sceneId) return elapsed
    elapsed += scene.durationInFrames
  }
  return 0
}

export default function PreviewPanel({ timeline, selectedSceneId, onSelectScene }: Props) {
  const totalFrames = timeline.scenes.reduce((acc, s) => acc + s.durationInFrames, 0)
  const fps = timeline.fps

  const [globalFrame, setGlobalFrame] = useState(0)
  const [playing, setPlaying] = useState(false)
  const rafRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerSize, setContainerSize] = useState({ w: 400, h: 300 })

  const ar = ASPECT_RATIOS[timeline.aspectRatio] ?? ASPECT_RATIOS['9:16']

  // Measure container width and compute preview dimensions
  useEffect(() => {
    const obs = new ResizeObserver(entries => {
      const entry = entries[0]
      if (!entry) return
      const w = entry.contentRect.width
      const h = (w * ar.h) / ar.w
      setContainerSize({ w, h })
    })
    if (containerRef.current) obs.observe(containerRef.current)
    return () => obs.disconnect()
  }, [ar])

  // RAF loop for playback
  useEffect(() => {
    if (!playing) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      lastTimeRef.current = null
      return
    }

    const tick = (now: number) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = now
      }
      const elapsed = now - lastTimeRef.current
      lastTimeRef.current = now

      setGlobalFrame(prev => {
        const next = prev + (elapsed / 1000) * fps
        if (next >= totalFrames) {
          setPlaying(false)
          return totalFrames - 1
        }
        return next
      })
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [playing, fps, totalFrames])

  // Sync video element to current frame
  const active = getActiveScene(timeline, Math.floor(globalFrame))

  useEffect(() => {
    const vid = videoRef.current
    if (!vid || !active || active.scene.type !== 'video') return
    const targetTime = active.localFrame / fps
    if (Math.abs(vid.currentTime - targetTime) > 0.15) {
      vid.currentTime = targetTime
    }
  }, [active, fps])

  useEffect(() => {
    const vid = videoRef.current
    if (!vid || !active || active.scene.type !== 'video') return
    if (playing) vid.play().catch(() => {})
    else vid.pause()
  }, [playing, active?.scene.id])

  // Jump to selected scene when it changes externally
  useEffect(() => {
    if (!selectedSceneId) return
    const start = getSceneStart(timeline, selectedSceneId)
    setGlobalFrame(start)
    setPlaying(false)
  }, [selectedSceneId])

  const currentFrame = Math.floor(globalFrame)
  const currentTime = (globalFrame / fps).toFixed(1)
  const totalTime = (totalFrames / fps).toFixed(1)

  const seek = (f: number) => {
    const clamped = Math.max(0, Math.min(f, totalFrames - 1))
    setGlobalFrame(clamped)
    if (active) {
      const scene = getActiveScene(timeline, Math.floor(clamped))
      if (scene) onSelectScene(scene.scene.id)
    }
  }

  const togglePlay = () => {
    if (totalFrames === 0) return
    if (globalFrame >= totalFrames - 1) setGlobalFrame(0)
    setPlaying(p => !p)
  }

  const prevScene = () => {
    if (!active) return
    const idx = timeline.scenes.findIndex(s => s.id === active.scene.id)
    if (idx > 0) {
      const prev = timeline.scenes[idx - 1]
      onSelectScene(prev.id)
      seek(getSceneStart(timeline, prev.id))
    }
  }

  const nextScene = () => {
    if (!active) return
    const idx = timeline.scenes.findIndex(s => s.id === active.scene.id)
    if (idx < timeline.scenes.length - 1) {
      const next = timeline.scenes[idx + 1]
      onSelectScene(next.id)
      seek(getSceneStart(timeline, next.id))
    }
  }

  const sceneIdx = active ? timeline.scenes.findIndex(s => s.id === active.scene.id) : -1

  // Overlay/caption visibility
  const visibleOverlays = active
    ? active.scene.textOverlays.filter(o =>
        active.localFrame >= o.startFrame && active.localFrame < o.startFrame + o.durationInFrames
      )
    : []

  const activeCaption = active
    ? active.scene.captions.find(c =>
        active.localFrame >= c.startFrame && active.localFrame < c.startFrame + c.durationInFrames
      )
    : null

  const previewH = containerSize.w > 0
    ? Math.min((containerSize.w * ar.h) / ar.w, 600)
    : 400
  const previewW = (previewH * ar.w) / ar.h

  return (
    <div className="flex flex-col h-full bg-black/20">
      {/* Preview viewport */}
      <div className="flex-1 flex items-center justify-center overflow-hidden p-3" ref={containerRef}>
        {totalFrames === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 text-gray-600">
            <div className="w-16 h-16 rounded-full border-2 border-gray-700 flex items-center justify-center">
              <Play className="w-6 h-6 ml-1" />
            </div>
            <p className="text-xs">Add scenes to preview</p>
          </div>
        ) : (
          <div
            className="relative overflow-hidden rounded-lg shadow-2xl bg-black"
            style={{ width: previewW, height: previewH, maxWidth: '100%' }}
          >
            {active && active.scene.type === 'video' && (
              <video
                key={active.scene.id}
                ref={videoRef}
                src={active.scene.src}
                muted
                playsInline
                preload="auto"
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
            {active && active.scene.type === 'image' && (
              <img
                key={active.scene.id}
                src={active.scene.src}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}

            {/* Text overlays */}
            {visibleOverlays.map(overlay => {
              const rel = active!.localFrame - overlay.startFrame
              const fadeLen = 10
              const opacity =
                rel < fadeLen
                  ? rel / fadeLen
                  : rel > overlay.durationInFrames - fadeLen
                  ? (overlay.durationInFrames - rel) / fadeLen
                  : 1
              return (
                <div
                  key={overlay.id}
                  className="absolute pointer-events-none"
                  style={{
                    left: `${overlay.x}%`,
                    top: `${overlay.y}%`,
                    transform: 'translate(-50%, -50%)',
                    fontSize: `${(overlay.fontSize / 1920) * previewW * 1.5}px`,
                    color: overlay.color,
                    fontWeight: 'bold',
                    textAlign: 'center',
                    opacity,
                    textShadow: '2px 2px 8px rgba(0,0,0,0.8)',
                    whiteSpace: 'pre-wrap',
                    maxWidth: '80%',
                    lineHeight: 1.2,
                    fontFamily: 'system-ui, sans-serif',
                  }}
                >
                  {overlay.text}
                </div>
              )
            })}

            {/* Caption */}
            {activeCaption && (
              <div className="absolute bottom-[8%] left-0 right-0 flex justify-center pointer-events-none px-4">
                <div
                  className="rounded px-3 py-1.5 text-white text-center"
                  style={{
                    backgroundColor: 'rgba(0,0,0,0.75)',
                    fontSize: `${(38 / 1920) * previewW * 1.5}px`,
                    fontWeight: 600,
                    lineHeight: 1.4,
                    fontFamily: 'system-ui, sans-serif',
                  }}
                >
                  {activeCaption.text}
                </div>
              </div>
            )}

            {/* Scene transition indicator */}
            {active && active.scene.transition.type === 'fade' && active.localFrame < active.scene.transition.durationInFrames && (
              <div
                className="absolute inset-0 bg-black pointer-events-none"
                style={{ opacity: 1 - active.localFrame / active.scene.transition.durationInFrames }}
              />
            )}

            {/* Corner: scene info */}
            <div className="absolute top-2 left-2 flex gap-1">
              <span className="text-[10px] bg-black/60 text-white rounded px-1.5 py-0.5 font-mono">
                Scene {sceneIdx + 1}/{timeline.scenes.length}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Playback controls */}
      <div className="shrink-0 border-t border-editor-border bg-editor-panel px-3 py-2 space-y-2">
        {/* Scrubber */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-500 font-mono w-10 shrink-0">{currentTime}s</span>
          <input
            type="range"
            min={0}
            max={Math.max(totalFrames - 1, 0)}
            step={1}
            value={Math.floor(globalFrame)}
            onChange={e => { setPlaying(false); seek(Number(e.target.value)) }}
            className="flex-1 accent-indigo-500 cursor-pointer"
            style={{ height: 4 }}
          />
          <span className="text-[10px] text-gray-500 font-mono w-10 shrink-0 text-right">{totalTime}s</span>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={prevScene}
            disabled={sceneIdx <= 0}
            className="p-1.5 rounded hover:bg-editor-hover disabled:opacity-30 text-gray-400 hover:text-white"
            title="Previous scene"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={() => seek(0)}
            className="p-1.5 rounded hover:bg-editor-hover text-gray-400 hover:text-white"
            title="Go to start"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            onClick={togglePlay}
            disabled={totalFrames === 0}
            className="w-9 h-9 rounded-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 flex items-center justify-center"
          >
            {playing
              ? <Pause className="w-4 h-4" />
              : <Play className="w-4 h-4 ml-0.5" />
            }
          </button>

          <button
            onClick={() => seek(totalFrames - 1)}
            className="p-1.5 rounded hover:bg-editor-hover text-gray-400 hover:text-white"
            title="Go to end"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          <button
            onClick={nextScene}
            disabled={sceneIdx >= timeline.scenes.length - 1}
            className="p-1.5 rounded hover:bg-editor-hover disabled:opacity-30 text-gray-400 hover:text-white"
            title="Next scene"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Frame counter */}
        <div className="flex items-center justify-center gap-4 text-[10px] text-gray-600 font-mono">
          <span>Frame {currentFrame} / {totalFrames}</span>
          {active && <span className="truncate max-w-[120px]">{active.scene.filename}</span>}
        </div>
      </div>
    </div>
  )
}
