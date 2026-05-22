'use client'

import { useCallback, useEffect } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../../lib/utils'

interface LightboxProps {
  open: boolean
  onClose: () => void
  images: { src: string; alt: string }[]
  currentIndex: number
  onNavigate?: (index: number) => void
}

export function Lightbox({ open, onClose, images, currentIndex, onNavigate }: LightboxProps) {
  const hasPrev = currentIndex > 0
  const hasNext = currentIndex < images.length - 1

  const goPrev = useCallback(() => {
    if (hasPrev && onNavigate) onNavigate(currentIndex - 1)
  }, [hasPrev, onNavigate, currentIndex])

  const goNext = useCallback(() => {
    if (hasNext && onNavigate) onNavigate(currentIndex + 1)
  }, [hasNext, onNavigate, currentIndex])

  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft') goPrev()
      else if (e.key === 'ArrowRight') goNext()
    }
    window.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose, goPrev, goNext])

  if (!open || images.length === 0) return null

  const current = images[currentIndex]
  if (!current) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {/* Close button */}
      <button
        className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
        onClick={onClose}
        type="button"
      >
        <X className="h-6 w-6" />
      </button>

      {/* Prev */}
      {hasPrev && (
        <button
          className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
          onClick={goPrev}
          type="button"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}

      {/* Image */}
      <div className="flex max-h-[85vh] max-w-[85vw] flex-col items-center gap-3">
        <img
          alt={current.alt}
          className="max-h-[75vh] max-w-full rounded-lg object-contain shadow-2xl"
          src={current.src}
        />
        <span className="text-center text-sm text-white/80">{current.alt}</span>
        {images.length > 1 && (
          <span className="text-xs text-white/50">
            {currentIndex + 1} / {images.length}
          </span>
        )}
      </div>

      {/* Next */}
      {hasNext && (
        <button
          className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
          onClick={goNext}
          type="button"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}
    </div>
  )
}
