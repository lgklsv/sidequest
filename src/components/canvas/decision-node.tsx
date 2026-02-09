import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { PlusCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { NodeData } from '@/lib/types'
import { useGraphStore } from '@/stores/graph-store'
import { generateBranches } from '@/server/ai'

const polarityStyles = {
  root: 'border-blue-400 bg-blue-50 dark:border-blue-500 dark:bg-blue-950/50',
  positive:
    'border-emerald-400 bg-emerald-50 dark:border-emerald-500 dark:bg-emerald-950/50',
  neutral:
    'border-gray-300 bg-gray-50 dark:border-gray-500 dark:bg-gray-800/50',
  negative: 'border-red-400 bg-red-50 dark:border-red-500 dark:bg-red-950/50',
} as const

const polarityBadgeVariant = {
  root: 'default' as const,
  positive: 'secondary' as const,
  neutral: 'outline' as const,
  negative: 'destructive' as const,
}

const polarityLabel = {
  root: 'Root',
  positive: 'Positive',
  neutral: 'Neutral',
  negative: 'Negative',
}

function DecisionNodeComponent({ data, id }: NodeProps) {
  const nodeData = data as unknown as NodeData
  const expandingNodeId = useGraphStore((s) => s.expandingNodeId)
  const setExpandingNodeId = useGraphStore((s) => s.setExpandingNodeId)
  const expandNode = useGraphStore((s) => s.expandNode)
  const settings = useGraphStore((s) => s.settings)
  const getAncestorPath = useGraphStore((s) => s.getAncestorPath)

  const isExpanding = expandingNodeId === id

  const handleExpand = async () => {
    setExpandingNodeId(id)
    try {
      const ancestorPath = getAncestorPath(id)
      const nodeDepth = ancestorPath.length + 1
      const result = await generateBranches({
        data: {
          nodeText: nodeData.label,
          tone: settings.tone,
          timeline: settings.timeline,
          pathStyle: settings.pathStyle,
          ancestorPath,
          currentLevel: Math.min(nodeDepth, settings.depth),
          totalLevels: settings.depth,
        },
      })
      expandNode(id, result.branches)
    } catch (error) {
      console.error('Failed to generate branches:', error)
      setExpandingNodeId(null)
    }
  }

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-xl border-2 px-4 py-3 shadow-sm transition-colors',
        'min-w-[220px] max-w-[320px]',
        polarityStyles[nodeData.polarity],
      )}
    >
      <Handle type="target" position={Position.Left} className="!bg-border" />

      <div className="flex flex-1 flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <Badge variant={polarityBadgeVariant[nodeData.polarity]} className="text-[10px] px-1.5 py-0 h-4">
            {polarityLabel[nodeData.polarity]}
          </Badge>
        </div>
        <span className="text-sm font-medium leading-snug">{nodeData.label}</span>
      </div>

      {nodeData.isLeaf && (
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={handleExpand}
          disabled={expandingNodeId !== null}
          className="shrink-0"
        >
          {isExpanding ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <PlusCircle className="size-3.5" />
          )}
        </Button>
      )}

      <Handle type="source" position={Position.Right} className="!bg-border" />
    </div>
  )
}

export const DecisionNode = memo(DecisionNodeComponent)
