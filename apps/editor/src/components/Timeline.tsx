import type { TimelineData } from '../App'

interface Props {
  timeline: TimelineData
  selectedSceneId: string | null
  onSelectScene: (id: string) => void
}

const TRACK_HEIGHT = 48
const PX_PER_FRAME = 0.5

export default function Timeline({ timeline, selectedSceneId, onSelectScene }: Props) {
  const totalFrames = timeline.scenes.reduce((acc, s) => acc + s.durationInFrames, 0)
  const totalWidth = Math.max(totalFrames * PX_PER_FRAME, 400)

  return (
    <div className="border-b border-editor-border bg-black/30 shrink-0">
      <div className="flex items-center px-3 py-1 border-b border-editor-border">
        <span className="text-[10px] text-gray-500 uppercase tracking-wider">Timeline</span>
        <span className="ml-auto text-[10px] text-gray-600">
          {timeline.scenes.length} scene{timeline.scenes.length !== 1 ? 's' : ''} · {(totalFrames / timeline.fps).toFixed(1)}s total
        </span>
      </div>
      <div className="overflow-x-auto" style={{ height: `${TRACK_HEIGHT + 24}px` }}>
        <div className="relative" style={{ width: `${totalWidth + 40}px`, height: '100%' }}>
          {/* Ruler */}
          <div className="absolute top-0 left-0 right-0 h-6 flex" style={{ width: `${totalWidth + 40}px` }}>
            {Array.from({ length: Math.ceil(totalFrames / timeline.fps) + 1 }).map((_, i) => (
              <div
                key={i}
                className="absolute border-l border-gray-700 text-[9px] text-gray-600 pl-0.5"
                style={{ left: `${i * timeline.fps * PX_PER_FRAME}px`, top: 0, height: '100%' }}
              >
                {i}s
              </div>
            ))}
          </div>

          {/* Track */}
          <div className="absolute top-6 left-0" style={{ height: `${TRACK_HEIGHT}px` }}>
            {timeline.scenes.map(scene => {
              const left = scene.startFrame * PX_PER_FRAME
              const width = scene.durationInFrames * PX_PER_FRAME
              const isSelected = scene.id === selectedSceneId

              return (
                <div
                  key={scene.id}
                  onClick={() => onSelectScene(scene.id)}
                  className={`absolute top-1 bottom-1 rounded cursor-pointer border transition-colors flex items-center px-2 ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-500/30'
                      : 'border-gray-700 bg-gray-800 hover:border-gray-500'
                  }`}
                  style={{ left: `${left}px`, width: `${Math.max(width, 20)}px` }}
                  title={scene.filename}
                >
                  <span className="text-[9px] text-gray-300 truncate">{scene.filename}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
