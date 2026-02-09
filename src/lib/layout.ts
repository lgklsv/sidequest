import dagre from 'dagre'
import type { DecisionNode, DecisionEdge } from './types'
import { NODE_WIDTH, NODE_HEIGHT, GRAPH_DIRECTION } from './constants'

export function getLayoutedElements(
  nodes: DecisionNode[],
  edges: DecisionEdge[],
) {
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({
    rankdir: GRAPH_DIRECTION,
    nodesep: 50,
    ranksep: 120,
  })

  nodes.forEach((node) => {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT })
  })

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target)
  })

  dagre.layout(g)

  const layoutedNodes: DecisionNode[] = nodes.map((node) => {
    const nodeWithPosition = g.node(node.id)
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - NODE_WIDTH / 2,
        y: nodeWithPosition.y - NODE_HEIGHT / 2,
      },
    }
  })

  return { nodes: layoutedNodes, edges }
}
