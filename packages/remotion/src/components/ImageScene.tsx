import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig, interpolate } from 'remotion'
import type { Scene } from '../schema'
import { TextOverlay } from './TextOverlay'
import { CaptionTrack } from './CaptionTrack'
import { TransitionFade } from './TransitionFade'

interface Props {
  scene: Scene
}

export const ImageScene: React.FC<Props> = ({ scene }) => {
  const frame = useCurrentFrame()
  const { durationInFrames } = useVideoConfig()

  // Ken Burns effect: slow zoom
  const scale = interpolate(frame, [0, scene.durationInFrames], [1, 1.06], {
    extrapolateRight: 'clamp',
  })

  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      <Img
        src={scene.src}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
        }}
      />
      {scene.textOverlays.map(overlay => (
        <TextOverlay key={overlay.id} overlay={overlay} />
      ))}
      <CaptionTrack captions={scene.captions} />
      {scene.transition.type === 'fade' && scene.transition.durationInFrames > 0 && (
        <TransitionFade durationInFrames={scene.transition.durationInFrames} direction="in" />
      )}
    </AbsoluteFill>
  )
}
