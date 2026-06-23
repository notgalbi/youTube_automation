import { z } from 'zod'

export const TextOverlaySchema = z.object({
  id: z.string(),
  text: z.string(),
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  fontSize: z.number().min(8).max(400),
  color: z.string().default('#ffffff'),
  startFrame: z.number().min(0),
  durationInFrames: z.number().min(1),
})

export const CaptionSchema = z.object({
  id: z.string(),
  text: z.string(),
  startFrame: z.number().min(0),
  durationInFrames: z.number().min(1),
})

export const TransitionSchema = z.object({
  type: z.enum(['none', 'fade', 'slide']),
  durationInFrames: z.number().min(0).default(15),
})

export const SceneSchema = z.object({
  id: z.string(),
  type: z.enum(['video', 'image']),
  src: z.string(),
  filename: z.string().optional(),
  startFrame: z.number().min(0),
  durationInFrames: z.number().min(1),
  textOverlays: z.array(TextOverlaySchema).default([]),
  captions: z.array(CaptionSchema).default([]),
  transition: TransitionSchema.default({ type: 'fade', durationInFrames: 15 }),
})

export const BackgroundMusicSchema = z.object({
  src: z.string(),
  volume: z.number().min(0).max(1).default(0.5),
})

export const TimelineSchema = z.object({
  id: z.string(),
  title: z.string().default('My Video'),
  aspectRatio: z.enum(['9:16', '16:9', '1:1']).default('9:16'),
  fps: z.number().min(1).max(120).default(30),
  scenes: z.array(SceneSchema),
  backgroundMusic: BackgroundMusicSchema.nullable().default(null),
})

export type TextOverlay = z.infer<typeof TextOverlaySchema>
export type Caption = z.infer<typeof CaptionSchema>
export type Scene = z.infer<typeof SceneSchema>
export type Timeline = z.infer<typeof TimelineSchema>

export const ASPECT_RATIO_DIMS: Record<string, { width: number; height: number }> = {
  '9:16': { width: 1080, height: 1920 },
  '16:9': { width: 1920, height: 1080 },
  '1:1': { width: 1080, height: 1080 },
}
