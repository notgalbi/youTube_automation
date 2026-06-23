import { AbsoluteFill, useCurrentFrame } from 'remotion'

interface Props {
  totalFrames: number
  color?: string
}

export const ProgressBar: React.FC<Props> = ({ totalFrames, color = '#6366f1' }) => {
  const frame = useCurrentFrame()
  const progress = frame / totalFrames

  return (
    <AbsoluteFill style={{ pointerEvents: 'none', justifyContent: 'flex-end' }}>
      <div style={{ width: '100%', height: 6, backgroundColor: 'rgba(0,0,0,0.3)' }}>
        <div style={{ width: `${progress * 100}%`, height: '100%', backgroundColor: color, transition: 'none' }} />
      </div>
    </AbsoluteFill>
  )
}
