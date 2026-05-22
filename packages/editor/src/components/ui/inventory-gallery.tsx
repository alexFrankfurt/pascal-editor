'use client'

import type { AnyNode, AnyNodeId, InventoryItem } from '@pascal-app/core'
import { Package, Crosshair, ImageIcon } from 'lucide-react'
import { useMemo, useState, useCallback } from 'react'
import { Lightbox } from './lightbox'
import { cn } from '../../lib/utils'

interface GalleryItem {
  item: InventoryItem
  node?: AnyNode
}

interface InventoryGalleryProps {
  items: GalleryItem[]
  onNavigate?: (nodeId: AnyNodeId) => void
  emptyMessage?: string
  className?: string
}

function getNodeDisplayName(node: AnyNode): string {
  if (node.name?.trim()) return node.name.trim()
  const label = node.type.charAt(0).toUpperCase() + node.type.slice(1)
  const shortId = node.id.slice(-4)
  return `${label} (${shortId})`
}

export function InventoryGallery({
  items,
  onNavigate,
  emptyMessage = 'No items to display.',
  className,
}: InventoryGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  const images = useMemo(
    () =>
      items
        .filter((g) => g.item.imageUrl)
        .map((g) => ({
          src: g.item.imageUrl!,
          alt: g.item.name,
        })),
    [items],
  )

  const openLightbox = useCallback(
    (item: InventoryItem) => {
      const idx = images.findIndex((img) => img.src === item.imageUrl)
      if (idx >= 0) {
        setLightboxIndex(idx)
        setLightboxOpen(true)
      }
    },
    [images],
  )

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
        <Package className="h-10 w-10 opacity-40" />
        <p className="text-sm">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <>
      <div
        className={cn(
          'grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5',
          className,
        )}
      >
        {items.map(({ item, node }) => (
          <div
            className="group flex flex-col overflow-hidden rounded-lg border border-border/50 bg-[#2C2C2E] transition-colors hover:border-border"
            key={item.id}
          >
            {/* Image area */}
            <button
              className="relative flex aspect-[3/4] w-full items-center justify-center overflow-hidden bg-[#3e3e3e] transition-colors hover:bg-[#4a4a4a]"
              onClick={() => item.imageUrl && openLightbox(item)}
              type="button"
            >
              {item.imageUrl ? (
                <img
                  alt={item.name}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  src={item.imageUrl}
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <ImageIcon className="h-12 w-12 opacity-40" />
                  <span className="text-xs">No image</span>
                </div>
              )}
              {item.quantity !== undefined && item.quantity > 1 && (
                <span className="absolute top-2 right-2 rounded-md bg-primary/90 px-2 py-0.5 font-mono text-primary-foreground text-sm">
                  ×{item.quantity}
                </span>
              )}
            </button>

            {/* Info area */}
            <div className="flex flex-col gap-1.5 p-3">
              <div className="flex items-start justify-between gap-1">
                <span className="truncate font-medium text-base" title={item.name}>
                  {item.name}
                </span>
              </div>

              {node && (
                <span className="truncate text-muted-foreground text-sm" title={getNodeDisplayName(node)}>
                  {getNodeDisplayName(node)}
                </span>
              )}

              {item.description && (
                <p className="line-clamp-2 text-muted-foreground text-sm">{item.description}</p>
              )}

              {onNavigate && node && (
                <button
                  className="mt-1 flex items-center justify-center gap-1.5 rounded-md bg-accent/50 py-1.5 text-sm text-foreground transition-colors hover:bg-accent"
                  onClick={() => onNavigate(node.id)}
                  type="button"
                >
                  <Crosshair className="h-3.5 w-3.5" />
                  Focus container
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <Lightbox
        currentIndex={lightboxIndex}
        images={images}
        onClose={() => setLightboxOpen(false)}
        onNavigate={setLightboxIndex}
        open={lightboxOpen}
      />
    </>
  )
}
