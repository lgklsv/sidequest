import type { Node, Edge } from '@xyflow/react'

export type Polarity = 'positive' | 'neutral' | 'negative' | 'root'

export type Tone = 'optimistic' | 'realistic' | 'pessimistic' | 'chaotic'
export type Timeline = '1y' | '5y' | '10y' | 'lifetime'
export type PathStyle = 'balanced' | 'story' | 'chaos'

export type GenerationSettings = {
  tone: Tone
  timeline: Timeline
  pathStyle: PathStyle
  depth: number
}

export type NodeData = {
  label: string
  polarity: Polarity
  isLeaf: boolean
}

export type DecisionNode = Node<NodeData>
export type DecisionEdge = Edge

export type AIBranch = {
  text: string
  polarity: Polarity
}
