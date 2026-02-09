import type { Polarity, Tone, Timeline, PathStyle, GenerationSettings } from './types'

export const BRANCHES_PER_NODE = 3

export const POLARITIES: Polarity[] = ['positive', 'neutral', 'negative']

export const NODE_WIDTH = 300
export const NODE_HEIGHT = 100

export const GRAPH_DIRECTION = 'LR' as const

export const TONE_OPTIONS: { value: Tone; label: string }[] = [
  { value: 'realistic', label: 'Realistic' },
  { value: 'optimistic', label: 'Optimistic' },
  { value: 'pessimistic', label: 'Pessimistic' },
  { value: 'chaotic', label: 'Chaotic' },
]

export const TIMELINE_OPTIONS: { value: Timeline; label: string }[] = [
  { value: '1y', label: '1 Year' },
  { value: '5y', label: '5 Years' },
  { value: '10y', label: '10 Years' },
  { value: 'lifetime', label: 'Lifetime' },
]

export const PATH_STYLE_OPTIONS: { value: PathStyle; label: string; description: string }[] = [
  { value: 'story', label: 'Story', description: 'AI picks polarities for narrative coherence' },
  { value: 'balanced', label: 'Balanced', description: 'Always one positive, neutral, negative' },
  { value: 'chaos', label: 'Chaos', description: 'Wild, unpredictable outcomes' },
]

export const DEPTH_OPTIONS: { value: number; label: string }[] = [
  { value: 2, label: 'Quick (2 levels)' },
  { value: 3, label: 'Medium (3 levels)' },
  { value: 4, label: 'Deep (4 levels)' },
]

export const DEFAULT_SETTINGS: GenerationSettings = {
  tone: 'realistic',
  timeline: '5y',
  pathStyle: 'story',
  depth: 3,
}

export const TIMELINE_LABELS: Record<Timeline, string> = {
  '1y': '1 year',
  '5y': '5 years',
  '10y': '10 years',
  lifetime: 'a lifetime',
}

export const TONE_PROMPTS: Record<Tone, string> = {
  optimistic: 'Focus on hopeful and encouraging outcomes, but keep them realistic and grounded.',
  realistic: 'Be balanced and pragmatic. Show how things would most likely unfold.',
  pessimistic: 'Focus on risks, challenges, and things that could go wrong.',
  chaotic: 'Be wildly creative and unpredictable. Throw in unexpected twists and absurd scenarios.',
}
