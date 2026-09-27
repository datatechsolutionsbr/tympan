// ExpressionField: one expression edited visually (ExpressionBuilder) or as
// structured text, with the parse error or a "valid" note. Invalid text never
// replaces the last valid tree. Shared by SimulationNodeForm and the rule
// condition builder.

import { useId, useState } from 'react'
import { SegmentedControl, TextArea } from '../../index'
import { defineLabels, fill, useFlowLocale, useLabels } from '../internal/labels'
import { ExpressionBuilder } from './ExpressionBuilder'
import type { ExpressionBuilderLabels } from './labels'
import { useExpressionCatalog } from './catalogContext'
import { findOperation, isOperation, prettyJson, type ExpressionCatalog, type ExpressionNode } from './model'

export interface ExpressionFieldLabels {
  mode: string
  visual: string
  text: string
  valid: string
  unparseable: string
  notObject: string
  missingOperation: string
  unknownOperation: string
}

export const expressionFieldLabels = defineLabels<ExpressionFieldLabels>('ExpressionField', {
  en: {
    mode: 'Editor',
    visual: 'Visual',
    text: 'Structured text',
    valid: 'Valid expression.',
    unparseable: 'Cannot read this text: {detail}',
    notObject: 'The expression must be an object.',
    missingOperation: 'The expression needs an operation.',
    unknownOperation: 'Unknown operation: {operation}',
  },
  'pt-BR': {
    mode: 'Editor',
    visual: 'Visual',
    text: 'Texto estruturado',
    valid: 'Expressão válida.',
    unparseable: 'Não foi possível ler este texto: {detail}',
    notObject: 'A expressão precisa ser um objeto.',
    missingOperation: 'A expressão precisa de uma operação.',
    unknownOperation: 'Operação desconhecida: {operation}',
  },
  es: {
    mode: 'Editor',
    visual: 'Visual',
    text: 'Texto estructurado',
    valid: 'Expresión válida.',
    unparseable: 'No se puede leer este texto: {detail}',
    notObject: 'La expresión debe ser un objeto.',
    missingOperation: 'La expresión necesita una operación.',
    unknownOperation: 'Operación desconocida: {operation}',
  },
})

export interface ExpressionFieldProps {
  label: string
  hint?: string
  value: ExpressionNode
  onChange: (next: ExpressionNode) => void
  references?: readonly string[]
  mode?: 'expression' | 'predicate'
  /** Allow any object (reference, literal) in text mode, not only operations. */
  acceptLeaves?: boolean
  catalog?: ExpressionCatalog
  builderLabels?: Partial<ExpressionBuilderLabels>
  labels?: Partial<ExpressionFieldLabels>
  /** Reports whether the text currently fails to parse. */
  onValidityChange?: (valid: boolean) => void
}

type TextError = { key: 'unparseable'; detail: string } | { key: 'notObject' } | { key: 'missingOperation' } | { key: 'unknownOperation'; operation: string }

function readText(text: string, acceptLeaves: boolean, catalog?: ExpressionCatalog): { ok: true; value: ExpressionNode } | { ok: false; error: TextError } {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch (e) {
    return { ok: false, error: { key: 'unparseable', detail: e instanceof Error ? e.message : String(e) } }
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return { ok: false, error: { key: 'notObject' } }
  if (!isOperation(parsed)) {
    if (acceptLeaves && ('ref' in parsed || 'value' in parsed)) return { ok: true, value: parsed as ExpressionNode }
    return { ok: false, error: { key: 'missingOperation' } }
  }
  if (catalog && !findOperation(catalog, parsed.operation)) return { ok: false, error: { key: 'unknownOperation', operation: parsed.operation } }
  return { ok: true, value: parsed }
}

export function ExpressionField(props: ExpressionFieldProps) {
  const { label, hint, value, onChange, references = [], mode = 'expression', acceptLeaves = false, builderLabels, onValidityChange } = props
  const l = useLabels(expressionFieldLabels, props.labels)
  const { locale } = useFlowLocale()
  const { catalog } = useExpressionCatalog(props.catalog)
  const groupId = useId()
  const [view, setView] = useState<'visual' | 'text'>('visual')
  const [text, setText] = useState(() => prettyJson(value))
  const [error, setError] = useState<TextError | null>(null)

  const message = error ? fill(l[error.key], error.key === 'unparseable' ? { detail: error.detail } : error.key === 'unknownOperation' ? { operation: error.operation } : {}, locale) : null

  return (
    <div className="ty-expr-form__field-group" role="group" aria-labelledby={groupId}>
      <span id={groupId} className="ty-expr-form__legend">
        {label}
      </span>
      {hint ? <p className="ty-expr__hint">{hint}</p> : null}
      <SegmentedControl
        label={`${label}: ${l.mode}`}
        size="compact"
        value={view}
        onChange={(v) => {
          if (v === 'text') {
            setText(prettyJson(value))
            setError(null)
            onValidityChange?.(true)
          }
          setView(v as 'visual' | 'text')
        }}
        options={[
          { value: 'visual', label: l.visual },
          { value: 'text', label: l.text },
        ]}
      />
      {view === 'visual' ? (
        <ExpressionBuilder label={label} value={value} onChange={onChange} references={references} mode={mode} {...(props.catalog ? { catalog: props.catalog } : {})} {...(builderLabels ? { labels: builderLabels } : {})} />
      ) : (
        <>
          <TextArea
            className="ty-expr-form__code"
            label={label}
            monospace
            rows={6}
            value={text}
            onChange={(t) => {
              setText(t)
              const r = readText(t, acceptLeaves, catalog)
              if (r.ok) {
                setError(null)
                onChange(r.value)
              } else setError(r.error)
              onValidityChange?.(r.ok)
            }}
            {...(message ? { errorMessage: message } : {})}
          />
          {!error ? (
            <p className="ty-expr-form__valid" role="status">
              {l.valid}
            </p>
          ) : null}
        </>
      )}
    </div>
  )
}
