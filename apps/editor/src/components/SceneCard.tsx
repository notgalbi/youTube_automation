import { ChevronUp, ChevronDown, Trash2, Image, Video } from 'lucide-react'
import type { Scene } from '../App'

interface Props {
  scene: Scene
  index: number
  isSelected: boolean
  onSelect: () => void
  onRemove: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onDurationChange: (frames: number) => void
}

export default function SceneCard({ scene, index, isSelected, onSelect, onRemove, onMoveUp, onMoveDown, onDurationChange }: Props) {
  const seconds = (scene.durationInFrames / 30).toFixed(1)

  return (
    <div
      onClick={onSelect}
      className={`rounded-lg border p-2 cursor-pointer transition-colors ${
        isSelected ? 'border-indigo-500 bg-indigo-500/10' : 'border-editor-border hover:border-gray-600'
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-gray-600 w-4 shrink-0">{index + 1}</span>
        <div className="w-8 h-8 bg-editor-bg rounded flex items-center justify-center shrink-0">
          {scene.type === 'video' ? (
            <Video className="w-4 h-4 text-indigo-400" />
          ) : (
            <Image className="w-4 h-4 text-emerald-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs truncate text-gray-300">{scene.filename}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <input
              type="number"
              min={15}
              max={9000}
              value={scene.durationInFrames}
              onClick={e => e.stopPropagation()}
              onChange={e => onDurationChange(Number(e.target.value))}
              className="w-14 text-[10px] bg-editor-bg border border-editor-border rounded px-1 py-0.5 text-gray-400"
            />
            <span className="text-[10px] text-gray-600">fr ({seconds}s)</span>
          </div>
        </div>
        <div className="flex flex-col gap-0.5">
          <button onClick={e => { e.stopPropagation(); onMoveUp() }} className="text-gray-600 hover:text-white p-0.5">
            <ChevronUp className="w-3 h-3" />
          </button>
          <button onClick={e => { e.stopPropagation(); onMoveDown() }} className="text-gray-600 hover:text-white p-0.5">
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>
        <button onClick={e => { e.stopPropagation(); onRemove() }} className="text-gray-600 hover:text-red-400 p-0.5">
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      {/* Transition selector */}
      <div className="mt-2 flex items-center gap-2 pl-6">
        <span className="text-[10px] text-gray-600">Transition:</span>
        <select
          className="text-[10px] bg-editor-bg border border-editor-border rounded px-1 py-0.5"
          value={scene.transition.type}
          onClick={e => e.stopPropagation()}
          onChange={e => onSelect()}
        >
          <option value="none">None</option>
          <option value="fade">Fade</option>
          <option value="slide">Slide</option>
        </select>
      </div>
    </div>
  )
}
