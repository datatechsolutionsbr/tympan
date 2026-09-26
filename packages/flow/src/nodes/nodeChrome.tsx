// Pieces every node kind composes around GraphNodeCard: kind presentation
// from the render catalog, the floating per-node tool strip, and the status
// mark of read-only previews.

import type { ReactNode } from 'react'
import { Toolbar } from 'react-aria-components'
import { CircleCheck, CircleDashed, CircleX, History, LoaderCircle, SkipForward, Undo2 } from 'lucide-react'
import { Button, type IconComponent } from '@fakhir/ui'
import { humaniseKey, useRenderCatalog, type RenderCatalog } from '../catalog/RenderCatalog'
import type { ToneName } from '../catalog/palette'
import { defineLabels, useLabels } from '../internal/labels'
import type { FlowNode, LayoutDirection, RunStatus } from '../model/types'
import { portsOf, type PlacedPort } from './ports'

export interface KindPresentation {
  catalog: RenderCatalog
  kindLabel: string
  category: string | undefined
  icon: IconComponent
  tone: ToneName
  title: string
  description: string | undefined
  inputs: PlacedPort[]
  outputs: PlacedPort[]
}

/** Label, icon, tone and ports of a node: per-instance identity > node label > catalog > kind key. */
export function useKindPresentation(node: FlowNode, direction: LayoutDirection, fallbackTitle?: string): KindPresentation {
  const catalog = useRenderCatalog()
  const entry = catalog.entry(node.kind)
  const identity = catalog.identity(node.kind, node.data)
  const label = typeof node.data.label === 'string' && node.data.label.trim() ? node.data.label : undefined
  const { inputs, outputs } = portsOf(node, catalog, direction)
  return {
    catalog,
    kindLabel: entry?.label ?? humaniseKey(node.kind),
    category: entry?.category,
    icon: identity?.icon ?? catalog.icon(node.kind),
    tone: catalog.tone(node.kind),
    title: identity?.title ?? label ?? fallbackTitle ?? entry?.label ?? humaniseKey(node.kind),
    description: identity?.description ?? (typeof node.data.description === 'string' ? node.data.description : undefined),
    inputs,
    outputs,
  }
}

export interface NodeToolAction {
  id: string
  label: string
  icon: IconComponent
  onPress: () => void
  tone?: 'default' | 'danger'
}

/**
 * Tool strip above a node (APG Toolbar): visible on hover, selection and
 * keyboard focus inside the node, always in the DOM so Tab reaches it.
 */
export function NodeTools({ label, actions }: { label: string; actions: NodeToolAction[] }) {
  if (!actions.length) return null
  return (
    <Toolbar aria-label={label} className="fk-node-tools" data-fk-no-drag="" data-fk-above="">
      {actions.map((a) => (
        <Button key={a.id} variant={a.tone === 'danger' ? 'danger' : 'quiet'} size="compact" iconOnly accessibleLabel={a.label} leadingIcon={<a.icon />} onPress={a.onPress} />
      ))}
    </Toolbar>
  )
}

export interface PreviewStatusLabels {
  running: string
  completed: string
  failed: string
  skipped: string
  restored: string
  'served-from-history': string
  unknown: string
}

export const previewStatusLabels = defineLabels<PreviewStatusLabels>('previewStatus', {
  en: { running: 'running', completed: 'completed', failed: 'failed', skipped: 'skipped', restored: 'restored', 'served-from-history': 'from history', unknown: 'not run' },
  'pt-BR': { running: 'em execução', completed: 'concluída', failed: 'falhou', skipped: 'ignorada', restored: 'restaurada', 'served-from-history': 'do histórico', unknown: 'não executada' },
  es: { running: 'en ejecución', completed: 'completado', failed: 'falló', skipped: 'omitido', restored: 'restaurado', 'served-from-history': 'del historial', unknown: 'no ejecutado' },
})
export const defaultPreviewStatusLabels = previewStatusLabels.bundles.en

const STATUS_GLYPHS: Record<RunStatus, IconComponent> = {
  running: LoaderCircle,
  completed: CircleCheck,
  failed: CircleX,
  skipped: SkipForward,
  restored: Undo2,
  'served-from-history': History,
  unknown: CircleDashed,
}

/** Word for a preview status (goes into the node's accessible name). */
export function usePreviewStatusWord(status: RunStatus | undefined, labels?: Partial<PreviewStatusLabels>): string | null {
  const l = useLabels(previewStatusLabels, labels)
  return status ? l[status] : null
}

/** Glyph plus word, never colour alone. */
export function PreviewStatusMark({ status, labels }: { status: RunStatus; labels?: Partial<PreviewStatusLabels> }): ReactNode {
  const l = useLabels(previewStatusLabels, labels)
  const Glyph = STATUS_GLYPHS[status]
  return (
    <span className="fk-preview-status" data-status={status} aria-hidden="true">
      <Glyph focusable="false" />
      {l[status]}
    </span>
  )
}
