import { useEffect } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ReactFlowProvider } from '@xyflow/react'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DecisionCanvas } from '@/components/canvas/decision-canvas'
import { useGraphStore } from '@/stores/graph-store'

import '@xyflow/react/dist/style.css'

export const Route = createFileRoute('/canvas')({ component: CanvasScreen })

function CanvasScreen() {
  const nodes = useGraphStore((s) => s.nodes)
  const reset = useGraphStore((s) => s.reset)
  const navigate = useNavigate()

  useEffect(() => {
    if (nodes.length === 0) {
      navigate({ to: '/' })
    }
  }, [nodes.length, navigate])

  if (nodes.length === 0) {
    return null
  }

  const handleBack = () => {
    reset()
    navigate({ to: '/' })
  }

  return (
    <div className="flex h-screen w-screen flex-col">
      <div className="absolute left-4 top-4 z-10">
        <Button variant="outline" size="sm" onClick={handleBack}>
          <ArrowLeft className="size-4" data-icon="inline-start" />
          New Decision
        </Button>
      </div>
      <div className="flex-1">
        <ReactFlowProvider>
          <DecisionCanvas />
        </ReactFlowProvider>
      </div>
    </div>
  )
}
