// RunReplayDialog: re-executes a past run pre-filled with its inputs and sends
// only the inputs the person changed, converted back to their original type.

import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
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

type ValueType = 'text' | 'number' | 'boolean' | 'structured'

interface Row {
  key: string
  type: ValueType
  /** Editor text (text and structured), number or boolean. */
  draft: string | number | boolean | null
  touched: boolean
}

function typeOf(v: unknown): ValueType {
  if (typeof v === 'number') return 'number'
  if (typeof v === 'boolean') return 'boolean'
  if (v !== null && typeof v === 'object') return 'structured'
  return 'text'
}

function seed(original: unknown, type: ValueType): Row['draft'] {
  if (type === 'structured') return JSON.stringify(original, null, 2)
  if (type === 'number' || type === 'boolean') return original as number | boolean
  return original === null || original === undefined ? '' : String(original)
}

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
  const [rows, setRows] = useState<Row[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const errorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    setRows(Object.entries(originalInputs).map(([key, v]) => ({ key, type: typeOf(v), draft: seed(v, typeOf(v)), touched: false })))
    setError(null)
    setBusy(false)
    // Rows re-seed on every opening.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    if (error) errorRef.current?.focus()
  }, [error])

  const edit = (key: string, draft: Row['draft']) => setRows((rs) => rs.map((r) => (r.key === key ? { ...r, draft, touched: true } : r)))
  const reset = (key: string) => setRows((rs) => rs.map((r) => (r.key === key ? { ...r, draft: seed(originalInputs[key], r.type), touched: false } : r)))

  const submit = async (e?: FormEvent) => {
    e?.preventDefault()
    const overrides: Record<string, unknown> = {}
    for (const r of rows) {
      if (!r.touched) continue
      if (r.type === 'number') {
        if (typeof r.draft !== 'number' || !Number.isFinite(r.draft)) return setError(fill(l.invalidNumber, { key: r.key }))
        overrides[r.key] = r.draft
      } else if (r.type === 'structured') {
        const text = String(r.draft ?? '').trim()
        if (!text) overrides[r.key] = null
        else {
          try {
            overrides[r.key] = JSON.parse(text)
          } catch {
            return setError(fill(l.invalidStructured, { key: r.key }))
          }
        }
      } else overrides[r.key] = r.type === 'boolean' ? !!r.draft : String(r.draft ?? '')
    }
    setError(null)
    setBusy(true)
    try {
      await onReplay(overrides)
      setBusy(false)
      onClose()
    } catch (err) {
      setBusy(false)
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  const typeWord: Record<ValueType, string> = { text: l.text, number: l.number, boolean: l.boolean, structured: l.structured }

  return (
    <SectionedModal
      isOpen={open}
      onOpenChange={(o) => {
        if (!o && !busy) onClose()
      }}
      title={l.title}
      subtitle={l.subtitle}
      width="wide"
      busy={busy}
      onSubmitShortcut={() => void submit()}
      footer={
        <div className="fk-run-dialog-footer">
          <span className="fk-run-dialog-footer__ids">
            <ShortId id={runId} label={l.run} />
            <ShortId id={flowId} label={l.flow} />
          </span>
          <Button variant="quiet" onPress={onClose} disabled={busy}>
            {l.cancel}
          </Button>
          <Button variant="primary" type="submit" form={formId} busy={busy} busyLabel={l.replaying}>
            {l.replay}
          </Button>
        </div>
      }
    >
      <form id={formId} className="fk-run-form" onSubmit={(e) => void submit(e)} noValidate>
        {error ? (
          <div ref={errorRef} tabIndex={-1} className="fk-run-dialog-error">
            <InlineNotice tone="danger" urgency="assertive">
              {error}
            </InlineNotice>
          </div>
        ) : null}
        {rows.length === 0 ? <p className="fk-run-empty">{l.empty}</p> : null}
        {rows.map((r) => (
          <div key={r.key} className="fk-run-replay-row" data-touched={r.touched || undefined}>
            <div className="fk-run-replay-row__head">
              <code className="fk-run-mono">{r.key}</code>
              <Tag size="small">{typeWord[r.type]}</Tag>
              {r.touched ? (
                <Button variant="quiet" size="compact" leadingIcon={<RotateCcw />} onPress={() => reset(r.key)} className="fk-run-replay-row__reset">
                  <span aria-hidden="true">{l.reset}</span>
                  <span className="fk-visually-hidden">{fill(l.resetKey, { key: r.key })}</span>
                </Button>
              ) : null}
            </div>
            <RowEditor row={r} typeWord={typeWord[r.type]} labels={l} onEdit={(v) => edit(r.key, v)} />
          </div>
        ))}
      </form>
    </SectionedModal>
  )
}

function RowEditor({ row, typeWord, labels: l, onEdit }: { row: Row; typeWord: string; labels: RunReplayDialogLabels; onEdit: (v: Row['draft']) => void }) {
  const label = `${row.key} (${typeWord})`
  switch (row.type) {
    case 'number':
      return <NumberInput label={label} value={typeof row.draft === 'number' ? row.draft : null} onChange={onEdit} />
    case 'boolean':
      return <SegmentedControl label={label} options={[{ value: 'true', label: l.yes }, { value: 'false', label: l.no }]} value={row.draft ? 'true' : 'false'} onChange={(v) => onEdit(v === 'true')} />
    case 'structured':
      return <TextArea label={label} monospace rows={4} value={String(row.draft ?? '')} onChange={onEdit} />
    default:
      return <TextField label={label} value={String(row.draft ?? '')} onChange={onEdit} />
  }
}
