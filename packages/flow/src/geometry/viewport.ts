import type { Point, Rect, Size, Viewport } from '../model/types'

export interface ZoomLimits {
  min: number
  max: number
}

export const DEFAULT_ZOOM_LIMITS: Readonly<ZoomLimits> = Object.freeze({ min: 0.2, max: 2.5 })

/** Zoom steps used by the zoom in / zoom out tools (a readable ladder, not a factor). */
export const ZOOM_LADDER = [0.2, 0.25, 0.33, 0.5, 0.67, 0.75, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2, 2.5] as const

export function clampZoom(z: number, limits: ZoomLimits = DEFAULT_ZOOM_LIMITS): number {
  return Math.min(limits.max, Math.max(limits.min, z))
}

export function screenToCanvas(v: Viewport, p: Point): Point {
  return { x: (p.x - v.x) / v.zoom, y: (p.y - v.y) / v.zoom }
}

export function canvasToScreen(v: Viewport, p: Point): Point {
  return { x: p.x * v.zoom + v.x, y: p.y * v.zoom + v.y }
}

/** New viewport with zoom `z` that keeps the canvas point under `pivot` (screen) still. */
export function zoomAt(v: Viewport, z: number, pivot: Point, limits?: ZoomLimits): Viewport {
  const zoom = clampZoom(z, limits)
  const anchor = screenToCanvas(v, pivot)
  return { zoom, x: pivot.x - anchor.x * zoom, y: pivot.y - anchor.y * zoom }
}

/** Next step of the zoom ladder above (`+1`) or below (`-1`) the current zoom. */
export function ladderStep(current: number, direction: 1 | -1, limits?: ZoomLimits): number {
  const eps = 0.001
  const steps = direction > 0 ? ZOOM_LADDER.filter((s) => s > current + eps) : [...ZOOM_LADDER].reverse().filter((s) => s < current - eps)
  return clampZoom(steps[0] ?? current, limits)
}

/** Viewport that shows `bounds` centred in a container, with `padding` screen px around it. */
export function fitBounds(bounds: Rect | null, container: Size, padding = 48, limits: ZoomLimits = DEFAULT_ZOOM_LIMITS, maxFitZoom = 1): Viewport {
  if (!bounds || container.width <= 0 || container.height <= 0) return { x: 0, y: 0, zoom: 1 }
  const availW = Math.max(1, container.width - padding * 2)
  const availH = Math.max(1, container.height - padding * 2)
  const raw = Math.min(availW / Math.max(1, bounds.width), availH / Math.max(1, bounds.height))
  const zoom = clampZoom(Math.min(raw, maxFitZoom), limits)
  const x = (container.width - bounds.width * zoom) / 2 - bounds.x * zoom
  const y = (container.height - bounds.height * zoom) / 2 - bounds.y * zoom
  return { x, y, zoom }
}

/** Viewport shifted just enough to bring `target` (canvas rect) inside the container, with a margin. */
export function revealRect(v: Viewport, target: Rect, container: Size, margin = 32): Viewport {
  const left = target.x * v.zoom + v.x
  const top = target.y * v.zoom + v.y
  const right = left + target.width * v.zoom
  const bottom = top + target.height * v.zoom
  let dx = 0
  let dy = 0
  if (left < margin) dx = margin - left
  else if (right > container.width - margin) dx = container.width - margin - right
  if (top < margin) dy = margin - top
  else if (bottom > container.height - margin) dy = container.height - margin - bottom
  if (!dx && !dy) return v
  return { ...v, x: v.x + dx, y: v.y + dy }
}

/** The part of the canvas currently on screen. */
export function visibleArea(v: Viewport, container: Size): Rect {
  return { x: -v.x / v.zoom, y: -v.y / v.zoom, width: container.width / v.zoom, height: container.height / v.zoom }
}
