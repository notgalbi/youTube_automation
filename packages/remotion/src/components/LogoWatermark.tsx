import { AbsoluteFill } from 'remotion'

interface Props {
  text?: string
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
}

const POSITIONS: Record<string, React.CSSProperties> = {
  'top-left': { top: '4%', left: '4%' },
  'top-right': { top: '4%', right: '4%' },
  'bottom-left': { bottom: '4%', left: '4%' },
  'bottom-right': { bottom: '4%', right: '4%' },
}

export const LogoWatermark: React.FC<Props> = ({ text = 'AI Video', position = 'bottom-right' }) => {
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', ...POSITIONS[position] }}>
        <span style={{
          color: 'rgba(255,255,255,0.5)',
          fontSize: 24,
          fontFamily: 'system-ui',
          fontWeight: 600,
          letterSpacing: 1,
        }}>
          {text}
        </span>
      </div>
    </AbsoluteFill>
  )
}
