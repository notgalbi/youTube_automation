import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from 'remotion'
import type { TextOverlay as TextOverlayType } from '../schema'

interface Props {
  overlay: TextOverlayType
}

export const TextOverlay: React.FC<Props> = ({ overlay }) => {
  const frame = useCurrentFrame()
  const { width, height } = useVideoConfig()

  const relFrame = frame - overlay.startFrame
  if (relFrame < 0 || relFrame >= overlay.durationInFrames) return null

  const opacity = interpolate(
    relFrame,
    [0, 10, overlay.durationInFrames - 10, overlay.durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  )

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <div
        style={{
          position: 'absolute',
          left: `${overlay.x}%`,
          top: `${overlay.y}%`,
          transform: 'translate(-50%, -50%)',
          fontSize: overlay.fontSize,
          color: overlay.color,
          fontWeight: 'bold',
          textAlign: 'center',
          opacity,
          textShadow: '2px 2px 8px rgba(0,0,0,0.8), -1px -1px 4px rgba(0,0,0,0.6)',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          whiteSpace: 'pre-wrap',
          maxWidth: '80%',
          lineHeight: 1.2,
        }}
      >
        {overlay.text}
      </div>
    </AbsoluteFill>
  )
}
