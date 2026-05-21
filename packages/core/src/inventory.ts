import type { AnyNode } from './schema/types'

export interface InventoryItem {
  id: string
  name: string
  description?: string
  imageUrl?: string
  quantity?: number
}

export interface InventoryData {
  items: InventoryItem[]
}

export function getInventory(node: AnyNode | undefined): InventoryData {
  if (!node?.metadata) {
    return { items: [] }
  }
  const inventory = (node.metadata as Record<string, unknown>).inventory
  if (
    inventory &&
    typeof inventory === 'object' &&
    'items' in inventory &&
    Array.isArray((inventory as Record<string, unknown>).items)
  ) {
    return inventory as InventoryData
  }
  return { items: [] }
}

export function createInventoryItem(draft: Omit<InventoryItem, 'id'>): InventoryItem {
  return {
    id: crypto.randomUUID(),
    ...draft,
  }
}

export function buildInventoryPatch(
  node: AnyNode,
  updater: (data: InventoryData) => InventoryData,
): Partial<AnyNode> {
  const current = getInventory(node)
  const next = updater(current)
  const baseMetadata =
    node.metadata && typeof node.metadata === 'object' && !Array.isArray(node.metadata)
      ? node.metadata
      : {}
  return {
    metadata: {
      ...baseMetadata,
      inventory: next,
    },
  } as unknown as Partial<AnyNode>
}
