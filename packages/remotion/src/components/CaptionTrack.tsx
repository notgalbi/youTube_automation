import { AbsoluteFill, useCurrentFrame } from 'remotion'
import type { Caption } from '../schema'

interface Props {
  captions: Caption[]
}

export const CaptionTrack: React.FC<Props> = ({ captions }) => {
  const frame = useCurrentFrame()

  const active = captions.find(
    c => frame >= c.startFrame && frame < c.startFrame + c.durationInFrames
  )

  if (!active) return null

  return (
    <AbsoluteFill style={{ pointerEvents: 'none', justifyContent: 'flex-end', alignItems: 'center', paddingBottom: '8%' }}>
      <div
        style={{
          backgroundColor: 'rgba(0,0,0,0.75)',
          color: '#ffffff',
          fontSize: 38,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontWeight: 600,
          padding: '12px 24px',
          borderRadius: 8,
          maxWidth: '85%',
          textAlign: 'center',
          lineHeight: 1.4,
        }}
      >
        {active.text}
      </div>
    </AbsoluteFill>
  )
}
