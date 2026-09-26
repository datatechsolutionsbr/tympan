// RunInputDialog: collects values for the flow's declared inputs before a run.

import { useEffect, useId, useState, type FormEvent } from 'react'
import { Button, ModalDialog, TextField } from '@fakhir/design-system'
import { defineLabels, useLabels } from '../internal/labels'
import { useOptionalFlowEditorStore } from '../state/editorState'
import { useStoreSelector } from '../state/store'
import { createFlowEditorStore } from '../state/editorState'
import { NumberInput } from './NumberInput'

export interface RunInputDialogLabels {
  title: string
  subtitle: string
  empty: string
  valuePlaceholder: string
  cancel: string
  run: string
}

export const runInputDialogLabels = defineLabels<RunInputDialogLabels>('run-input-dialog', {
  en: { title: 'Run this flow', subtitle: 'Give a value to each input the flow declares.', empty: 'This flow declares no inputs. It runs as it is.', valuePlaceholder: 'Value', cancel: 'Cancel', run: 'Run' },
  'pt-BR': { title: 'Executar este fluxo', subtitle: 'Informe um valor para cada entrada que o fluxo declara.', empty: 'Este fluxo não declara entradas. Ele roda como está.', valuePlaceholder: 'Valor', cancel: 'Cancelar', run: 'Executar' },
  es: { title: 'Ejecutar este flujo', subtitle: 'Indique un valor para cada entrada que declara el flujo.', empty: 'Este flujo no declara entradas. Se ejecuta tal cual.', valuePlaceholder: 'Valor', cancel: 'Cancelar', run: 'Ejecutar' },
})
export const defaultRunInputDialogLabels: RunInputDialogLabels = runInputDialogLabels.bundles.en

export type InputFieldKind = 'currency' | 'count' | 'text'
export type RunInputValue = string | number | boolean | null

export interface RunInputDialogProps {
  open: boolean
  onClose: () => void
  onRun: (inputs: Record<string, RunInputValue>) => void
  classifyVariable?: (name: string) => InputFieldKind
  currencySymbol?: string
  labels?: Partial<RunInputDialogLabels>
}

/** "loanAmount", "loan_amount" and "loan-amount" read as "Loan amount". */
export function humaniseIdentifier(id: string): string {
  const words = id
    .replace(/([\p{Ll}\p{N}])(\p{Lu})/gu, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()
    .toLowerCase()
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : id
}

/** Declared inputs as names; objects with a name are reduced to it, anything else is stringified. */
export function declaredInputNames(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return raw.map((v) => {
    if (typeof v === 'string') return v
    if (v && typeof v === 'object' && typeof (v as { name?: unknown }).name === 'string') return (v as { name: string }).name
    return typeof v === 'object' ? JSON.stringify(v) : String(v)
  })
}

const fallbackStore = createFlowEditorStore()

function readStart(nodes: ReadonlyArray<{ kind: string; data: Record<string, unknown> }>) {
  const start = nodes.find((n) => n.kind === 'start')
  if (!start) return { names: [] as string[], defaults: {} as Record<string, unknown> }
  const cfg = (start.data.config && typeof start.data.config === 'object' ? start.data.config : start.data) as Record<string, unknown>
  const defaults = cfg.inputDefaults && typeof cfg.inputDefaults === 'object' ? (cfg.inputDefaults as Record<string, unknown>) : {}
  return { names: declaredInputNames(cfg.inputVariables), defaults }
}

export function RunInputDialog({ open, onClose, onRun, classifyVariable, currencySymbol, labels }: RunInputDialogProps) {
  const l = useLabels(runInputDialogLabels, labels)
  const store = useOptionalFlowEditorStore() ?? fallbackStore
  const nodes = useStoreSelector(store, (s) => s.nodes)
  const { names, defaults } = readStart(nodes)
  const formId = useId()
  const [values, setValues] = useState<Record<string, string | number | null>>({})

  // Every opening starts from the saved defaults.
  useEffect(() => {
    if (!open) return
    const seed: Record<string, string | number | null> = {}
    for (const n of names) {
      const d = defaults[n]
      seed[n] = d === undefined || d === null ? '' : typeof d === 'number' ? d : String(d)
    }
    setValues(seed)
    // Re-seed on open only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const kindOf = (n: string): InputFieldKind => classifyVariable?.(n) ?? 'text'
  const submit = (e?: FormEvent) => {
    e?.preventDefault()
    const out: Record<string, RunInputValue> = {}
    for (const n of names) {
      const v = values[n]
      if (kindOf(n) === 'text') out[n] = v === null || v === undefined ? '' : String(v)
      else {
        const num = typeof v === 'number' ? v : v === '' || v === null || v === undefined ? null : Number(v)
        out[n] = num === null || Number.isNaN(num) ? '' : num
      }
    }
    setValues({})
    onRun(out)
    onClose()
  }

  return (
    <ModalDialog
      isOpen={open}
      onOpenChange={(o) => {
        if (!o) onClose()
      }}
      title={l.title}
      description={l.subtitle}
      width="regular"
      actions={
        <>
          <Button variant="quiet" onPress={onClose}>
            {l.cancel}
          </Button>
          <Button variant="primary" type="submit" form={formId}>
            {l.run}
          </Button>
        </>
      }
    >
      <form id={formId} className="fk-run-form" onSubmit={submit} noValidate>
        {names.length === 0 ? <p className="fk-run-empty">{l.empty}</p> : null}
        {names.map((n, i) => {
          const kind = kindOf(n)
          const label = humaniseIdentifier(n)
          const hint = <code className="fk-run-mono">{n}</code>
          if (kind === 'text') {
            return (
              <TextField
                key={n}
                label={label}
                hint={hint}
                name={n}
                placeholder={l.valuePlaceholder}
                value={String(values[n] ?? '')}
                onChange={(v) => setValues((p) => ({ ...p, [n]: v }))}
                {...(i === 0 ? { autoFocus: true } : {})}
              />
            )
          }
          const raw = values[n]
          const num = typeof raw === 'number' ? raw : raw === '' || raw === null || raw === undefined ? null : Number(raw)
          return (
            <NumberInput
              key={n}
              name={n}
              label={label}
              hint={hint}
              integer={kind === 'count'}
              {...(kind === 'currency' && currencySymbol ? { prefix: currencySymbol } : {})}
              value={num === null || Number.isNaN(num) ? null : num}
              onChange={(v) => setValues((p) => ({ ...p, [n]: v }))}
              autoFocus={i === 0}
            />
          )
        })}
        {/* Enter in a single-line field submits the form. */}
        <button type="submit" hidden tabIndex={-1} aria-hidden="true" />
      </form>
    </ModalDialog>
  )
}
