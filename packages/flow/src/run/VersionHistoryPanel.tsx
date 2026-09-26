// VersionHistoryPanel: the published versions of a flow, newest first; each
// can be previewed read-only or restored as the working draft (the host
// confirms). The live version is marked by a word and a border.

import { useEffect, useState } from 'react'
import { ActorChip, Button, InlineNotice, Skeleton } from '@fakhir/design-system'
import { DockedPanel } from '../internal/DockedPanel'
import { formatDateTime } from '../internal/format'
import { defineLabels, fill, useFlowLocale, useLabels } from '../internal/labels'
import type { RunActor } from './types'

export interface FlowVersion {
  number: number
  publishedAt: string
  publishedBy: RunActor
  nodeCount: number
  connectorCount: number
}

export interface VersionHistoryPanelLabels {
  title: string
  close: string
  loading: string
  error: string
  retry: string
  empty: string
  current: string
  version: string
  publishedBy: string
  counts: string
  preview: string
  restore: string
}

export const versionHistoryPanelLabels = defineLabels<VersionHistoryPanelLabels>('VersionHistoryPanel', {
  en: {
    title: 'Versions',
    close: 'Close versions',
    loading: 'Loading versions',
    error: 'Versions could not be loaded: {message}',
    retry: 'Try again',
    empty: 'No version has been published yet.',
    current: 'current',
    version: 'Version {number, number}',
    publishedBy: 'Published by',
    counts: '{nodes, plural, one {# node} other {# nodes}}, {connectors, plural, one {# connector} other {# connectors}}',
    preview: 'Preview version {number, number}',
    restore: 'Restore version {number, number}',
  },
  'pt-BR': {
    title: 'Versões',
    close: 'Fechar versões',
    loading: 'Carregando versões',
    error: 'Não foi possível carregar as versões: {message}',
    retry: 'Tentar de novo',
    empty: 'Nenhuma versão foi publicada ainda.',
    current: 'atual',
    version: 'Versão {number, number}',
    publishedBy: 'Publicada por',
    counts: '{nodes, plural, one {# nó} other {# nós}}, {connectors, plural, one {# conexão} other {# conexões}}',
    preview: 'Ver versão {number, number}',
    restore: 'Restaurar versão {number, number}',
  },
  es: {
    title: 'Versiones',
    close: 'Cerrar versiones',
    loading: 'Cargando versiones',
    error: 'No se pudieron cargar las versiones: {message}',
    retry: 'Reintentar',
    empty: 'Aún no se ha publicado ninguna versión.',
    current: 'actual',
    version: 'Versión {number, number}',
    publishedBy: 'Publicada por',
    counts: '{nodes, plural, one {# nodo} other {# nodos}}, {connectors, plural, one {# conexión} other {# conexiones}}',
    preview: 'Ver versión {number, number}',
    restore: 'Restaurar versión {number, number}',
  },
})

export const defaultVersionHistoryPanelLabels: VersionHistoryPanelLabels = versionHistoryPanelLabels.bundles.en

export interface VersionHistoryPanelProps {
  open: boolean
  onClose: () => void
  flowId: string
  currentVersion: number
  loadVersions?: (flowId: string) => Promise<FlowVersion[]>
  onPreview: (version: FlowVersion) => void
  onRestore: (version: FlowVersion) => void
  labels?: Partial<VersionHistoryPanelLabels>
  returnFocusTo?: HTMLElement | null
}

type State = { kind: 'loading' } | { kind: 'error'; message: string } | { kind: 'ready'; versions: FlowVersion[] }

export function VersionHistoryPanel(props: VersionHistoryPanelProps) {
  const { open, onClose, flowId, currentVersion, loadVersions, onPreview, onRestore, returnFocusTo } = props
  const l = useLabels(versionHistoryPanelLabels, props.labels)
  const { locale } = useFlowLocale()
  const [state, setState] = useState<State>({ kind: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!open) return
    if (!loadVersions) {
      setState({ kind: 'ready', versions: [] })
      return
    }
    let live = true
    setState({ kind: 'loading' })
    loadVersions(flowId).then(
      (versions) => live && setState({ kind: 'ready', versions: [...versions].sort((a, b) => b.number - a.number) }),
      (e: unknown) => live && setState({ kind: 'error', message: e instanceof Error ? e.message : String(e) }),
    )
    return () => {
      live = false
    }
  }, [open, flowId, loadVersions, attempt])

  if (!open) return null

  return (
    <DockedPanel title={l.title} landmark="complementary" onClose={onClose} closeLabel={l.close} returnFocusTo={returnFocusTo ?? null} busy={state.kind === 'loading'} className="fk-versions">
      <p className="fk-visually-hidden" role="status" aria-live="polite">
        {state.kind === 'loading' ? l.loading : state.kind === 'error' ? fill(l.error, { message: state.message }, locale) : ''}
      </p>
      {state.kind === 'loading' ? (
        <div aria-busy="true">
          <Skeleton lines={3} />
        </div>
      ) : state.kind === 'error' ? (
        <InlineNotice
          tone="danger"
          urgency="none"
          actions={
            <Button variant="secondary" size="compact" onPress={() => setAttempt((a) => a + 1)}>
              {l.retry}
            </Button>
          }
        >
          {fill(l.error, { message: state.message }, locale)}
        </InlineNotice>
      ) : state.versions.length === 0 ? (
        <p className="fk-run-empty">{l.empty}</p>
      ) : (
        <ul className="fk-versions__list">
          {state.versions.map((v) => {
            const current = v.number === currentVersion
            return (
              <li key={v.number} className="fk-versions__entry" data-current={current ? 'true' : 'false'}>
                <div className="fk-versions__head">
                  <span className="fk-versions__number">{fill(l.version, { number: v.number }, locale)}</span>
                  {current ? <span className="fk-versions__current">{l.current}</span> : null}
                </div>
                <div className="fk-versions__meta">
                  <span className="fk-visually-hidden">{l.publishedBy}</span>
                  <ActorChip kind={v.publishedBy.kind} name={v.publishedBy.name} compact {...(v.publishedBy.agentKey ? { agentKey: v.publishedBy.agentKey } : {})} {...(v.publishedBy.model ? { model: v.publishedBy.model } : {})} />
                  <time dateTime={v.publishedAt}>{formatDateTime(v.publishedAt, locale)}</time>
                  <span>{fill(l.counts, { nodes: v.nodeCount, connectors: v.connectorCount }, locale)}</span>
                </div>
                <div className="fk-versions__actions">
                  <Button variant="secondary" size="compact" onPress={() => onPreview(v)}>
                    {fill(l.preview, { number: v.number }, locale)}
                  </Button>
                  {current ? null : (
                    <Button variant="quiet" size="compact" onPress={() => onRestore(v)}>
                      {fill(l.restore, { number: v.number }, locale)}
                    </Button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </DockedPanel>
  )
}
