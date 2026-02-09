import { nanoid } from 'nanoid'
import type { DecisionNode, DecisionEdge, Polarity } from './types'

type StorylineNodeJSON = {
  text: string
  polarity: string
  next?: StorylineNodeJSON
}

export function storylinesToFlow(
  rootText: string,
  storylines: StorylineNodeJSON[],
): { nodes: DecisionNode[]; edges: DecisionEdge[] } {
  const nodes: DecisionNode[] = []
  const edges: DecisionEdge[] = []

  const rootId = nanoid()
  nodes.push({
    id: rootId,
    type: 'decision',
    position: { x: 0, y: 0 },
    data: { label: rootText, polarity: 'root', isLeaf: false },
  })

  for (const storyline of storylines) {
    let parentId = rootId
    let current: StorylineNodeJSON | undefined = storyline

    while (current) {
      const nodeId = nanoid()
      const polarity = (['positive', 'neutral', 'negative'].includes(current.polarity)
        ? current.polarity
        : 'neutral') as Polarity
      const isLeaf = !current.next

      nodes.push({
        id: nodeId,
        type: 'decision',
        position: { x: 0, y: 0 },
        data: { label: current.text, polarity, isLeaf },
      })

      edges.push({
        id: `${parentId}-${nodeId}`,
        source: parentId,
        target: nodeId,
      })

      parentId = nodeId
      current = current.next
    }
  }

  return { nodes, edges }
}
