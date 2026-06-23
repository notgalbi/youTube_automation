import { Composition, Sequence, AbsoluteFill } from 'remotion'
import { TimelineSchema, ASPECT_RATIO_DIMS, type Timeline } from './schema'
import { VideoScene } from './components/VideoScene'
import { ImageScene } from './components/ImageScene'
import { BackgroundMusic } from './components/BackgroundMusic'
import { z } from 'zod'

const MainCompositionInner: React.FC<{ timeline: Timeline }> = ({ timeline }) => {
  const totalFrames = timeline.scenes.reduce((acc, s) => acc + s.durationInFrames, 0)

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      {timeline.scenes.map(scene => (
        <Sequence
          key={scene.id}
          from={scene.startFrame}
          durationInFrames={scene.durationInFrames}
        >
          {scene.type === 'video' ? (
            <VideoScene scene={scene} />
          ) : (
            <ImageScene scene={scene} />
          )}
        </Sequence>
      ))}
      {timeline.backgroundMusic && (
        <BackgroundMusic
          src={timeline.backgroundMusic.src}
          volume={timeline.backgroundMusic.volume}
        />
      )}
    </AbsoluteFill>
  )
}

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="MainComposition"
        component={MainCompositionInner as any}
        durationInFrames={300}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ timeline: {
          id: 'default',
          title: 'My Video',
          aspectRatio: '9:16' as const,
          fps: 30,
          scenes: [],
          backgroundMusic: null,
        }}}
        calculateMetadata={async ({ props }) => {
          const timeline = props.timeline as Timeline
          const dims = ASPECT_RATIO_DIMS[timeline.aspectRatio] ?? { width: 1080, height: 1920 }
          const totalFrames = timeline.scenes.reduce((acc, s) => acc + s.durationInFrames, 0)
          return {
            durationInFrames: Math.max(totalFrames, 1),
            fps: timeline.fps,
            width: dims.width,
            height: dims.height,
          }
        }}
      />
    </>
  )
}
