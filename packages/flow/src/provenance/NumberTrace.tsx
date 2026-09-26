// NumberTrace ("where did this number come from?"): a manuscript passage
// whose numbers can be followed back to the records they came from. Each
// traced number is a button; the selected one opens a panel beside the text
// with the number, what it counts, and the numbered chain sentence → run →
// edition → records → assertions, each link marked as holding or pending.

import { useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { Check, Hourglass, RotateCcw, Share2 } from 'lucide-react'
import { Button } from '@fakhir/ui'
import { defineLabels, fill, useFlowLocale, useLabels } from '../internal/labels'
import type { NumberTraceStep, TracedNumber, TracedPassage } from './proofTypes'

export interface NumberTraceLabels {
  passage: string
  number: string
  panel: string
  chain: string
  close: string
  open: string
  status: Record<NumberTraceStep['status'], string>
  kinds: Record<string, string>
  selected: string
  openInGraph: string
  rerun: string
}

export const numberTraceLabels = defineLabels<NumberTraceLabels>('NumberTrace', {
  en: {
    passage: 'Manuscript passage',
    number: 'number {value}, show its trace',
    panel: 'Where {value} comes from',
    chain: 'Chain from the sentence to the assertions',
    close: 'Close the trace',
    open: 'Open {title}',
    selected: 'Selected number',
    openInGraph: 'Open in the graph',
    rerun: 'Run again',
    status: { ok: 'holds', pending: 'pending' },
    kinds: { query: 'query', retrieval: 'retrieval', source: 'source', assertion: 'assertion', record: 'record', verification: 'verification', analysis: 'run', edition: 'edition', manuscript: 'sentence' },
  },
  'pt-BR': {
    passage: 'Trecho do manuscrito',
    number: 'número {value}, mostrar a origem',
    panel: 'De onde vem {value}',
    chain: 'Cadeia da frase até as afirmações',
    close: 'Fechar a origem',
    open: 'Abrir {title}',
    selected: 'Número selecionado',
    openInGraph: 'Abrir no grafo',
    rerun: 'Reexecutar',
    status: { ok: 'confere', pending: 'pendente' },
    kinds: { query: 'busca', retrieval: 'leitura', source: 'fonte', assertion: 'afirmação', record: 'registro', verification: 'verificação', analysis: 'execução', edition: 'edição', manuscript: 'frase' },
  },
  es: {
    passage: 'Fragmento del manuscrito',
    number: 'número {value}, mostrar su origen',
    panel: 'De dónde viene {value}',
    chain: 'Cadena de la frase a las afirmaciones',
    close: 'Cerrar el origen',
    open: 'Abrir {title}',
    selected: 'Número seleccionado',
    openInGraph: 'Abrir en el grafo',
    rerun: 'Ejecutar de nuevo',
    status: { ok: 'coincide', pending: 'pendiente' },
    kinds: { query: 'búsqueda', retrieval: 'lectura', source: 'fuente', assertion: 'afirmación', record: 'registro', verification: 'verificación', analysis: 'ejecución', edition: 'edición', manuscript: 'frase' },
  },
})

export const defaultNumberTraceLabels = numberTraceLabels.bundles.en

export interface NumberTraceProps {
  passage: TracedPassage
  /** Where the passage is (file, section), in mono above the text. */
  source?: string
  /** Text after the passage (the next paragraph, muted). */
  after?: ReactNode
  /** Number whose trace is open at first. */
  defaultOpenId?: string
  /** Makes each step of the chain a link-like button (for example to focus it in the graph). */
  onOpenStep?: (step: NumberTraceStep) => void
  /** "Open in the graph" for the selected number. */
  onOpenInGraph?: (n: TracedNumber) => void
  /** "Run again" for the selected number. */
  onRerun?: (n: TracedNumber) => void
  labels?: Partial<NumberTraceLabels>
  className?: string
}

const STATUS_ICON = { ok: Check, pending: Hourglass } as const

export function NumberTrace({ passage, source, after, defaultOpenId, onOpenStep, onOpenInGraph, onRerun, labels, className }: NumberTraceProps) {
  const l = useLabels(numberTraceLabels, labels)
  const { locale } = useFlowLocale()
  const [open, setOpen] = useState<TracedNumber | null>(() => (defaultOpenId ? (passage.find((p): p is TracedNumber => typeof p !== 'string' && p.id === defaultOpenId) ?? null) : null))
  const opener = useRef<HTMLButtonElement | null>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const num = (n: number) => new Intl.NumberFormat(locale).format(n)

  const close = () => {
    setOpen(null)
    requestAnimationFrame(() => opener.current?.focus())
  }
  const onPanelKey = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      close()
    }
  }

  return (
    <div className={['fk-numtrace', className].filter(Boolean).join(' ')} data-open={open ? 'true' : undefined} role="group" aria-label={l.passage}>
      <article className="fk-numtrace__article">
        {source ? (
          <p className="fk-numtrace__source" dir="ltr">
            {source}
          </p>
        ) : null}
        <p className="fk-numtrace__text" dir="auto">
          {passage.map((part, i) =>
            typeof part === 'string' ? (
              <span key={i}>{part}</span>
            ) : (
              <button
                key={part.id}
                type="button"
                className="fk-numtrace__number"
                aria-label={fill(l.number, { value: part.text }, locale)}
                aria-expanded={open?.id === part.id}
                data-active={open?.id === part.id || undefined}
                onClick={(e) => {
                  opener.current = e.currentTarget
                  setOpen(part)
                  requestAnimationFrame(() => headingRef.current?.focus())
                }}
              >
                {part.text}
              </button>
            ),
          )}
        </p>
        {after ? <div className="fk-numtrace__after">{after}</div> : null}
      </article>
      {open ? (
        <section className="fk-numtrace__panel" role="region" aria-labelledby="fk-numtrace-heading" onKeyDown={onPanelKey}>
          <h3 id="fk-numtrace-heading" ref={headingRef} tabIndex={-1} className="fk-numtrace__eyebrow">
            <span aria-hidden="true">{l.selected}</span>
            <span className="fk-visually-hidden">{fill(l.panel, { value: open.text }, locale)}</span>
          </h3>
          <p className="fk-numtrace__value" aria-hidden="true">
            {open.text}
          </p>
          {open.caption ? <p className="fk-numtrace__caption">{open.caption}</p> : null}
          <ol className="fk-numtrace__chain" aria-label={l.chain}>
            {open.chain.map((step, i) => {
              const Icon = STATUS_ICON[step.status]
              const body = (
                <>
                  <span className="fk-visually-hidden">{l.kinds[step.kind] ?? step.kind}: </span>
                  <span className="fk-numtrace__step-title" dir="auto">
                    {step.title}
                  </span>
                  {step.meta ? (
                    <code className="fk-numtrace__meta" dir="ltr">
                      {step.meta}
                    </code>
                  ) : null}
                </>
              )
              return (
                <li key={step.id} className="fk-numtrace__step" data-status={step.status}>
                  <span className="fk-numtrace__index" aria-hidden="true">
                    {num(i + 1)}
                  </span>
                  {onOpenStep ? (
                    <button type="button" className="fk-numtrace__open" aria-label={fill(l.open, { title: step.title }, locale)} onClick={() => onOpenStep(step)}>
                      {body}
                    </button>
                  ) : (
                    <span className="fk-numtrace__body">{body}</span>
                  )}
                  <span className="fk-numtrace__status">
                    <Icon aria-hidden="true" focusable="false" />
                    <span className="fk-visually-hidden">{l.status[step.status]}</span>
                  </span>
                </li>
              )
            })}
          </ol>
          {onOpenInGraph || onRerun ? (
            <div className="fk-numtrace__actions">
              {onOpenInGraph ? (
                <Button variant="secondary" leadingIcon={<Share2 />} onPress={() => onOpenInGraph(open)}>
                  {l.openInGraph}
                </Button>
              ) : null}
              {onRerun ? (
                <Button variant="quiet" leadingIcon={<RotateCcw />} onPress={() => onRerun(open)}>
                  {l.rerun}
                </Button>
              ) : null}
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  )
}
