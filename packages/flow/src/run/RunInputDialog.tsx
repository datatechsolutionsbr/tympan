// RunInputDialog: before a run starts, ask for a value for every input the
// flow's start step declares, pre-filled with its saved defaults each time the
// dialog opens.

import { useEffect, useId, useState, type FormEvent } from 'react'
import { Button, ModalDialog, TextField } from '@fakhir/design-system'
import { defineLabels, useLabels } from '../internal/labels'
import { createFlowEditorStore, useOptionalFlowEditorStore } from '../state/editorState'
import { useStoreSelector } from '../state/store'
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

/** "loanAmount", "loan_amount" and "loan-amount" read as "Loan amount" (any script's letter cases). */
export function humaniseIdentifier(id: string): string {
  const spaced = id
    .split(/(?<=[\p{Ll}\p{N}])(?=\p{Lu})|[_-]+/u)
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  return spaced ? spaced.charAt(0).toUpperCase() + spaced.slice(1) : id
}

/** Declared inputs as names; objects with a name are reduced to it, anything else is stringified. */
export function declaredInputNames(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return raw.map((item: unknown) => {
    if (typeof item === 'string') return item
    const named = item && typeof item === 'object' ? (item as { name?: unknown }).name : undefined
    if (typeof named === 'string') return named
    return typeof item === 'object' ? JSON.stringify(item) : String(item)
  })
}

type Raw = string | number | null
interface Declared {
  names: string[]
  saved: Record<string, unknown>
}

const NO_START: Declared = { names: [], saved: {} }

/** Inputs and saved defaults of the start step (config either nested or flat). */
function declaredBy(nodes: ReadonlyArray<{ kind: string; data: Record<string, unknown> }>): Declared {
  const start = nodes.find((n) => n.kind === 'start')
  if (!start) return NO_START
  const nested = start.data.config
  const cfg = (nested && typeof nested === 'object' ? nested : start.data) as Record<string, unknown>
  const saved = cfg.inputDefaults && typeof cfg.inputDefaults === 'object' ? (cfg.inputDefaults as Record<string, unknown>) : {}
  return { names: declaredInputNames(cfg.inputVariables), saved }
}

const seedOf = (saved: unknown): Raw => (saved === undefined || saved === null ? '' : typeof saved === 'number' ? saved : String(saved))
const numeric = (raw: Raw | undefined): number | null => {
  if (typeof raw === 'number') return raw
  if (raw === null || raw === undefined || raw === '') return null
  const n = Number(raw)
  return Number.isNaN(n) ? null : n
}
/** What `onRun` receives for a field: text as text, numbers as numbers, empty as an empty string. */
const outgoing = (kind: InputFieldKind, raw: Raw | undefined): RunInputValue => (kind === 'text' ? (raw === null || raw === undefined ? '' : String(raw)) : (numeric(raw) ?? ''))

const orphanStore = createFlowEditorStore()

export function RunInputDialog({ open, onClose, onRun, classifyVariable, currencySymbol, labels }: RunInputDialogProps) {
  const l = useLabels(runInputDialogLabels, labels)
  const nodes = useStoreSelector(useOptionalFlowEditorStore() ?? orphanStore, (s) => s.nodes)
  const { names, saved } = declaredBy(nodes)
  const formId = useId()
  const [entered, setEntered] = useState<Record<string, Raw>>({})
  const kindOf = (name: string): InputFieldKind => classifyVariable?.(name) ?? 'text'

  // Each opening starts again from the saved defaults.
  useEffect(() => {
    if (open) setEntered(Object.fromEntries(names.map((n) => [n, seedOf(saved[n])])))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const put = (name: string) => (v: Raw) => setEntered((prev) => ({ ...prev, [name]: v }))
  const send = (e?: FormEvent) => {
    e?.preventDefault()
    const inputs = Object.fromEntries(names.map((n) => [n, outgoing(kindOf(n), entered[n])]))
    setEntered({})
    onRun(inputs)
    onClose()
  }

  const fields = names.map((name, index) => {
    const kind = kindOf(name)
    const common = { label: humaniseIdentifier(name), hint: <code className="fk-run-mono">{name}</code>, name }
    return kind === 'text' ? (
      <TextField key={name} {...common} placeholder={l.valuePlaceholder} value={String(entered[name] ?? '')} onChange={put(name)} {...(index === 0 ? { autoFocus: true } : {})} />
    ) : (
      <NumberInput key={name} {...common} integer={kind === 'count'} {...(kind === 'currency' && currencySymbol ? { prefix: currencySymbol } : {})} value={numeric(entered[name])} onChange={put(name)} autoFocus={index === 0} />
    )
  })

  return (
    <ModalDialog
      isOpen={open}
      onOpenChange={(stillOpen) => (stillOpen ? undefined : onClose())}
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
      <form id={formId} className="fk-run-form" onSubmit={send} noValidate>
        {fields.length ? fields : <p className="fk-run-empty">{l.empty}</p>}
        {/* Lets Enter in a single-line field submit. */}
        <button type="submit" hidden tabIndex={-1} aria-hidden="true" />
      </form>
    </ModalDialog>
  )
}
