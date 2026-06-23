import { useState, useCallback } from 'react'
import { Toaster, toast } from 'react-hot-toast'
import Upload from './components/Upload'
import Timeline from './components/Timeline'
import SceneCard from './components/SceneCard'
import TextOverlayEditor from './components/TextOverlayEditor'
import CaptionEditor from './components/CaptionEditor'
import ExportHistory from './components/ExportHistory'
import ClaudeChat from './components/ClaudeChat'
import PreviewPanel from './components/PreviewPanel'
import { Film, History } from 'lucide-react'
import axios from 'axios'

export type AspectRatio = '9:16' | '16:9' | '1:1'

export interface TextOverlay {
  id: string
  text: string
  x: number
  y: number
  fontSize: number
  color: string
  startFrame: number
  durationInFrames: number
}

export interface Caption {
  id: string
  text: string
  startFrame: number
  durationInFrames: number
}

export interface Scene {
  id: string
  type: 'video' | 'image'
  src: string
  filename: string
  startFrame: number
  durationInFrames: number
  textOverlays: TextOverlay[]
  captions: Caption[]
  transition: { type: 'none' | 'fade' | 'slide'; durationInFrames: number }
}

export interface TimelineData {
  id: string
  title: string
  aspectRatio: AspectRatio
  fps: number
  scenes: Scene[]
  backgroundMusic: { src: string; volume: number } | null
}

const ASPECT_RATIOS: Record<AspectRatio, { width: number; height: number; label: string }> = {
  '9:16': { width: 1080, height: 1920, label: 'TikTok / Reels / Shorts' },
  '16:9': { width: 1920, height: 1080, label: 'YouTube' },
  '1:1': { width: 1080, height: 1080, label: 'Instagram' },
}

const defaultTimeline: TimelineData = {
  id: 'project-1',
  title: 'My Video',
  aspectRatio: '9:16',
  fps: 30,
  scenes: [],
  backgroundMusic: null,
}

type Tab = 'editor' | 'history'

export default function App() {
  const [timeline, setTimeline] = useState<TimelineData>(defaultTimeline)
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('editor')
  const [isRendering, setIsRendering] = useState(false)
  const [isPreviewing, setIsPreviewing] = useState(false)
  const [showJsonEditor, setShowJsonEditor] = useState(false)
  const [jsonText, setJsonText] = useState('')

  const selectedScene = timeline.scenes.find(s => s.id === selectedSceneId) ?? null

  const addScene = useCallback((src: string, filename: string, type: 'video' | 'image') => {
    const newScene: Scene = {
      id: `scene-${Date.now()}`,
      type,
      src,
      filename,
      startFrame: timeline.scenes.reduce((acc, s) => acc + s.durationInFrames, 0),
      durationInFrames: 150,
      textOverlays: [],
      captions: [],
      transition: { type: 'fade', durationInFrames: 15 },
    }
    setTimeline(prev => ({ ...prev, scenes: [...prev.scenes, newScene] }))
    setSelectedSceneId(newScene.id)
    toast.success(`Added ${filename}`)
  }, [timeline.scenes])

  const updateScene = useCallback((id: string, patch: Partial<Scene>) => {
    setTimeline(prev => ({
      ...prev,
      scenes: prev.scenes.map(s => s.id === id ? { ...s, ...patch } : s),
    }))
  }, [])

  const removeScene = useCallback((id: string) => {
    setTimeline(prev => ({ ...prev, scenes: prev.scenes.filter(s => s.id !== id) }))
    setSelectedSceneId(prev => prev === id ? null : prev)
  }, [])

  const moveScene = useCallback((id: string, dir: -1 | 1) => {
    setTimeline(prev => {
      const scenes = [...prev.scenes]
      const idx = scenes.findIndex(s => s.id === id)
      const newIdx = idx + dir
      if (newIdx < 0 || newIdx >= scenes.length) return prev
      ;[scenes[idx], scenes[newIdx]] = [scenes[newIdx], scenes[idx]]
      return { ...prev, scenes }
    })
  }, [])

  const handlePreview = async () => {
    if (timeline.scenes.length === 0) {
      toast.error('Add at least one scene first')
      return
    }
    setIsPreviewing(true)
    try {
      await axios.post('/api/preview', { timeline })
      toast.success('Opening Remotion Studio preview...')
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Preview failed')
    } finally {
      setIsPreviewing(false)
    }
  }

  const handleRender = async () => {
    if (timeline.scenes.length === 0) {
      toast.error('Add at least one scene first')
      return
    }
    setIsRendering(true)
    const toastId = toast.loading('Rendering video... this may take a minute')
    try {
      const res = await axios.post('/api/render', { timeline })
      toast.success(`Exported: ${res.data.outputFile}`, { id: toastId })
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Render failed', { id: toastId })
    } finally {
      setIsRendering(false)
    }
  }

  const openJsonEditor = () => {
    setJsonText(JSON.stringify(timeline, null, 2))
    setShowJsonEditor(true)
  }

  const applyJsonEdit = () => {
    try {
      const parsed = JSON.parse(jsonText)
      setTimeline(parsed)
      setShowJsonEditor(false)
      toast.success('Timeline updated')
    } catch {
      toast.error('Invalid JSON')
    }
  }

  const totalFrames = timeline.scenes.reduce((acc, s) => acc + s.durationInFrames, 0)
  const totalSeconds = (totalFrames / timeline.fps).toFixed(1)

  return (
    <div className="flex flex-col h-screen bg-editor-bg text-white overflow-hidden">
      <Toaster position="top-right" toastOptions={{ style: { background: '#1a1a1a', color: '#fff', border: '1px solid #2a2a2a' } }} />

      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 bg-editor-panel border-b border-editor-border shrink-0">
        <div className="flex items-center gap-2">
          <Film className="w-5 h-5 text-indigo-400" />
          <span className="font-semibold text-sm">AI Video Editor</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            className="bg-transparent text-sm text-center border-b border-transparent hover:border-editor-border focus:border-indigo-500 outline-none px-1 w-40"
            value={timeline.title}
            onChange={e => setTimeline(prev => ({ ...prev, title: e.target.value }))}
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            className="bg-editor-hover text-xs rounded px-2 py-1 border border-editor-border"
            value={timeline.aspectRatio}
            onChange={e => setTimeline(prev => ({ ...prev, aspectRatio: e.target.value as AspectRatio }))}
          >
            {(Object.entries(ASPECT_RATIOS) as [AspectRatio, { label: string }][]).map(([key, val]) => (
              <option key={key} value={key}>{key} — {val.label}</option>
            ))}
          </select>
          <span className="text-xs text-gray-500">{totalSeconds}s</span>
          <button
            onClick={openJsonEditor}
            className="text-xs px-2 py-1 rounded bg-editor-hover border border-editor-border hover:border-indigo-500"
          >
            JSON
          </button>
          <button
            onClick={handlePreview}
            disabled={isPreviewing}
            className="text-xs px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50"
          >
            {isPreviewing ? 'Opening...' : 'Preview'}
          </button>
          <button
            onClick={handleRender}
            disabled={isRendering}
            className="text-xs px-3 py-1 rounded bg-green-700 hover:bg-green-600 disabled:opacity-50 font-medium"
          >
            {isRendering ? 'Rendering...' : 'Render MP4'}
          </button>
        </div>
      </header>

      {/* Tab bar */}
      <div className="flex border-b border-editor-border bg-editor-panel shrink-0">
        {(['editor', 'history'] as Tab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 text-xs capitalize border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab === 'history' ? <span className="flex items-center gap-1"><History className="w-3 h-3" />History</span> : tab}
          </button>
        ))}
      </div>

      {activeTab === 'history' ? (
        <ExportHistory />
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {/* Left panel: upload + scene list */}
          <aside className="w-72 shrink-0 border-r border-editor-border flex flex-col bg-editor-panel">
            <Upload onFileAdded={addScene} />
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {timeline.scenes.length === 0 && (
                <p className="text-xs text-gray-600 text-center mt-8">Upload media to get started</p>
              )}
              {timeline.scenes.map((scene, idx) => (
                <SceneCard
                  key={scene.id}
                  scene={scene}
                  index={idx}
                  isSelected={scene.id === selectedSceneId}
                  onSelect={() => setSelectedSceneId(scene.id)}
                  onRemove={() => removeScene(scene.id)}
                  onMoveUp={() => moveScene(scene.id, -1)}
                  onMoveDown={() => moveScene(scene.id, 1)}
                  onDurationChange={d => updateScene(scene.id, { durationInFrames: d })}
                  onTransitionChange={t => updateScene(scene.id, { transition: { ...scene.transition, type: t } })}
                />
              ))}
            </div>
          </aside>

          {/* Center-left: timeline + overlay/caption editors */}
          <main className="flex flex-col overflow-hidden min-w-0" style={{ width: 380, minWidth: 320 }}>
            <Timeline timeline={timeline} selectedSceneId={selectedSceneId} onSelectScene={setSelectedSceneId} />

            {selectedScene ? (
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                <TextOverlayEditor
                  scene={selectedScene}
                  fps={timeline.fps}
                  onChange={patch => updateScene(selectedScene.id, patch)}
                />
                <CaptionEditor
                  scene={selectedScene}
                  fps={timeline.fps}
                  onChange={patch => updateScene(selectedScene.id, patch)}
                />
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-600 text-sm">
                Select a scene to edit overlays and captions
              </div>
            )}
          </main>

          {/* Center-right: preview panel */}
          <div className="flex-1 border-l border-editor-border overflow-hidden min-w-0">
            <PreviewPanel
              timeline={timeline}
              selectedSceneId={selectedSceneId}
              onSelectScene={setSelectedSceneId}
            />
          </div>

          {/* Right panel: Claude AI chat */}
          <ClaudeChat timeline={timeline} onTimelineUpdate={setTimeline} />
        </div>
      )}

      {/* JSON editor modal */}
      {showJsonEditor && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-8">
          <div className="bg-editor-panel border border-editor-border rounded-lg w-full max-w-3xl flex flex-col gap-3 p-4 max-h-[80vh]">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Timeline JSON</span>
              <button onClick={() => setShowJsonEditor(false)} className="text-gray-500 hover:text-white text-xs">✕ Close</button>
            </div>
            <textarea
              className="flex-1 bg-black/50 text-xs font-mono text-green-400 p-3 rounded border border-editor-border outline-none resize-none min-h-[50vh]"
              value={jsonText}
              onChange={e => setJsonText(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowJsonEditor(false)} className="text-xs px-3 py-1.5 rounded border border-editor-border hover:bg-editor-hover">Cancel</button>
              <button onClick={applyJsonEdit} className="text-xs px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500">Apply</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
