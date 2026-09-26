// RunReplayDialog: runs a past run again. Every original input is shown with
// an editor that fits its type; only the inputs the person changed are sent,
// turned back into their original type. Untouched inputs keep their value.

import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { RotateCcw } from 'lucide-react'
import { Button, InlineNotice, SegmentedControl, Tag, TextArea, TextField } from '@fakhir/design-system'
import { SectionedModal } from '../internal/SectionedModal'
import { defineLabels, fill, useLabels } from '../internal/labels'
import { NumberInput } from './NumberInput'
import { ShortId } from './ShortId'

export interface RunReplayDialogLabels {
  title: string
  subtitle: string
  empty: string
  text: string
  number: string
  boolean: string
  structured: string
  yes: string
  no: string
  reset: string
  resetKey: string
  invalidNumber: string
  invalidStructured: string
  run: string
  flow: string
  cancel: string
  replay: string
  replaying: string
}

export const runReplayDialogLabels = defineLabels<RunReplayDialogLabels>('run-replay-dialog', {
  en: {
    title: 'Replay run',
    subtitle: 'Inputs you leave untouched keep their original value.',
    empty: 'This run had no inputs. It will replay as it was.',
    text: 'text',
    number: 'number',
    boolean: 'true or false',
    structured: 'structured',
    yes: 'true',
    no: 'false',
    reset: 'Reset',
    resetKey: 'Reset {key} to its original value',
    invalidNumber: '{key} must be a finite number.',
    invalidStructured: '{key} is not valid structured data.',
    run: 'Run',
    flow: 'Flow',
    cancel: 'Cancel',
    replay: 'Replay',
    replaying: 'Replaying',
  },
  'pt-BR': {
    title: 'Reexecutar',
    subtitle: 'As entradas que você não alterar mantêm o valor original.',
    empty: 'Esta execução não teve entradas. Será reexecutada como foi.',
    text: 'texto',
    number: 'número',
    boolean: 'verdadeiro ou falso',
    structured: 'estruturado',
    yes: 'verdadeiro',
    no: 'falso',
    reset: 'Restaurar',
    resetKey: 'Restaurar {key} ao valor original',
    invalidNumber: '{key} precisa ser um número finito.',
    invalidStructured: '{key} não é um dado estruturado válido.',
    run: 'Execução',
    flow: 'Fluxo',
    cancel: 'Cancelar',
    replay: 'Reexecutar',
    replaying: 'Reexecutando',
  },
  es: {
    title: 'Repetir la ejecución',
    subtitle: 'Las entradas que no cambie conservan su valor original.',
    empty: 'Esta ejecución no tuvo entradas. Se repetirá tal como fue.',
    text: 'texto',
    number: 'número',
    boolean: 'verdadero o falso',
    structured: 'estructurado',
    yes: 'verdadero',
    no: 'falso',
    reset: 'Restablecer',
    resetKey: 'Restablecer {key} a su valor original',
    invalidNumber: '{key} debe ser un número finito.',
    invalidStructured: '{key} no es un dato estructurado válido.',
    run: 'Ejecución',
    flow: 'Flujo',
    cancel: 'Cancelar',
    replay: 'Repetir',
    replaying: 'Repitiendo',
  },
})
export const defaultRunReplayDialogLabels: RunReplayDialogLabels = runReplayDialogLabels.bundles.en

type Draft = string | number | boolean | null

/** Outcome of turning a draft back into a value. */
type Parsed = { value: unknown } | { problem: 'invalidNumber' | 'invalidStructured' }

/** How one kind of input value is detected, drafted, read back and edited. */
interface Codec {
  word: (l: RunReplayDialogLabels) => string
  draft: (original: unknown) => Draft
  read: (draft: Draft) => Parsed
  editor: (p: { label: string; draft: Draft; l: RunReplayDialogLabels; put: (d: Draft) => void }) => ReactNode
}

const CODECS = {
  number: {
    word: (l) => l.number,
    draft: (v) => v as number,
    read: (d) => (typeof d === 'number' && Number.isFinite(d) ? { value: d } : { problem: 'invalidNumber' }),
    editor: ({ label, draft, put }) => <NumberInput label={label} value={typeof draft === 'number' ? draft : null} onChange={put} />,
  },
  boolean: {
    word: (l) => l.boolean,
    draft: (v) => v as boolean,
    read: (d) => ({ value: Boolean(d) }),
    editor: ({ label, draft, l, put }) => (
      <SegmentedControl label={label} options={[{ value: 'true', label: l.yes }, { value: 'false', label: l.no }]} value={draft ? 'true' : 'false'} onChange={(v) => put(v === 'true')} />
    ),
  },
  structured: {
    word: (l) => l.structured,
    draft: (v) => JSON.stringify(v, null, 2),
    read: (d) => {
      const text = String(d ?? '').trim()
      if (!text) return { value: null }
      try {
        return { value: JSON.parse(text) as unknown }
      } catch {
        return { problem: 'invalidStructured' }
      }
    },
    editor: ({ label, draft, put }) => <TextArea label={label} monospace rows={4} value={String(draft ?? '')} onChange={put} />,
  },
  text: {
    word: (l) => l.text,
    draft: (v) => (v === null || v === undefined ? '' : String(v)),
    read: (d) => ({ value: String(d ?? '') }),
    editor: ({ label, draft, put }) => <TextField label={label} value={String(draft ?? '')} onChange={put} />,
  },
} satisfies Record<string, Codec>

type Kind = keyof typeof CODECS

/** Null and missing originals are text. */
const kindOf = (v: unknown): Kind => (typeof v === 'number' ? 'number' : typeof v === 'boolean' ? 'boolean' : v !== null && typeof v === 'object' ? 'structured' : 'text')

export interface RunReplayDialogProps {
  open: boolean
  onClose: () => void
  runId: string
  flowId: string
  originalInputs: Record<string, unknown>
  onReplay: (overrides: Record<string, unknown>) => Promise<void>
  labels?: Partial<RunReplayDialogLabels>
}

export function RunReplayDialog({ open, onClose, runId, flowId, originalInputs, onReplay, labels }: RunReplayDialogProps) {
  const l = useLabels(runReplayDialogLabels, labels)
  const formId = useId()
  /** Drafts of the edited inputs only; an input absent here is untouched. */
  const [edited, setEdited] = useState<ReadonlyMap<string, Draft>>(new Map())
  const [notice, setNotice] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const noticeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    setEdited(new Map())
    setNotice(null)
    setSending(false)
  }, [open])

  useEffect(() => {
    if (notice) noticeRef.current?.focus()
  }, [notice])

  const keys = Object.keys(originalInputs)
  const put = (key: string, d: Draft) => setEdited((m) => new Map(m).set(key, d))
  const restore = (key: string) =>
    setEdited((m) => {
      const next = new Map(m)
      next.delete(key)
      return next
    })

  const collect = (): { overrides: Record<string, unknown> } | { problem: string } => {
    const overrides: Record<string, unknown> = {}
    for (const [key, draft] of edited) {
      const parsed: Parsed = CODECS[kindOf(originalInputs[key])].read(draft)
      if ('problem' in parsed) return { problem: fill(l[parsed.problem], { key }) }
      overrides[key] = parsed.value
    }
    return { overrides }
  }

  const send = async (e?: FormEvent) => {
    e?.preventDefault()
    const result = collect()
    if ('problem' in result) return setNotice(result.problem)
    setNotice(null)
    setSending(true)
    try {
      await onReplay(result.overrides)
      setSending(false)
      onClose()
    } catch (why) {
      setSending(false)
      setNotice(why instanceof Error ? why.message : String(why))
    }
  }

  const rows = keys.map((key) => {
    const codec = CODECS[kindOf(originalInputs[key])]
    const touched = edited.has(key)
    const draft = touched ? edited.get(key)! : codec.draft(originalInputs[key])
    const word = codec.word(l)
    return (
      <div key={key} className="fk-run-replay-row" data-touched={touched || undefined}>
        <div className="fk-run-replay-row__head">
          <code className="fk-run-mono">{key}</code>
          <Tag size="small">{word}</Tag>
          {touched && (
            <Button variant="quiet" size="compact" leadingIcon={<RotateCcw />} onPress={() => restore(key)} className="fk-run-replay-row__reset">
              <span aria-hidden="true">{l.reset}</span>
              <span className="fk-visually-hidden">{fill(l.resetKey, { key })}</span>
            </Button>
          )}
        </div>
        {codec.editor({ label: `${key} (${word})`, draft, l, put: (d) => put(key, d) })}
      </div>
    )
  })

  return (
    <SectionedModal
      isOpen={open}
      onOpenChange={(stillOpen) => {
        if (!stillOpen && !sending) onClose()
      }}
      title={l.title}
      subtitle={l.subtitle}
      width="wide"
      busy={sending}
      onSubmitShortcut={() => void send()}
      footer={
        <div className="fk-run-dialog-footer">
          <span className="fk-run-dialog-footer__ids">
            <ShortId id={runId} label={l.run} />
            <ShortId id={flowId} label={l.flow} />
          </span>
          <Button variant="quiet" onPress={onClose} disabled={sending}>
            {l.cancel}
          </Button>
          <Button variant="primary" type="submit" form={formId} busy={sending} busyLabel={l.replaying}>
            {l.replay}
          </Button>
        </div>
      }
    >
      <form id={formId} className="fk-run-form" onSubmit={(e) => void send(e)} noValidate>
        {notice && (
          <div ref={noticeRef} tabIndex={-1} className="fk-run-dialog-error">
            <InlineNotice tone="danger" urgency="assertive">
              {notice}
            </InlineNotice>
          </div>
        )}
        {rows.length ? rows : <p className="fk-run-empty">{l.empty}</p>}
      </form>
    </SectionedModal>
  )
}
