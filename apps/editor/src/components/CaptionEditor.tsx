import { Plus, Trash2 } from 'lucide-react'
import type { Caption, Scene } from '../App'

interface Props {
  scene: Scene
  fps: number
  onChange: (patch: Partial<Scene>) => void
}

export default function CaptionEditor({ scene, fps, onChange }: Props) {
  const addCaption = () => {
    const lastEnd = scene.captions.reduce((acc, c) => Math.max(acc, c.startFrame + c.durationInFrames), 0)
    const caption: Caption = {
      id: `caption-${Date.now()}`,
      text: 'Caption text',
      startFrame: lastEnd,
      durationInFrames: 60,
    }
    onChange({ captions: [...scene.captions, caption] })
  }

  const update = (id: string, patch: Partial<Caption>) => {
    onChange({ captions: scene.captions.map(c => c.id === id ? { ...c, ...patch } : c) })
  }

  const remove = (id: string) => {
    onChange({ captions: scene.captions.filter(c => c.id !== id) })
  }

  return (
    <div className="bg-editor-panel border border-editor-border rounded-lg p-3">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium">Captions</span>
        <button onClick={addCaption} className="text-xs flex items-center gap-1 text-indigo-400 hover:text-indigo-300">
          <Plus className="w-3 h-3" /> Add
        </button>
      </div>

      <div className="space-y-2">
        {scene.captions.length === 0 && (
          <p className="text-xs text-gray-600 text-center py-4">No captions</p>
        )}
        {scene.captions.map((cap, idx) => (
          <div key={cap.id} className="border border-editor-border rounded p-2 space-y-2">
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-gray-600 shrink-0">{idx + 1}.</span>
              <input
                className="flex-1 bg-editor-bg text-xs px-2 py-1 rounded border border-editor-border outline-none focus:border-indigo-500"
                value={cap.text}
                onChange={e => update(cap.id, { text: e.target.value })}
                placeholder="Caption text"
              />
              <button onClick={() => remove(cap.id)} className="text-gray-600 hover:text-red-400 shrink-0">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-[10px] text-gray-500 flex flex-col gap-1">
                Start (frames)
                <input
                  type="number"
                  min={0}
                  max={scene.durationInFrames}
                  value={cap.startFrame}
                  onChange={e => update(cap.id, { startFrame: Number(e.target.value) })}
                  className="bg-editor-bg text-xs px-2 py-1 rounded border border-editor-border outline-none"
                />
              </label>
              <label className="text-[10px] text-gray-500 flex flex-col gap-1">
                Duration (frames)
                <input
                  type="number"
                  min={1}
                  max={scene.durationInFrames}
                  value={cap.durationInFrames}
                  onChange={e => update(cap.id, { durationInFrames: Number(e.target.value) })}
                  className="bg-editor-bg text-xs px-2 py-1 rounded border border-editor-border outline-none"
                />
              </label>
            </div>
            <p className="text-[10px] text-gray-600">
              {(cap.startFrame / fps).toFixed(1)}s — {((cap.startFrame + cap.durationInFrames) / fps).toFixed(1)}s
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
