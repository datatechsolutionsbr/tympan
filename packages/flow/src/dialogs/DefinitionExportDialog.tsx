// DefinitionExportDialog: shows a flow's portable definition (metadata plus
// graph), copies the whole text or downloads it as a file.

import { useEffect, useMemo, useRef, useState } from 'react'
import { Button, InlineNotice } from '@datatechsolutions/tympan'
import { SectionedModal } from '../internal/SectionedModal'
import { defineLabels, fill, useFlowLocale, useLabels } from '../internal/labels'
import type { FlowConnector, FlowNode, Viewport } from '../model/types'

export interface ExportableGraph {
  nodes: FlowNode[]
  connectors: FlowConnector[]
  viewport: Viewport
}

export interface FlowDefinitionMeta {
  name: string
  description?: string
  version: number
}

export interface DefinitionExportDialogLabels {
  title: string
  description: string
  name: string
  version: string
  nodes: string
  connectors: string
  preview: string
  more: string
  copy: string
  copied: string
  copyFailed: string
  download: string
}

export const definitionExportDialogLabels = defineLabels<DefinitionExportDialogLabels>('DefinitionExportDialog', {
  en: {
    title: 'Export definition',
    description: 'A portable copy of this flow that another project can import.',
    name: 'Name',
    version: 'Version',
    nodes: 'Steps',
    connectors: 'Connections',
    preview: 'Definition preview',
    more: '… {count, plural, one {# more line} other {# more lines}}',
    copy: 'Copy',
    copied: 'Copied',
    copyFailed: 'Could not copy. Select the text in the preview and copy it by hand.',
    download: 'Download',
  },
  'pt-BR': {
    title: 'Exportar definição',
    description: 'Uma cópia portátil deste fluxo, que outro projeto pode importar.',
    name: 'Nome',
    version: 'Versão',
    nodes: 'Passos',
    connectors: 'Conexões',
    preview: 'Prévia da definição',
    more: '… {count, plural, one {mais # linha} other {mais # linhas}}',
    copy: 'Copiar',
    copied: 'Copiado',
    copyFailed: 'Não foi possível copiar. Selecione o texto da prévia e copie manualmente.',
    download: 'Baixar',
  },
  es: {
    title: 'Exportar definición',
    description: 'Una copia portátil de este flujo que otro proyecto puede importar.',
    name: 'Nombre',
    version: 'Versión',
    nodes: 'Pasos',
    connectors: 'Conexiones',
    preview: 'Vista previa de la definición',
    more: '… {count, plural, one {# línea más} other {# líneas más}}',
    copy: 'Copiar',
    copied: 'Copiado',
    copyFailed: 'No se pudo copiar. Selecciona el texto de la vista previa y cópialo a mano.',
    download: 'Descargar',
  },
})
export const defaultDefinitionExportDialogLabels = definitionExportDialogLabels.bundles.en

/** The portable definition: metadata, export time and the graph, with stable indentation. */
export function flowDefinitionText(flow: FlowDefinitionMeta, graph: ExportableGraph, exportedAt: Date = new Date()): string {
  const definition = {
    name: flow.name,
    description: flow.description ?? '',
    version: flow.version,
    exportedAt: exportedAt.toISOString(),
    graph: { nodes: graph.nodes, connectors: graph.connectors, viewport: graph.viewport },
  }
  return JSON.stringify(definition, null, 2)
}

/** File name from the flow name and version, without characters file systems refuse. */
export function definitionFileName(flow: FlowDefinitionMeta): string {
  // Letters of any script stay; only characters file systems refuse are removed.
  const base = flow.name
    .normalize('NFC')
    .replace(/[<>:"/\\|?*\u0000-\u001f]+/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/^\.+/, '')
  return `${base || 'flow'}-v${flow.version}.json`
}

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // fall through to the selection copy
  }
  try {
    const area = document.createElement('textarea')
    area.value = text
    area.setAttribute('readonly', '')
    area.className = 'ty-visually-hidden'
    document.body.append(area)
    area.select()
    const ok = typeof document.execCommand === 'function' && document.execCommand('copy')
    area.remove()
    return !!ok
  } catch {
    return false
  }
}

export interface DefinitionExportDialogProps {
  open: boolean
  onClose: () => void
  flow: FlowDefinitionMeta
  graph: ExportableGraph
  previewLineLimit?: number
  /** Clock for the export time (tests). */
  now?: () => Date
  labels?: Partial<DefinitionExportDialogLabels>
}

const COPIED_MS = 2000

export function DefinitionExportDialog({ open, onClose, flow, graph, previewLineLimit = 40, now, labels }: DefinitionExportDialogProps) {
  const l = useLabels(definitionExportDialogLabels, labels)
  const { locale, direction } = useFlowLocale()
  const n = (v: number) => new Intl.NumberFormat(locale).format(v)
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const text = useMemo(() => (open ? flowDefinitionText(flow, graph, now?.() ?? new Date()) : ''), [open, flow, graph, now])
  const lines = text.split('\n')
  const shown = lines.slice(0, previewLineLimit)
  const hidden = lines.length - shown.length

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current)
  }, [])
  useEffect(() => {
    if (!open) setCopyState('idle')
  }, [open])

  const copy = async () => {
    const ok = await copyText(text)
    setCopyState(ok ? 'copied' : 'failed')
    if (timer.current) clearTimeout(timer.current)
    if (ok) timer.current = setTimeout(() => setCopyState('idle'), COPIED_MS)
  }
  const download = () => {
    const blob = new Blob([text], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = definitionFileName(flow)
    a.className = 'ty-visually-hidden'
    document.body.append(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 0)
  }

  return (
    <SectionedModal
      isOpen={open}
      onOpenChange={(o) => {
        if (!o) onClose()
      }}
      title={l.title}
      subtitle={l.description}
      width="wide"
      className="ty-definition-export"
      footer={
        <>
          <Button variant="secondary" onPress={() => void copy()}>
            {copyState === 'copied' ? l.copied : l.copy}
          </Button>
          <Button variant="primary" onPress={download}>
            {l.download}
          </Button>
        </>
      }
    >
      <dl className="ty-definition-export__meta" dir={direction}>
        <div>
          <dt>{l.name}</dt>
          <dd>{flow.name}</dd>
        </div>
        <div>
          <dt>{l.version}</dt>
          <dd className="ty-definition-export__mono">{n(flow.version)}</dd>
        </div>
        <div>
          <dt>{l.nodes}</dt>
          <dd className="ty-definition-export__mono">{n(graph.nodes.length)}</dd>
        </div>
        <div>
          <dt>{l.connectors}</dt>
          <dd className="ty-definition-export__mono">{n(graph.connectors.length)}</dd>
        </div>
      </dl>
      <pre className="ty-definition-export__preview" dir="ltr" tabIndex={0} role="region" aria-label={l.preview}>
        {shown.join('\n')}
        {hidden > 0 ? `\n${fill(l.more, { count: hidden }, locale)}` : ''}
      </pre>
      {copyState === 'failed' ? (
        <InlineNotice tone="danger" urgency="assertive">
          {l.copyFailed}
        </InlineNotice>
      ) : null}
      <p className="ty-visually-hidden" role="status" aria-live="polite">
        {copyState === 'copied' ? l.copied : ''}
      </p>
    </SectionedModal>
  )
}
