// Source marks: optional product marks a host registers per dialect (from an
// openly licensed set or assets it holds a licence for). The library ships
// none; without a mark the neutral database glyph is shown. Marks are always
// decorative: the dialect name is written as text next to them.
// Stand-in for the wave-4 ThirdPartyMarkSlot until the design system has it.

import { useState, useSyncExternalStore } from 'react'
import { Database } from 'lucide-react'

export interface SourceMark {
  /** Image address (SVG or raster). */
  src: string
  /** Licence note for the host's notices (not shown). */
  licence?: string
}

let marks = new Map<string, SourceMark>()
const listeners = new Set<() => void>()
let version = 0

/** Registers marks by dialect key (lower case). Later calls replace earlier ones. */
export function registerSourceMarks(map: Record<string, SourceMark>): void {
  marks = new Map([...marks, ...Object.entries(map).map(([k, v]) => [k.toLowerCase(), v] as const)])
  version++
  for (const l of listeners) l()
}

export function clearSourceMarks(): void {
  marks = new Map()
  version++
  for (const l of listeners) l()
}

export function sourceMarkFor(dialect: string | undefined): SourceMark | undefined {
  return dialect ? marks.get(dialect.toLowerCase()) : undefined
}

const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

/** The mark for a dialect, or the neutral glyph; aria-hidden in both cases. */
export function SourceMarkSlot({ dialect }: { dialect?: string }) {
  useSyncExternalStore(subscribe, () => version, () => version)
  const mark = sourceMarkFor(dialect)
  const [failed, setFailed] = useState<string | null>(null)
  if (mark && failed !== mark.src) {
    return <img className="fk-source-mark" src={mark.src} alt="" aria-hidden="true" data-mark="registered" onError={() => setFailed(mark.src)} />
  }
  return <Database className="fk-source-mark" aria-hidden="true" focusable="false" data-mark="fallback" />
}
