// AlignmentGuides: while nodes move (pointer drag or arrow keys), show a
// horizontal and/or vertical line where an edge or centre lines up with
// another node. Detection is geometry/guides (findGuides); this file holds the
// hook, the decorative overlay and the keyboard announcement.

import { useCallback, useRef, useState } from 'react'
import { findGuides, GUIDE_THRESHOLD, NO_GUIDES, type GuidePositions } from '../geometry/guides'
import { useAnnounce } from '../internal/Announcer'
import { defineLabels, fill, useFlowLocale, useLabels } from '../internal/labels'
import type { Rect } from '../model/types'

export interface AlignmentGuidesLabels {
  aligned: string
}

export const alignmentGuidesLabels = defineLabels<AlignmentGuidesLabels>('alignmentGuides', {
  en: { aligned: 'aligned with {name}' },
  'pt-BR': { aligned: 'alinhado com {name}' },
  es: { aligned: 'alineado con {name}' },
})
export const defaultAlignmentGuidesLabels = alignmentGuidesLabels.bundles.en

export interface GuideCandidate {
  id: string
  rect: Rect
}

export interface UseAlignmentGuidesOptions {
  threshold?: number
  /** Node name for the keyboard announcement. */
  nameOf?: (id: string) => string
  labels?: Partial<AlignmentGuidesLabels>
}

export interface AlignmentGuidesApi {
  guides: GuidePositions
  /**
   * Returns the drag handler for the current graph: call it with the moving
   * reference box (the node under the pointer), its id and every dragged id.
   * Dragged nodes are never compared with each other.
   */
  createDragHandler: (all: readonly GuideCandidate[]) => (moving: Rect, referenceId: string, draggedIds: readonly string[]) => void
  onDragStop: () => void
  /** Same detection after an arrow-key move; announces "aligned with …" when a guide appears. */
  onKeyboardMove: (all: readonly GuideCandidate[], moving: Rect, movedId: string) => void
}

export function useAlignmentGuides(options: UseAlignmentGuidesOptions = {}): AlignmentGuidesApi {
  const { threshold = GUIDE_THRESHOLD, nameOf } = options
  const l = useLabels(alignmentGuidesLabels, options.labels)
  const { locale } = useFlowLocale()
  const announce = useAnnounce()
  const [guides, setGuides] = useState<GuidePositions>(NO_GUIDES)
  const lastAnnounced = useRef<string | null>(null)

  const detect = useCallback(
    (all: readonly GuideCandidate[], moving: Rect, excluded: ReadonlySet<string>) => {
      const m = findGuides(
        moving,
        all.filter((c) => !excluded.has(c.id)),
        threshold,
      )
      setGuides((prev) => (prev.horizontal === m.horizontal && prev.vertical === m.vertical ? prev : { horizontal: m.horizontal, vertical: m.vertical }))
      return m
    },
    [threshold],
  )

  const createDragHandler = useCallback(
    (all: readonly GuideCandidate[]) => (moving: Rect, referenceId: string, draggedIds: readonly string[]) => {
      detect(all, moving, new Set([referenceId, ...draggedIds]))
    },
    [detect],
  )

  const onDragStop = useCallback(() => {
    setGuides(NO_GUIDES)
    lastAnnounced.current = null
  }, [])

  const onKeyboardMove = useCallback(
    (all: readonly GuideCandidate[], moving: Rect, movedId: string) => {
      const m = detect(all, moving, new Set([movedId]))
      const partner = m.verticalWith ?? m.horizontalWith
      if (partner && partner !== lastAnnounced.current) {
        announce(fill(l.aligned, { name: nameOf?.(partner) ?? partner }, locale))
      }
      lastAnnounced.current = partner
    },
    [detect, announce, l, nameOf, locale],
  )

  return { guides, createDragHandler, onDragStop, onKeyboardMove }
}

/** Reach of a guide line in canvas units (it spans the whole canvas). */
const REACH = 100_000

/** Decorative overlay in canvas coordinates; renders nothing without guides. */
export function AlignmentGuidesOverlay({ guides }: { guides: GuidePositions }) {
  if (guides.horizontal === null && guides.vertical === null) return null
  return (
    <svg className="ty-alignment-guides" aria-hidden="true" focusable="false">
      {guides.vertical !== null ? <line className="ty-alignment-guides__line" data-axis="vertical" x1={guides.vertical} x2={guides.vertical} y1={-REACH} y2={REACH} /> : null}
      {guides.horizontal !== null ? <line className="ty-alignment-guides__line" data-axis="horizontal" x1={-REACH} x2={REACH} y1={guides.horizontal} y2={guides.horizontal} /> : null}
    </svg>
  )
}
