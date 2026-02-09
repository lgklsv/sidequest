import { useEffect, useRef } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  useReactFlow,
  type NodeTypes,
} from '@xyflow/react'
import { useGraphStore } from '@/stores/graph-store'
import { DecisionNode } from './decision-node'

const nodeTypes: NodeTypes = {
  decision: DecisionNode,
}

export function DecisionCanvas() {
  const nodes = useGraphStore((s) => s.nodes)
  const edges = useGraphStore((s) => s.edges)
  const { fitView } = useReactFlow()
  const nodeCount = useRef(nodes.length)

  useEffect(() => {
    if (nodes.length !== nodeCount.current) {
      nodeCount.current = nodes.length
      // Small delay to let React Flow render the new nodes first
      const timer = setTimeout(() => {
        fitView({ padding: 0.2, duration: 300 })
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [nodes.length, fitView])

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      nodesDraggable={false}
      nodesConnectable={false}
      fitView
      fitViewOptions={{ padding: 0.2 }}
      minZoom={0.1}
      maxZoom={1.5}
      proOptions={{ hideAttribution: true }}
    >
      <Background gap={20} size={1} />
      <Controls showInteractive={false} />
    </ReactFlow>
  )
}
