import { create } from 'zustand'
import { nanoid } from 'nanoid'
import type { DecisionNode, DecisionEdge, AIBranch, GenerationSettings } from '@/lib/types'
import { DEFAULT_SETTINGS } from '@/lib/constants'
import { getLayoutedElements } from '@/lib/layout'

interface GraphState {
  nodes: DecisionNode[]
  edges: DecisionEdge[]
  expandingNodeId: string | null
  settings: GenerationSettings
  setSettings: (settings: GenerationSettings) => void
  setGraph: (nodes: DecisionNode[], edges: DecisionEdge[]) => void
  expandNode: (parentId: string, branches: AIBranch[]) => void
  setExpandingNodeId: (id: string | null) => void
  getAncestorPath: (nodeId: string) => string[]
  reset: () => void
}

export const useGraphStore = create<GraphState>((set, get) => ({
  nodes: [],
  edges: [],
  expandingNodeId: null,
  settings: DEFAULT_SETTINGS,

  setSettings: (settings) => set({ settings }),

  setGraph: (nodes, edges) => {
    const { nodes: layouted, edges: layoutedEdges } = getLayoutedElements(nodes, edges)
    set({ nodes: layouted, edges: layoutedEdges, expandingNodeId: null })
  },

  expandNode: (parentId, branches) => {
    const state = get()
    const updatedNodes = state.nodes.map((node) =>
      node.id === parentId
        ? { ...node, data: { ...node.data, isLeaf: false } }
        : node,
    )

    const childNodes: DecisionNode[] = branches.map((branch) => {
      const id = nanoid()
      return {
        id,
        type: 'decision',
        position: { x: 0, y: 0 },
        data: { label: branch.text, polarity: branch.polarity, isLeaf: true },
      }
    })

    const newEdges: DecisionEdge[] = childNodes.map((child) => ({
      id: `${parentId}-${child.id}`,
      source: parentId,
      target: child.id,
    }))

    const allNodes = [...updatedNodes, ...childNodes]
    const allEdges = [...state.edges, ...newEdges]

    const { nodes, edges } = getLayoutedElements(allNodes, allEdges)

    set({ nodes, edges, expandingNodeId: null })
  },

  setExpandingNodeId: (id) => set({ expandingNodeId: id }),

  getAncestorPath: (nodeId) => {
    const { nodes, edges } = get()
    const path: string[] = []
    let currentId = nodeId

    while (true) {
      const parentEdge = edges.find((e) => e.target === currentId)
      if (!parentEdge) break
      const parentNode = nodes.find((n) => n.id === parentEdge.source)
      if (!parentNode) break
      path.unshift(parentNode.data.label)
      currentId = parentNode.id
    }

    return path
  },

  reset: () => set({ nodes: [], edges: [], expandingNodeId: null }),
}))
