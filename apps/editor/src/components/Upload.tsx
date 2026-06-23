import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import { UploadCloud } from 'lucide-react'

interface Props {
  onFileAdded: (src: string, filename: string, type: 'video' | 'image') => void
}

const ACCEPTED = {
  'video/*': ['.mp4', '.mov', '.webm', '.avi'],
  'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  'audio/*': ['.mp3', '.wav', '.aac', '.m4a'],
}

export default function Upload({ onFileAdded }: Props) {
  const onDrop = useCallback(async (files: File[]) => {
    for (const file of files) {
      const isAudio = file.type.startsWith('audio/')
      const formData = new FormData()
      formData.append('file', file)
      const toastId = toast.loading(`Uploading ${file.name}...`)
      try {
        const res = await axios.post('/api/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        const { path } = res.data
        if (!isAudio) {
          const type = file.type.startsWith('video/') ? 'video' : 'image'
          onFileAdded(path, file.name, type)
        }
        toast.success(`Uploaded ${file.name}`, { id: toastId })
      } catch (err: any) {
        toast.error(err?.response?.data?.error || `Failed to upload ${file.name}`, { id: toastId })
      }
    }
  }, [onFileAdded])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED,
  })

  return (
    <div className="p-2 border-b border-editor-border">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-indigo-500 bg-indigo-500/10' : 'border-editor-border hover:border-indigo-500/50'
        }`}
      >
        <input {...getInputProps()} />
        <UploadCloud className="w-6 h-6 mx-auto mb-1 text-gray-500" />
        <p className="text-xs text-gray-500">
          {isDragActive ? 'Drop files here' : 'Drop or click to upload'}
        </p>
        <p className="text-[10px] text-gray-600 mt-1">video, image, audio</p>
      </div>
    </div>
  )
}
