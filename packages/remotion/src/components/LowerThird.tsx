import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion'

interface Props {
  title: string
  subtitle?: string
  startFrame: number
  durationInFrames: number
}

export const LowerThird: React.FC<Props> = ({ title, subtitle, startFrame, durationInFrames }) => {
  const frame = useCurrentFrame()
  const relFrame = frame - startFrame

  if (relFrame < 0 || relFrame >= durationInFrames) return null

  const slideX = interpolate(relFrame, [0, 20], [-100, 0], { extrapolateRight: 'clamp' })
  const opacity = interpolate(
    relFrame,
    [0, 10, durationInFrames - 10, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  )

  return (
    <AbsoluteFill style={{ pointerEvents: 'none', justifyContent: 'flex-end', padding: '6%' }}>
      <div style={{ transform: `translateX(${slideX}%)`, opacity }}>
        <div style={{ backgroundColor: '#6366f1', display: 'inline-block', padding: '8px 20px', marginBottom: 4 }}>
          <span style={{ color: '#fff', fontSize: 32, fontWeight: 'bold', fontFamily: 'system-ui' }}>{title}</span>
        </div>
        {subtitle && (
          <div style={{ backgroundColor: 'rgba(0,0,0,0.7)', display: 'inline-block', padding: '4px 20px' }}>
            <span style={{ color: '#ddd', fontSize: 22, fontFamily: 'system-ui' }}>{subtitle}</span>
          </div>
        )}
      </div>
    </AbsoluteFill>
  )
}
