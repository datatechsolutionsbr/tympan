// DataSourceNode (wave-4 spec): reads rows from a connected source and
// summarises what it will read. The dialect is always written as text; a
// host-registered mark is optional decoration.

import { useId } from 'react'
import { CircleCheck, CircleSlash } from 'lucide-react'
import { Tag } from '@fakhir/ui'
import { defineLabels, fill, useFlowLocale, useLabels } from '../internal/labels'
import type { FlowNode, LayoutDirection } from '../model/types'
import { ConnectionPorts } from './ConnectionPorts'
import { GraphNodeCard, NodeBadge, type CardDensity } from './GraphNodeCard'
import { useKindPresentation } from './nodeChrome'
import { NodeRunIndicator, useRunWords } from './NodeRunIndicator'
import { SourceMarkSlot } from './sourceMarks'

export interface DataSourceConfig {
  sourceId: string
  dialect?: string
  table: string
  selectedColumns?: string[]
  filters?: unknown[]
  limit?: number
}

export interface DataSourceNodeLabels {
  kind: string
  title: string
  name: string
  detail: string
  connected: string
  notConnected: string
  sample: string
  columns: string
  filters: string
  limit: string
  notConfigured: string
  remove: string
}

export const dataSourceNodeLabels = defineLabels<DataSourceNodeLabels>('dataSourceNode', {
  en: {
    kind: 'data source',
    title: 'Data source',
    name: 'data source: {title}, {dialect}, {table}',
    detail: '{source} · {table}',
    connected: 'connected',
    notConnected: 'not connected',
    sample: 'sample',
    columns: '{count, plural, one {# column} other {# columns}}',
    filters: '{count, plural, one {# filter} other {# filters}}',
    limit: '{count, plural, one {up to # row} other {up to # rows}}',
    notConfigured: 'Choose a connection and a table to read from.',
    remove: 'remove {title}',
  },
  'pt-BR': {
    kind: 'fonte de dados',
    title: 'Fonte de dados',
    name: 'fonte de dados: {title}, {dialect}, {table}',
    detail: '{source} · {table}',
    connected: 'conectada',
    notConnected: 'não conectada',
    sample: 'amostra',
    columns: '{count, plural, one {# coluna} other {# colunas}}',
    filters: '{count, plural, one {# filtro} other {# filtros}}',
    limit: '{count, plural, one {até # linha} other {até # linhas}}',
    notConfigured: 'Escolha uma conexão e uma tabela para ler.',
    remove: 'remover {title}',
  },
  es: {
    kind: 'fuente de datos',
    title: 'Fuente de datos',
    name: 'fuente de datos: {title}, {dialect}, {table}',
    detail: '{source} · {table}',
    connected: 'conectada',
    notConnected: 'no conectada',
    sample: 'muestra',
    columns: '{count, plural, one {# columna} other {# columnas}}',
    filters: '{count, plural, one {# filtro} other {# filtros}}',
    limit: '{count, plural, one {hasta # fila} other {hasta # filas}}',
    notConfigured: 'Elige una conexión y una tabla para leer.',
    remove: 'quitar {title}',
  },
})
export const defaultDataSourceNodeLabels = dataSourceNodeLabels.bundles.en

/** Display name of a dialect: host list, else the key with its first letter capitalised. */
export function dialectDisplayName(key: string | undefined, dialects: readonly { key: string; displayName: string }[] = []): string {
  if (!key) return ''
  const known = dialects.find((d) => d.key.toLowerCase() === key.toLowerCase())
  return known?.displayName ?? key.charAt(0).toUpperCase() + key.slice(1)
}

/** Counts greater than zero, in the order columns, filters, limit. */
export function dataSourceCounts(config: DataSourceConfig, l: DataSourceNodeLabels, locale: string): string[] {
  const out: string[] = []
  const cols = config.selectedColumns?.length ?? 0
  const filters = config.filters?.length ?? 0
  if (cols > 0) out.push(fill(l.columns, { count: cols }, locale))
  if (filters > 0) out.push(fill(l.filters, { count: filters }, locale))
  if (config.limit && config.limit > 0) out.push(fill(l.limit, { count: config.limit }, locale))
  return out
}

export interface DataSourceNodeProps {
  id: string
  config: DataSourceConfig | null
  source?: { name: string; connected?: boolean }
  dialects?: { key: string; displayName: string }[]
  label?: string
  readOnly?: boolean
  density?: CardDensity
  onConfigure?: (id: string) => void
  onRemove?: (id: string) => void
  selected?: boolean
  locked?: boolean
  preview?: boolean
  direction?: LayoutDirection
  labels?: Partial<DataSourceNodeLabels>
}

export function DataSourceNode(props: DataSourceNodeProps) {
  const { id, config, source, dialects = [], readOnly = false, density = 'detailed', onConfigure, onRemove, selected = false, locked = false, preview = false, direction = 'right' } = props
  const l = useLabels(dataSourceNodeLabels, props.labels)
  const { locale } = useFlowLocale()
  const detailId = useId()
  const node: FlowNode = { id, kind: 'datasource', position: { x: 0, y: 0 }, data: {} }
  const k = useKindPresentation(node, direction)
  const run = useRunWords(id)
  const title = props.label ?? l.title
  const configured = !!config && !!config.sourceId && !!config.table
  const dialect = dialectDisplayName(config?.dialect, dialects)
  const counts = config ? dataSourceCounts(config, l, locale) : []
  const showConnection = !readOnly && source?.connected !== undefined
  const connectionWord = source?.connected ? l.connected : l.notConnected
  const canEdit = !preview && !locked
  const name = configured ? fill(l.name, { title, dialect: dialect || '', table: config!.table }, locale) : undefined
  const description = [showConnection ? connectionWord : null, readOnly ? l.sample : null, ...counts, run.words].filter(Boolean).join(', ')

  return (
    <GraphNodeCard
      kind="datasource"
      kindLabel={l.kind}
      title={title}
      {...(configured && density === 'detailed' ? { description: fill(l.detail, { source: source?.name ?? config!.sourceId, table: config!.table }, locale) } : {})}
      icon={<SourceMarkSlot {...(config?.dialect ? { dialect: config.dialect } : {})} />}
      tone={k.tone}
      width="standard"
      density={density}
      selected={selected}
      locked={locked}
      runState={run.runState}
      problem={configured ? false : l.notConfigured}
      {...(name ? { accessibleName: name } : {})}
      {...(description ? { stateWords: [description] } : {})}
      {...(onConfigure && (canEdit || preview) ? { onActivate: () => onConfigure(id) } : {})}
      {...(onRemove && canEdit ? { onDelete: () => onRemove(id) } : {})}
      labels={{ remove: l.remove }}
      badges={dialect && density === 'detailed' ? <NodeBadge>{dialect}</NodeBadge> : undefined}
      meta={
        configured ? (
          <span className="fk-datasource-node__meta" id={detailId}>
            {showConnection ? (
              <span className="fk-datasource-node__connection" data-connected={source?.connected ? 'true' : 'false'}>
                {source?.connected ? <CircleCheck aria-hidden="true" focusable="false" /> : <CircleSlash aria-hidden="true" focusable="false" />}
                {connectionWord}
              </span>
            ) : null}
            {readOnly ? <Tag size="small">{l.sample}</Tag> : null}
            {counts.length ? <span className="fk-datasource-node__counts">{counts.join(' · ')}</span> : null}
          </span>
        ) : undefined
      }
      className="fk-flow-node fk-datasource-node"
    >
      <ConnectionPorts nodeId={id} nodeLabel={title} inputs={k.inputs} outputs={k.outputs} tone={k.tone} preview={preview} />
      <NodeRunIndicator nodeId={id} kind="datasource" nodeLabel={title} />
    </GraphNodeCard>
  )
}
