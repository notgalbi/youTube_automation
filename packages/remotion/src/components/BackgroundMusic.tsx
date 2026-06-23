import { Audio } from 'remotion'

interface Props {
  src: string
  volume: number
}

export const BackgroundMusic: React.FC<Props> = ({ src, volume }) => {
  return <Audio src={src} volume={volume} />
}
