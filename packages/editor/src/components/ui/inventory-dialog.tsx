'use client'

import {
  buildInventoryPatch,
  createInventoryItem,
  getInventory,
  type InventoryItem,
  type AnyNode,
  useScene,
  emitter,
} from '@pascal-app/core'
import {
  ImagePlus,
  Package,
  Pencil,
  Plus,
  Trash2,
  X,
  LayoutGrid,
  List,
  Crosshair,
} from 'lucide-react'
import { useCallback, useMemo, useRef, useState } from 'react'
import { Button } from './primitives/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './primitives/dialog'
import { Input } from './primitives/input'
import { InventoryGallery } from './inventory-gallery'
import { cn } from '../../lib/utils'

interface InventoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  nodeId: string | undefined
  nodeName?: string
}

function useImageFilePicker(onImageLoaded: (dataUrl: string) => void) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const pickImage = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          onImageLoaded(reader.result)
        }
      }
      reader.readAsDataURL(file)
      e.target.value = ''
    },
    [onImageLoaded],
  )

  return { fileInputRef, pickImage, handleFileChange }
}

function InventoryItemForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<InventoryItem>
  onSave: (item: Omit<InventoryItem, 'id'>) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? '')
  const [quantity, setQuantity] = useState(
    initial?.quantity !== undefined ? String(initial.quantity) : '1',
  )

  const { fileInputRef, pickImage, handleFileChange } = useImageFilePicker(
    useCallback((dataUrl: string) => setImageUrl(dataUrl), []),
  )

  const handleSave = () => {
    onSave({
      name: name.trim() || 'Unnamed item',
      description: description.trim() || undefined,
      imageUrl: imageUrl.trim() || undefined,
      quantity: Math.max(1, Math.round(Number(quantity) || 1)),
    })
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border/50 bg-[#2C2C2E] p-3">
      <div className="flex items-center justify-between">
        <span className="font-medium text-sm">{initial ? 'Edit item' : 'New item'}</span>
        <button
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent"
          onClick={onCancel}
          type="button"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {imageUrl ? (
        <div className="relative self-start">
          <img alt="Preview" className="h-20 w-20 rounded-md object-cover" src={imageUrl} />
          <button
            className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white"
            onClick={() => setImageUrl('')}
            type="button"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <button
          className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border/80 bg-[#3e3e3e] text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
          onClick={pickImage}
          type="button"
        >
          <ImagePlus className="h-5 w-5" />
          <span className="text-[10px]">Add photo</span>
        </button>
      )}
      <input
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        ref={fileInputRef}
        type="file"
      />

      <Input placeholder="Name *" value={name} onChange={(e) => setName(e.target.value)} />
      <Input
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <div className="flex gap-2">
        <Input
          className="flex-1"
          placeholder="Or paste image URL"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
        />
        <Input
          className="w-24"
          min="1"
          placeholder="Qty"
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
        />
      </div>
      <Button className="mt-1 w-full" disabled={!name.trim()} onClick={handleSave} size="sm">
        {initial ? 'Save changes' : 'Add item'}
      </Button>
    </div>
  )
}

function InventoryItemCard({
  item,
  onEdit,
  onDelete,
}: {
  item: InventoryItem
  onEdit: () => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border/50 bg-[#2C2C2E] p-3">
      {item.imageUrl ? (
        <img
          alt={item.name}
          className="h-16 w-16 shrink-0 rounded-md object-cover"
          src={item.imageUrl}
        />
      ) : (
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md bg-[#3e3e3e]">
          <Package className="h-6 w-6 text-muted-foreground" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate font-medium text-sm">{item.name}</span>
          {typeof item.quantity === 'number' && (
            <span className="shrink-0 rounded-md bg-primary/10 px-2 py-0.5 font-mono text-primary text-xs">
              ×{item.quantity}
            </span>
          )}
        </div>
        {item.description && (
          <p className="mt-1 line-clamp-2 text-muted-foreground text-xs">{item.description}</p>
        )}
      </div>
      <div className="flex shrink-0 flex-col gap-1">
        <button
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          onClick={onEdit}
          type="button"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-red-500/20 hover:text-red-400"
          onClick={() => onDelete(item.id)}
          type="button"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

export function InventoryDialog({
  open,
  onOpenChange,
  nodeId,
  nodeName,
}: InventoryDialogProps) {
  const node = useScene((s) =>
    nodeId ? (s.nodes[nodeId as AnyNode['id']] as AnyNode | undefined) : undefined,
  )
  const inventory = useMemo(() => getInventory(node), [node])

  const [editingId, setEditingId] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'gallery'>('list')

  const resetDraft = useCallback(() => {
    setIsAdding(false)
    setEditingId(null)
  }, [])

  const handleAdd = useCallback(
    (draft: Omit<InventoryItem, 'id'>) => {
      if (!node || !nodeId) return
      const newItem = createInventoryItem(draft)
      const patch = buildInventoryPatch(node, (data) => ({
        items: [...data.items, newItem],
      }))
      useScene.getState().updateNode(nodeId as AnyNode['id'], patch)
      resetDraft()
    },
    [node, nodeId, resetDraft],
  )

  const handleUpdate = useCallback(
    (id: string, draft: Omit<InventoryItem, 'id'>) => {
      if (!node || !nodeId) return
      const patch = buildInventoryPatch(node, (data) => ({
        items: data.items.map((i) => (i.id === id ? { ...i, ...draft } : i)),
      }))
      useScene.getState().updateNode(nodeId as AnyNode['id'], patch)
      resetDraft()
    },
    [node, nodeId, resetDraft],
  )

  const handleDelete = useCallback(
    (itemId: string) => {
      if (!node || !nodeId) return
      const patch = buildInventoryPatch(node, (data) => ({
        items: data.items.filter((i) => i.id !== itemId),
      }))
      useScene.getState().updateNode(nodeId as AnyNode['id'], patch)
      if (editingId === itemId) setEditingId(null)
    },
    [node, nodeId, editingId],
  )

  const handleFocusNode = useCallback(() => {
    if (!nodeId) return
    onOpenChange(false)
    emitter.emit('camera-controls:focus', { nodeId: nodeId as AnyNode['id'] })
  }, [nodeId, onOpenChange])

  const editingItem = useMemo(
    () => inventory.items.find((i) => i.id === editingId),
    [inventory.items, editingId],
  )

  const galleryItems = useMemo(
    () => inventory.items.map((item) => ({ item, node: node ?? undefined })),
    [inventory.items, node],
  )

  const dialogClass = viewMode === 'gallery'
    ? 'sm:max-w-7xl w-[95vw] max-h-[92vh] flex flex-col'
    : 'sm:max-w-lg'

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className={dialogClass} showCloseButton>
        <DialogHeader className="shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Inventory{nodeName ? `: ${nodeName}` : ''}</DialogTitle>
              <DialogDescription>Manage items stored inside this container.</DialogDescription>
            </div>
            <div className="flex items-center gap-1">
              <button
                className={cn(
                  'rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent',
                  viewMode === 'list' && 'bg-accent text-foreground',
                )}
                onClick={() => setViewMode('list')}
                title="List view"
                type="button"
              >
                <List className="h-4 w-4" />
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
                <LayoutGrid className="h-4 w-4" />
              </button>
              <div className="mx-1 h-4 w-px bg-border" />
              <button
                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                onClick={handleFocusNode}
                title="Focus container in 3D view"
                type="button"
              >
                <Crosshair className="h-4 w-4" />
              </button>
            </div>
          </div>
        </DialogHeader>

        {viewMode === 'gallery' ? (
          <div className="flex-1 overflow-y-auto py-2">
            <InventoryGallery
              emptyMessage="No items in this container yet."
              items={galleryItems}
            />
          </div>
        ) : (
          <div className="flex max-h-[50vh] flex-col gap-3 overflow-y-auto py-2">
            {inventory.items.length === 0 && !isAdding && (
              <div className="flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground">
                <Package className="h-8 w-8 opacity-40" />
                <p className="text-sm">No items in this container yet.</p>
              </div>
            )}

            {inventory.items.map((item) =>
              editingId === item.id ? (
                <InventoryItemForm
                  initial={item}
                  key={item.id}
                  onCancel={resetDraft}
                  onSave={(draft) => handleUpdate(item.id, draft)}
                />
              ) : (
                <InventoryItemCard
                  item={item}
                  key={item.id}
                  onDelete={handleDelete}
                  onEdit={() => {
                    setIsAdding(false)
                    setEditingId(item.id)
                  }}
                />
              ),
            )}

            {isAdding && <InventoryItemForm onCancel={resetDraft} onSave={handleAdd} />}
          </div>
        )}

        {!isAdding && !editingId && (
          <div className="flex justify-end pt-2">
            <Button onClick={() => setIsAdding(true)} size="sm" variant="outline">
              <Plus className="mr-1 h-4 w-4" />
              Add item
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
