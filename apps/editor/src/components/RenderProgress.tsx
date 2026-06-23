import { useEffect, useState, useRef } from 'react'
import axios from 'axios'
import { X, Film, CheckCircle, AlertCircle } from 'lucide-react'

interface RenderState {
  running: boolean
  progress: number
  frame: number
  totalFrames: number
  stage: string
  outputFile: string
  error: string
  done: boolean
}

interface Props {
  onDismiss: () => void
  onComplete: (outputFile: string) => void
}

export default function RenderProgress({ onDismiss, onComplete }: Props) {
  const [state, setState] = useState<RenderState>({
    running: true,
    progress: 0,
    frame: 0,
    totalFrames: 0,
    stage: 'Starting render...',
    outputFile: '',
    error: '',
    done: false,
  })
  const notifiedRef = useRef(false)

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await axios.get<RenderState>('/api/render/status')
        setState(res.data)
        if (res.data.done && !notifiedRef.current) {
          notifiedRef.current = true
          if (!res.data.error) onComplete(res.data.outputFile)
        }
      } catch {}
    }

    poll()
    const id = setInterval(poll, 400)
    return () => clearInterval(id)
  }, [onComplete])

  const isError = !!state.error
  const isDone = state.done && !isError

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center pb-8 px-4 pointer-events-none">
      <div className="pointer-events-auto w-full max-w-lg bg-editor-panel border border-editor-border rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className={`flex items-center gap-3 px-4 py-3 ${isDone ? 'bg-green-900/30' : isError ? 'bg-red-900/30' : 'bg-indigo-900/20'}`}>
          {isDone
            ? <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
            : isError
            ? <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            : <Film className="w-5 h-5 text-indigo-400 shrink-0 animate-pulse" />
          }
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">
              {isDone ? 'Render complete!' : isError ? 'Render failed' : 'Rendering video...'}
            </p>
            <p className="text-xs text-gray-400 truncate">
              {isError ? state.error : state.stage || 'Initializing...'}
            </p>
          </div>
          {(isDone || isError) && (
            <button onClick={onDismiss} className="text-gray-500 hover:text-white p-1">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Progress bar */}
        <div className="px-4 py-3 space-y-2">
          <div className="w-full bg-gray-800 rounded-full overflow-hidden" style={{ height: 8 }}>
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isDone ? 'bg-green-500' : isError ? 'bg-red-500' : 'bg-indigo-500'
              }`}
              style={{ width: `${state.progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 font-mono">
              {state.totalFrames > 0
                ? `Frame ${state.frame} / ${state.totalFrames}`
                : isDone ? 'Done' : 'Preparing...'}
            </span>
            <span className={`text-sm font-bold font-mono ${
              isDone ? 'text-green-400' : isError ? 'text-red-400' : 'text-indigo-400'
            }`}>
              {state.progress}%
            </span>
          </div>

          {isDone && state.outputFile && (
            <div className="flex items-center gap-2 pt-1">
              <a
                href={`/exports/${state.outputFile}`}
                download={state.outputFile}
                className="flex-1 text-center text-xs px-3 py-1.5 rounded bg-green-700 hover:bg-green-600 text-white font-medium"
              >
                Download {state.outputFile}
              </a>
              <button onClick={onDismiss} className="text-xs px-3 py-1.5 rounded border border-editor-border hover:bg-editor-hover text-gray-400">
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
