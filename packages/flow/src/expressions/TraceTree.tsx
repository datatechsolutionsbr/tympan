// TraceTree: how an expression evaluated, one row per evaluated sub-expression
// (APG Tree View on React Aria Tree). Enter or the preview button toggles the
// full result under a row; results are clamped by lines, never cut.

import { useMemo, useState, type ReactNode } from 'react'
import { Button as AriaButton, Tree, TreeItem, TreeItemContent, type Key } from 'react-aria-components'
import { ChevronRight } from 'lucide-react'
import { InlineNotice, Tag } from '@fakhir/design-system'
import { defineLabels, fill, useFlowLocale, useLabels } from '../internal/labels'
import type { TraceReport, TraceSpan } from './trace'

export interface TraceTreeLabels {
  tree: string
  expand: string
  collapse: string
  viewResult: string
  resultOf: string
  rowName: string
  truncated: string
  reference: string
  value: string
  list: string
  object: string
  absent: string
}

export const traceTreeLabels = defineLabels<TraceTreeLabels>('TraceTree', {
  en: {
    tree: 'Evaluation trace',
    expand: 'Expand {label}',
    collapse: 'Collapse {label}',
    viewResult: 'Result of {label}: {preview}',
    resultOf: 'Result of {label}',
    rowName: '{label}, result: {preview}',
    truncated: 'The engine stopped recording after {frames, number} of {limit, number} frames. The final result is still correct.',
    reference: 'reference',
    value: 'value',
    list: '{count, plural, one {list of # item} other {list of # items}}',
    object: '{count, plural, one {object with # key} other {object with # keys}}',
    absent: 'no result recorded',
  },
  'pt-BR': {
    tree: 'Rastro da avaliação',
    expand: 'Expandir {label}',
    collapse: 'Recolher {label}',
    viewResult: 'Resultado de {label}: {preview}',
    resultOf: 'Resultado de {label}',
    rowName: '{label}, resultado: {preview}',
    truncated: 'O motor parou de registrar após {frames, number} de {limit, number} quadros. O resultado final continua correto.',
    reference: 'referência',
    value: 'valor',
    list: '{count, plural, one {lista de # item} other {lista de # itens}}',
    object: '{count, plural, one {objeto com # chave} other {objeto com # chaves}}',
    absent: 'sem resultado registrado',
  },
  es: {
    tree: 'Traza de la evaluación',
    expand: 'Expandir {label}',
    collapse: 'Contraer {label}',
    viewResult: 'Resultado de {label}: {preview}',
    resultOf: 'Resultado de {label}',
    rowName: '{label}, resultado: {preview}',
    truncated: 'El motor dejó de registrar tras {frames, number} de {limit, number} marcos. El resultado final sigue siendo correcto.',
    reference: 'referencia',
    value: 'valor',
    list: '{count, plural, one {lista de # elemento} other {lista de # elementos}}',
    object: '{count, plural, one {objeto con # clave} other {objeto con # claves}}',
    absent: 'sin resultado registrado',
  },
})
export const defaultTraceTreeLabels: TraceTreeLabels = traceTreeLabels.bundles.en

export interface TraceTreeProps {
  report: TraceReport
  /** Rows shallower than this are visible when the tree opens (2: root and its children). */
  defaultExpandDepth?: number
  labels?: Partial<TraceTreeLabels>
  className?: string
}

interface Row {
  id: string
  depth: number
  span: TraceSpan
  children: Row[]
}

function toRows(span: TraceSpan, id: string, depth: number): Row {
  return { id, depth, span, children: (span.children ?? []).map((c, i) => toRows(c, `${id}.${i}`, depth + 1)) }
}

function walk(row: Row, visit: (r: Row) => void) {
  visit(row)
  row.children.forEach((c) => walk(c, visit))
}

/** One-line summary of a result (the full value is shown on request). */
export function previewResult(value: unknown, l: TraceTreeLabels, locale: string, present = true): string {
  if (!present) return l.absent
  if (value === null) return 'null'
  if (Array.isArray(value)) return fill(l.list, { count: value.length }, locale)
  if (typeof value === 'object') return fill(l.object, { count: Object.keys(value as object).length }, locale)
  if (typeof value === 'number') return new Intl.NumberFormat(locale).format(value)
  if (typeof value === 'string') return JSON.stringify(value)
  return String(value)
}

function argSummary(args: Record<string, unknown> | undefined): string {
  if (!args) return ''
  return Object.entries(args)
    .filter(([, v]) => v === null || ['string', 'number', 'boolean'].includes(typeof v))
    .map(([k, v]) => `${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`)
    .join(', ')
}

export function TraceTree({ report, defaultExpandDepth = 2, labels, className }: TraceTreeProps) {
  const l = useLabels(traceTreeLabels, labels)
  const { locale } = useFlowLocale()
  const root = useMemo(() => toRows(report.trace, '0', 0), [report.trace])
  const [expanded, setExpanded] = useState<Set<Key>>(() => {
    const open = new Set<Key>()
    // A row is open when its children are shallower than the expand depth.
    walk(root, (r) => {
      if (r.children.length && r.depth + 1 < defaultExpandDepth) open.add(r.id)
    })
    return open
  })
  const [details, setDetails] = useState<Set<string>>(new Set())
  const toggleDetail = (id: string) =>
    setDetails((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const render = (row: Row): ReactNode => {
    const { span } = row
    const present = 'result' in span
    const preview = previewResult(span.result, l, locale, present)
    const open = details.has(row.id)
    const detailId = `fk-trace-${row.id}`
    return (
      <TreeItem
        key={row.id}
        id={row.id}
        textValue={span.label}
        aria-label={fill(l.rowName, { label: span.label, preview }, locale)}
        className="fk-trace__row"
        style={{ ['--fk-trace-level' as string]: row.depth + 1 }}
        onAction={() => toggleDetail(row.id)}
      >
        <TreeItemContent>
          {({ hasChildItems, isExpanded }) => (
            <>
              <div className="fk-trace__line">
                {hasChildItems ? (
                  <AriaButton slot="chevron" className="fk-trace__chevron" aria-label={fill(isExpanded ? l.collapse : l.expand, { label: span.label }, locale)}>
                    <ChevronRight className="fk-trace__chevron-icon" aria-hidden="true" focusable="false" />
                  </AriaButton>
                ) : (
                  <span className="fk-trace__spacer" aria-hidden="true" />
                )}
                {span.kind === 'operation' ? (
                  <code className="fk-trace__op" dir="ltr">
                    {span.label}
                  </code>
                ) : (
                  <>
                    <Tag size="small">{span.kind === 'ref' ? l.reference : l.value}</Tag>
                    <code className="fk-trace__op" dir="ltr">
                      {span.label}
                    </code>
                  </>
                )}
                {span.args ? (
                  <span className="fk-trace__args" dir="ltr">
                    {argSummary(span.args)}
                  </span>
                ) : null}
                <AriaButton className="fk-trace__preview" aria-expanded={open} aria-controls={open ? detailId : undefined} aria-label={fill(l.viewResult, { label: span.label, preview }, locale)} onPress={() => toggleDetail(row.id)}>
                  {preview}
                </AriaButton>
              </div>
              {open ? (
                <pre id={detailId} className="fk-trace__detail" role="region" aria-label={fill(l.resultOf, { label: span.label }, locale)} dir="ltr" tabIndex={0}>
                  {present ? JSON.stringify(span.result, null, 2) : l.absent}
                </pre>
              ) : null}
            </>
          )}
        </TreeItemContent>
        {row.children.map(render)}
      </TreeItem>
    )
  }

  return (
    <div className={['fk-trace', className].filter(Boolean).join(' ')}>
      {report.truncated ? (
        <InlineNotice tone="warning" urgency="none">
          {fill(l.truncated, { frames: report.frameCount, limit: report.frameLimit }, locale)}
        </InlineNotice>
      ) : null}
      <Tree aria-label={l.tree} className="fk-trace__tree" expandedKeys={expanded} onExpandedChange={(keys) => setExpanded(new Set(keys))}>
        {render(root)}
      </Tree>
    </div>
  )
}
