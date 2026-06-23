import { AbsoluteFill, Video, useVideoConfig, OffthreadVideo } from 'remotion'
import type { Scene } from '../schema'
import { TextOverlay } from './TextOverlay'
import { CaptionTrack } from './CaptionTrack'
import { TransitionFade } from './TransitionFade'

interface Props {
  scene: Scene
}

export const VideoScene: React.FC<Props> = ({ scene }) => {
  const { width, height } = useVideoConfig()

  return (
    <AbsoluteFill>
      <OffthreadVideo
        src={scene.src}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
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
