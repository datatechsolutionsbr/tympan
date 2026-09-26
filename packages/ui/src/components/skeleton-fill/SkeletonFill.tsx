import type { CSSProperties } from 'react'

export type SkeletonFillVariant = 'surface' | 'on-accent'
export type SkeletonBlockShape = 'line' | 'block' | 'circle' | 'pill'
/** A spacing step of §2.1 (1–9), or any CSS length or percentage. */
export type SkeletonSize = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | (string & {})

/**
 * Style hook shared by every placeholder: spread the result on any element
 * to give it the skeleton fill and pulse (the stylesheet selects on it).
 */
export function skeletonFill(variant: SkeletonFillVariant = 'surface', animated = true): Record<string, string> {
  const hook: Record<string, string> = { 'data-ty-skeleton': variant }
  if (!animated) hook['data-ty-skeleton-static'] = ''
  return hook
}

function sizeValue(size: SkeletonSize | undefined): string | undefined {
  if (size === undefined) return undefined
  return typeof size === 'number' ? `var(--ty-space-${size})` : size
}

export interface SkeletonBlockProps {
  shape?: SkeletonBlockShape
  variant?: SkeletonFillVariant
  width?: SkeletonSize
  height?: SkeletonSize
  animated?: boolean
  className?: string
}

/** One placeholder shape with the shared fill (spec: wave-4/skeleton-fill.md). Always hidden from assistive technology. */
export function SkeletonBlock({ shape = 'line', variant, width, height, animated = true, className }: SkeletonBlockProps) {
  const dims: Record<string, string> = {}
  const w = sizeValue(width)
  const h = sizeValue(height)
  if (w) dims['--ty-skeleton-w'] = w
  if (h) dims['--ty-skeleton-h'] = h
  return (
    <span
      aria-hidden="true"
      className={className ? `ty-skeleton-block ${className}` : 'ty-skeleton-block'}
      data-shape={shape}
      style={dims as CSSProperties}
      {...skeletonFill(variant, animated)}
    />
  )
}
