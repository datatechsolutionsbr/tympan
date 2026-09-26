// NumberTrace: a manuscript passage whose numbers can be followed back to
// the records they came from. Each traced number is a button; activating it
// opens a panel beside the text with the chain sentence → run → edition →
// records → assertions and whether each link holds.

import { useRef, useState, type KeyboardEvent } from 'react'
import { CircleCheck, Hourglass, X } from 'lucide-react'
import { Button } from '@fakhir/design-system'
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
}

export const numberTraceLabels = defineLabels<NumberTraceLabels>('NumberTrace', {
  en: {
    passage: 'Manuscript passage',
    number: 'number {value}, show its trace',
    panel: 'Where {value} comes from',
    chain: 'Chain from the sentence to the assertions',
    close: 'Close the trace',
    open: 'Open {title}',
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
    status: { ok: 'coincide', pending: 'pendiente' },
    kinds: { query: 'búsqueda', retrieval: 'lectura', source: 'fuente', assertion: 'afirmación', record: 'registro', verification: 'verificación', analysis: 'ejecución', edition: 'edición', manuscript: 'frase' },
  },
})

export const defaultNumberTraceLabels = numberTraceLabels.bundles.en

export interface NumberTraceProps {
  passage: TracedPassage
  /** Makes each step of the chain a link-like button (for example to focus it in the graph). */
  onOpenStep?: (step: NumberTraceStep) => void
  labels?: Partial<NumberTraceLabels>
  className?: string
}

const STATUS_ICON = { ok: CircleCheck, pending: Hourglass } as const

export function NumberTrace({ passage, onOpenStep, labels, className }: NumberTraceProps) {
  const l = useLabels(numberTraceLabels, labels)
  const { locale } = useFlowLocale()
  const [open, setOpen] = useState<TracedNumber | null>(null)
  const opener = useRef<HTMLButtonElement | null>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)

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
    <div className={['fk-trace', className].filter(Boolean).join(' ')} data-open={open ? 'true' : undefined} role="group" aria-label={l.passage}>
      <p className="fk-trace__text" dir="auto">
        {passage.map((part, i) =>
          typeof part === 'string' ? (
            <span key={i}>{part}</span>
          ) : (
            <button
              key={part.id}
              type="button"
              className="fk-trace__number"
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
      {open ? (
        <section className="fk-trace__panel" role="region" aria-labelledby="fk-trace-heading" onKeyDown={onPanelKey}>
          <header className="fk-trace__head">
            <h3 id="fk-trace-heading" ref={headingRef} tabIndex={-1} className="fk-trace__title">
              {fill(l.panel, { value: open.text }, locale)}
            </h3>
            <Button variant="quiet" size="compact" shape="circle" iconOnly accessibleLabel={l.close} leadingIcon={<X />} onPress={close} />
          </header>
          <ol className="fk-trace__chain" aria-label={l.chain}>
            {open.chain.map((step) => {
              const Icon = STATUS_ICON[step.status]
              const body = (
                <>
                  <span className="fk-trace__kind">{l.kinds[step.kind] ?? step.kind}</span>
                  <span className="fk-trace__step-title">{step.title}</span>
                  {step.meta ? (
                    <code className="fk-trace__meta" dir="ltr">
                      {step.meta}
                    </code>
                  ) : null}
                </>
              )
              return (
                <li key={step.id} className="fk-trace__step" data-status={step.status}>
                  <span className="fk-trace__status">
                    <Icon aria-hidden="true" focusable="false" />
                    <span>{l.status[step.status]}</span>
                  </span>
                  {onOpenStep ? (
                    <button type="button" className="fk-trace__open" aria-label={fill(l.open, { title: step.title }, locale)} onClick={() => onOpenStep(step)}>
                      {body}
                    </button>
                  ) : (
                    <span className="fk-trace__body">{body}</span>
                  )}
                </li>
              )
            })}
          </ol>
        </section>
      ) : null}
    </div>
  )
}
