'use client'

import type { AnyNode, AnyNodeId, BuildingNode, InventoryItem, LevelNode } from '@pascal-app/core'
import { emitter, getInventory, resolveLevelId, useScene } from '@pascal-app/core'
import { useViewer } from '@pascal-app/viewer'
import { Command, useCommandState } from 'cmdk'
import { ChevronRight, Package, LayoutGrid, List } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { usePaletteViewRegistry } from '../../../store/use-palette-view-registry'
import type { PaletteViewProps } from '../../../store/use-palette-view-registry'
import { InventoryGallery } from '../inventory-gallery'
import { cn } from '../../../lib/utils'

function getNodeDisplayName(node: AnyNode): string {
  if (node.name?.trim()) return node.name.trim()
  const label = node.type.charAt(0).toUpperCase() + node.type.slice(1)
  const shortId = node.id.slice(-4)
  return `${label} (${shortId})`
}

function getInventorySearchValue(item: InventoryItem): string {
  const name = item.name?.trim() ?? ''
  const description = item.description?.trim() ?? ''
  const id = item.id ?? ''
  return `${name} ${description} ${id}`.trim().toLowerCase()
}

interface InventoryResult {
  node: AnyNode
  item: InventoryItem
}

// ---------------------------------------------------------------------------
// Page component (rendered inside Command.List)
// ---------------------------------------------------------------------------
function FindInScenePage({ onClose }: PaletteViewProps) {
  const nodes = useScene((s) => s.nodes)
  const search = useCommandState((s) => s.search.toLowerCase())
  const [viewMode, setViewMode] = useState<'list' | 'gallery'>('list')

  const allResults = useMemo(() => {
    const results: InventoryResult[] = []
    for (const node of Object.values(nodes)) {
      const inventory = getInventory(node)
      for (const item of inventory.items) {
        results.push({ node, item })
      }
    }
    return results
  }, [nodes])

  const filtered = useMemo(() => {
    if (!search) return allResults
    return allResults.filter((r) => getInventorySearchValue(r.item).includes(search))
  }, [allResults, search])

  const grouped = useMemo(() => {
    const map = new Map<string, InventoryResult[]>()
    for (const result of filtered) {
      const nodeId = result.node.id
      const list = map.get(nodeId) ?? []
      list.push(result)
      map.set(nodeId, list)
    }
    return map
  }, [filtered])

  const handleSelect = (nodeId: AnyNodeId) => {
    onClose()

    const node = nodes[nodeId as AnyNodeId]
    if (!node) return

    const levelId = resolveLevelId(node, nodes)
    const buildingId = levelId
      ? (() => {
          const level = nodes[levelId as AnyNodeId]
          return level?.parentId ?? null
        })()
      : null

    useViewer.getState().setSelection({
      buildingId: buildingId as BuildingNode['id'] | null,
      levelId: levelId as LevelNode['id'] | null,
      selectedIds: [nodeId],
    })

    emitter.emit('camera-controls:focus', { nodeId })
  }

  const galleryItems = useMemo(
    () => filtered.map((r) => ({ item: r.item, node: r.node })),
    [filtered],
  )

  return (
    <>
      {/* View toggle */}
      <div className="flex items-center justify-end gap-1 border-b border-border/50 px-3 py-2">
        <span className="mr-auto text-muted-foreground text-xs">
          {filtered.length} item{filtered.length !== 1 ? 's' : ''}
        </span>
        <button
          className={cn(
            'rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent',
            viewMode === 'list' && 'bg-accent text-foreground',
          )}
          onClick={() => setViewMode('list')}
          title="List view"
          type="button"
        >
          <List className="h-3.5 w-3.5" />
        </button>
        <button
          className={cn(
            'rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent',
            viewMode === 'gallery' && 'bg-accent text-foreground',
          )}
          onClick={() => setViewMode('gallery')}
          title="Gallery view"
          type="button"
        >
          <LayoutGrid className="h-3.5 w-3.5" />
        </button>
      </div>

      {viewMode === 'list' && filtered.length === 0 && (
        <Command.Empty className="py-8 text-center text-muted-foreground text-sm">
          {allResults.length === 0 ? 'No inventories in the scene.' : 'No inventory items found.'}
        </Command.Empty>
      )}

      {viewMode === 'gallery' ? (
        <div className="px-3 py-3">
          <InventoryGallery
            className="grid-cols-2 md:grid-cols-3"
            emptyMessage="No inventory items found."
            items={galleryItems}
            onNavigate={(nodeId) => handleSelect(nodeId)}
          />
        </div>
      ) : (
        Array.from(grouped.entries()).map(([nodeId, results]) => {
          const node = nodes[nodeId as AnyNodeId]
          if (!node) return null
          return (
            <Command.Group heading={getNodeDisplayName(node)} key={nodeId}>
              {results.map((result) => (
                <Command.Item
                  className="flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-foreground text-sm transition-colors data-[selected=true]:bg-accent"
                  key={result.item.id}
                  onSelect={() => handleSelect(nodeId as AnyNodeId)}
                  value={`${getNodeDisplayName(node)} ${result.item.name} ${result.item.description ?? ''}`}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded bg-muted">
                    {result.item.imageUrl ? (
                      <img
                        alt={result.item.name}
                        className="h-full w-full object-cover"
                        src={result.item.imageUrl}
                      />
                    ) : (
                      <Package className="h-4 w-4 text-muted-foreground" />
                    )}
                  </span>
                  <span className="flex-1 truncate">
                    {result.item.name}
                    {result.item.quantity !== undefined && result.item.quantity > 1 && (
                      <span className="ml-1 text-muted-foreground">×{result.item.quantity}</span>
                    )}
                  </span>
                  <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
                </Command.Item>
              ))}
            </Command.Group>
          )
        })
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// Registration component — mount once inside <Editor>
// ---------------------------------------------------------------------------
export function FindInSceneRegister() {
  useEffect(() => {
    const unregister = usePaletteViewRegistry.getState().register({
      key: 'find-in-scene',
      type: 'page',
      label: 'Find in Inventory',
      Component: FindInScenePage,
    })
    return unregister
  }, [])

  return null
}
