import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import type { Scene, TextOverlay } from '../App'

interface Props {
  scene: Scene
  fps: number
  onChange: (patch: Partial<Scene>) => void
}

export default function TextOverlayEditor({ scene, fps, onChange }: Props) {
  const [editing, setEditing] = useState<string | null>(null)

  const addOverlay = () => {
    const overlay: TextOverlay = {
      id: `overlay-${Date.now()}`,
      text: 'New Text',
      x: 50,
      y: 80,
      fontSize: 48,
      color: '#ffffff',
      startFrame: 0,
      durationInFrames: Math.min(90, scene.durationInFrames),
    }
    onChange({ textOverlays: [...scene.textOverlays, overlay] })
    setEditing(overlay.id)
  }

  const updateOverlay = (id: string, patch: Partial<TextOverlay>) => {
    onChange({
      textOverlays: scene.textOverlays.map(o => o.id === id ? { ...o, ...patch } : o),
    })
  }

  const removeOverlay = (id: string) => {
    onChange({ textOverlays: scene.textOverlays.filter(o => o.id !== id) })
    if (editing === id) setEditing(null)
  }

  return (
    <div className="bg-editor-panel border border-editor-border rounded-lg p-3">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium">Text Overlays</span>
        <button onClick={addOverlay} className="text-xs flex items-center gap-1 text-indigo-400 hover:text-indigo-300">
          <Plus className="w-3 h-3" /> Add
        </button>
      </div>

      <div className="space-y-2">
        {scene.textOverlays.length === 0 && (
          <p className="text-xs text-gray-600 text-center py-4">No text overlays</p>
        )}
        {scene.textOverlays.map(overlay => (
          <div key={overlay.id} className="border border-editor-border rounded p-2 space-y-2">
            <div className="flex items-center gap-2">
              <input
                className="flex-1 bg-editor-bg text-xs px-2 py-1 rounded border border-editor-border outline-none focus:border-indigo-500"
                value={overlay.text}
                onChange={e => updateOverlay(overlay.id, { text: e.target.value })}
                placeholder="Text content"
              />
              <button onClick={() => removeOverlay(overlay.id)} className="text-gray-600 hover:text-red-400">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
            {editing === overlay.id && (
              <div className="grid grid-cols-2 gap-2">
                <label className="text-[10px] text-gray-500 flex flex-col gap-1">
                  X (%)
                  <input type="number" min={0} max={100} value={overlay.x} onChange={e => updateOverlay(overlay.id, { x: Number(e.target.value) })} className="bg-editor-bg text-xs px-2 py-1 rounded border border-editor-border outline-none" />
                </label>
                <label className="text-[10px] text-gray-500 flex flex-col gap-1">
                  Y (%)
                  <input type="number" min={0} max={100} value={overlay.y} onChange={e => updateOverlay(overlay.id, { y: Number(e.target.value) })} className="bg-editor-bg text-xs px-2 py-1 rounded border border-editor-border outline-none" />
                </label>
                <label className="text-[10px] text-gray-500 flex flex-col gap-1">
                  Font size
                  <input type="number" min={12} max={200} value={overlay.fontSize} onChange={e => updateOverlay(overlay.id, { fontSize: Number(e.target.value) })} className="bg-editor-bg text-xs px-2 py-1 rounded border border-editor-border outline-none" />
                </label>
                <label className="text-[10px] text-gray-500 flex flex-col gap-1">
                  Color
                  <input type="color" value={overlay.color} onChange={e => updateOverlay(overlay.id, { color: e.target.value })} className="w-full h-7 bg-editor-bg rounded border border-editor-border cursor-pointer" />
                </label>
                <label className="text-[10px] text-gray-500 flex flex-col gap-1">
                  Start (frames)
                  <input type="number" min={0} max={scene.durationInFrames} value={overlay.startFrame} onChange={e => updateOverlay(overlay.id, { startFrame: Number(e.target.value) })} className="bg-editor-bg text-xs px-2 py-1 rounded border border-editor-border outline-none" />
                </label>
                <label className="text-[10px] text-gray-500 flex flex-col gap-1">
                  Duration (frames)
                  <input type="number" min={1} max={scene.durationInFrames} value={overlay.durationInFrames} onChange={e => updateOverlay(overlay.id, { durationInFrames: Number(e.target.value) })} className="bg-editor-bg text-xs px-2 py-1 rounded border border-editor-border outline-none" />
                </label>
              </div>
            )}
            <button onClick={() => setEditing(editing === overlay.id ? null : overlay.id)} className="text-[10px] text-gray-500 hover:text-indigo-400">
              {editing === overlay.id ? 'Collapse' : 'Edit details'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
