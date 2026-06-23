export async function addCaptions(
  timeline: Record<string, unknown>,
  sceneId: string,
  transcript: string,
  fps: number = 30
): Promise<Record<string, unknown>> {
  const scenes = (timeline.scenes as any[]) ?? []
  const sceneIdx = scenes.findIndex((s: any) => s.id === sceneId)

  if (sceneIdx === -1) {
    return { error: `Scene "${sceneId}" not found`, availableSceneIds: scenes.map((s: any) => s.id) }
  }

  const scene = scenes[sceneIdx]
  const lines = transcript.split('\n').filter(l => l.trim())
  const framesPerCaption = Math.floor(scene.durationInFrames / Math.max(lines.length, 1))

  const captions = lines.map((text, idx) => ({
    id: `caption-${Date.now()}-${idx}`,
    text: text.trim(),
    startFrame: idx * framesPerCaption,
    durationInFrames: framesPerCaption,
  }))

  const updatedScenes = [...scenes]
  updatedScenes[sceneIdx] = { ...scene, captions }

  return { ...timeline, scenes: updatedScenes }
}
