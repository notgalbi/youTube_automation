import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion'

interface Props {
  durationInFrames: number
  direction: 'in' | 'out'
}

export const TransitionFade: React.FC<Props> = ({ durationInFrames, direction }) => {
  const frame = useCurrentFrame()

  const opacity = direction === 'in'
    ? interpolate(frame, [0, durationInFrames], [1, 0], { extrapolateRight: 'clamp' })
    : interpolate(frame, [0, durationInFrames], [0, 1], { extrapolateRight: 'clamp' })

  if (opacity <= 0) return null

  return (
    <AbsoluteFill style={{ backgroundColor: `rgba(0,0,0,${opacity})`, pointerEvents: 'none' }} />
  )
}
