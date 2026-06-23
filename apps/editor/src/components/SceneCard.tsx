import { useRef, useState } from 'react'
import { ChevronUp, ChevronDown, Trash2 } from 'lucide-react'
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
  onTransitionChange: (type: 'none' | 'fade' | 'slide') => void
}

export default function SceneCard({ scene, index, isSelected, onSelect, onRemove, onMoveUp, onMoveDown, onDurationChange, onTransitionChange }: Props) {
  const seconds = (scene.durationInFrames / 30).toFixed(1)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [thumbLoaded, setThumbLoaded] = useState(false)

  const handleMouseEnter = () => {
    if (scene.type === 'video' && videoRef.current) {
      videoRef.current.play().catch(() => {})
    }
  }

  const handleMouseLeave = () => {
    if (scene.type === 'video' && videoRef.current) {
      videoRef.current.pause()
      videoRef.current.currentTime = 0
    }
  }

  return (
    <div
      onClick={onSelect}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`rounded-lg border cursor-pointer transition-colors overflow-hidden ${
        isSelected ? 'border-indigo-500 bg-indigo-500/10' : 'border-editor-border hover:border-gray-600'
      }`}
    >
      {/* Thumbnail / preview area */}
      <div className="relative w-full bg-black" style={{ aspectRatio: '16/9' }}>
        {scene.type === 'video' ? (
          <video
            ref={videoRef}
            src={scene.src}
            muted
            playsInline
            loop
            preload="metadata"
            className="w-full h-full object-cover"
            onLoadedData={() => setThumbLoaded(true)}
          />
        ) : (
          <img
            src={scene.src}
            alt={scene.filename}
            className="w-full h-full object-cover"
            onLoad={() => setThumbLoaded(true)}
          />
        )}
        {/* Dim overlay when not loaded */}
        {!thumbLoaded && (
          <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
            <span className="text-[10px] text-gray-600">Loading...</span>
          </div>
        )}
        {/* Scene number badge */}
        <div className="absolute top-1 left-1 bg-black/60 rounded px-1 text-[10px] text-white font-mono">
          {index + 1}
        </div>
        {/* Duration badge */}
        <div className="absolute bottom-1 right-1 bg-black/70 rounded px-1 text-[9px] text-gray-300 font-mono">
          {seconds}s
        </div>
        {/* Type badge */}
        <div className={`absolute top-1 right-1 rounded px-1 text-[9px] font-medium ${
          scene.type === 'video' ? 'bg-indigo-600/80 text-white' : 'bg-emerald-700/80 text-white'
        }`}>
          {scene.type === 'video' ? 'VID' : 'IMG'}
        </div>
      </div>

      {/* Info row */}
      <div className="px-2 py-1.5">
        <div className="flex items-center gap-1">
          <p className="flex-1 text-[11px] truncate text-gray-300">{scene.filename}</p>
          <button onClick={e => { e.stopPropagation(); onMoveUp() }} className="text-gray-600 hover:text-white p-0.5">
            <ChevronUp className="w-3 h-3" />
          </button>
          <button onClick={e => { e.stopPropagation(); onMoveDown() }} className="text-gray-600 hover:text-white p-0.5">
            <ChevronDown className="w-3 h-3" />
          </button>
          <button onClick={e => { e.stopPropagation(); onRemove() }} className="text-gray-600 hover:text-red-400 p-0.5">
            <Trash2 className="w-3 h-3" />
          </button>
        </div>

        {/* Duration + transition controls */}
        <div className="flex items-center gap-2 mt-1">
          <div className="flex items-center gap-1">
            <input
              type="number"
              min={15}
              max={9000}
              value={scene.durationInFrames}
              onClick={e => e.stopPropagation()}
              onChange={e => onDurationChange(Number(e.target.value))}
              className="w-14 text-[10px] bg-editor-bg border border-editor-border rounded px-1 py-0.5 text-gray-400"
            />
            <span className="text-[10px] text-gray-600">fr</span>
          </div>
          <select
            className="flex-1 text-[10px] bg-editor-bg border border-editor-border rounded px-1 py-0.5 text-gray-400"
            value={scene.transition.type}
            onClick={e => e.stopPropagation()}
            onChange={e => { e.stopPropagation(); onTransitionChange(e.target.value as 'none' | 'fade' | 'slide') }}
          >
            <option value="none">No transition</option>
            <option value="fade">Fade</option>
            <option value="slide">Slide</option>
          </select>
        </div>
      </div>
    </div>
  )
}
