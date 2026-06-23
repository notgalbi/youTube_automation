import { useEffect, useState } from 'react'
import axios from 'axios'
import { Download, Film } from 'lucide-react'

interface ExportEntry {
  filename: string
  size: number
  createdAt: string
  path: string
}

export default function ExportHistory() {
  const [exports, setExports] = useState<ExportEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get('/api/exports')
      .then(r => setExports(r.data.exports))
      .catch(() => setExports([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex-1 flex items-center justify-center text-gray-600 text-sm">Loading...</div>

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <h2 className="text-sm font-medium mb-4">Export History</h2>
      {exports.length === 0 && (
        <p className="text-sm text-gray-600">No exports yet. Render a video to get started.</p>
      )}
      <div className="grid grid-cols-1 gap-3 max-w-xl">
        {exports.map(exp => (
          <div key={exp.filename} className="flex items-center gap-3 bg-editor-panel border border-editor-border rounded-lg p-3">
            <Film className="w-8 h-8 text-indigo-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate">{exp.filename}</p>
              <p className="text-xs text-gray-500">
                {(exp.size / 1024 / 1024).toFixed(1)} MB · {new Date(exp.createdAt).toLocaleString()}
              </p>
            </div>
            <a
              href={`/exports/${exp.filename}`}
              download={exp.filename}
              className="text-xs flex items-center gap-1 px-2 py-1 rounded bg-editor-hover border border-editor-border hover:border-indigo-500 text-gray-400 hover:text-white"
            >
              <Download className="w-3 h-3" /> Download
            </a>
          </div>
        ))}
      </div>
    </div>
  )
}
