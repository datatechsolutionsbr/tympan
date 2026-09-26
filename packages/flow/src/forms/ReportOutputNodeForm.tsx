// ReportOutputNodeForm: the terminal step that publishes a report, either
// pointing at a report an earlier step produced, or holding a fixed report
// definition written inline, with an optional live preview.

import { useId, useMemo, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Button as AriaButton, Radio, RadioGroup, Label } from 'react-aria-components'
import { EmptyState, TextArea, TextField } from '@fakhir/design-system'
import { defineLabels, fill, useFlowLocale, useLabels } from '../internal/labels'
import { ReportView, validateReport, type ReportIssue, type ReportSpec } from '../report/ReportView'
import { NodeFormFooter } from './NodeFormFooter'

export interface ReportOutputNodeFormLabels {
  source: string
  fromStep: string
  inline: string
  reference: string
  referenceHint: string
  definition: string
  definitionHint: string
  parseError: string
  preview: string
  previewEmpty: string
  previewInvalid: string
  previewNeedsRun: string
  save: string
  cancel: string
}

export const reportOutputNodeFormLabels = defineLabels<ReportOutputNodeFormLabels>('ReportOutputNodeForm', {
  en: {
    source: 'Report source',
    fromStep: 'From an earlier step',
    inline: 'Inline definition',
    reference: 'Report reference',
    referenceHint: 'Path to a report produced upstream, for example step1.report.',
    definition: 'Report definition',
    definitionHint: 'Structured text (JSON) with a list of sections.',
    parseError: 'This text is not valid structured data: {message}',
    preview: 'Preview',
    previewEmpty: 'Write a definition to see its preview.',
    previewInvalid: 'The definition has no section to show yet.',
    previewNeedsRun: 'The preview of a report from an earlier step needs a run.',
    save: 'Save',
    cancel: 'Cancel',
  },
  'pt-BR': {
    source: 'Origem do relatório',
    fromStep: 'De uma etapa anterior',
    inline: 'Definição própria',
    reference: 'Referência do relatório',
    referenceHint: 'Caminho de um relatório produzido antes, por exemplo etapa1.relatorio.',
    definition: 'Definição do relatório',
    definitionHint: 'Texto estruturado (JSON) com uma lista de seções.',
    parseError: 'Este texto não é um dado estruturado válido: {message}',
    preview: 'Prévia',
    previewEmpty: 'Escreva uma definição para ver a prévia.',
    previewInvalid: 'A definição ainda não tem seção para mostrar.',
    previewNeedsRun: 'A prévia de um relatório de etapa anterior precisa de uma execução.',
    save: 'Salvar',
    cancel: 'Cancelar',
  },
  es: {
    source: 'Origen del informe',
    fromStep: 'De un paso anterior',
    inline: 'Definición propia',
    reference: 'Referencia del informe',
    referenceHint: 'Ruta de un informe producido antes, por ejemplo paso1.informe.',
    definition: 'Definición del informe',
    definitionHint: 'Texto estructurado (JSON) con una lista de secciones.',
    parseError: 'Este texto no es un dato estructurado válido: {message}',
    preview: 'Vista previa',
    previewEmpty: 'Escriba una definición para ver la vista previa.',
    previewInvalid: 'La definición aún no tiene secciones para mostrar.',
    previewNeedsRun: 'La vista previa de un informe de un paso anterior necesita una ejecución.',
    save: 'Guardar',
    cancel: 'Cancelar',
  },
})

export const defaultReportOutputNodeFormLabels: ReportOutputNodeFormLabels = reportOutputNodeFormLabels.bundles.en

export type ReportOutputConfig = { kind: 'report-output'; from: string } | { kind: 'report-output'; report: Record<string, unknown> }

export interface ReportOutputNodeFormProps {
  value: { from?: string; report?: Record<string, unknown>; [key: string]: unknown }
  validate?: (spec: unknown) => ReportIssue[]
  onSave: (value: ReportOutputConfig) => void
  onCancel: () => void
  labels?: Partial<ReportOutputNodeFormLabels>
}

type Parsed = { ok: true; value: Record<string, unknown> | null } | { ok: false; message: string }

function parse(text: string): Parsed {
  if (!text.trim()) return { ok: true, value: null }
  try {
    const v = JSON.parse(text) as unknown
    if (!v || typeof v !== 'object' || Array.isArray(v)) return { ok: false, message: 'object expected' }
    return { ok: true, value: v as Record<string, unknown> }
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) }
  }
}

export function ReportOutputNodeForm({ value, validate = validateReport, onSave, onCancel, labels }: ReportOutputNodeFormProps) {
  const l = useLabels(reportOutputNodeFormLabels, labels)
  const { locale } = useFlowLocale()
  const previewId = useId()
  const [mode, setMode] = useState<'reference' | 'inline'>(value.report ? 'inline' : 'reference')
  const [from, setFrom] = useState(value.from ?? '')
  const [text, setText] = useState(() => (value.report ? JSON.stringify(value.report, null, 2) : ''))
  const [previewOpen, setPreviewOpen] = useState(false)
  const [showError, setShowError] = useState(false)
  const parsed = useMemo(() => parse(text), [text])
  const issues = parsed.ok && parsed.value ? validate(parsed.value) : null

  const save = () => {
    if (mode === 'reference') return onSave({ kind: 'report-output', from: from.trim() })
    if (!parsed.ok) {
      setShowError(true)
      return
    }
    onSave({ kind: 'report-output', report: parsed.value ?? {} })
  }

  const preview =
    mode === 'reference' ? (
      <EmptyState framing="inline" title={l.previewNeedsRun} />
    ) : !parsed.ok || !parsed.value ? (
      <EmptyState framing="inline" title={parsed.ok ? l.previewEmpty : l.previewInvalid} />
    ) : issues && issues.length ? (
      <EmptyState framing="inline" title={l.previewInvalid} />
    ) : (
      <ReportView spec={parsed.value as unknown as ReportSpec} locale={locale} headingLevel={4} />
    )

  return (
    <div className="fk-node-form fk-report-form">
      <RadioGroup className="fk-report-form__source" value={mode} onChange={(m) => setMode(m as 'reference' | 'inline')} orientation="horizontal">
        <Label className="fk-report-form__label">{l.source}</Label>
        <div className="fk-report-form__radios">
          <Radio value="reference" className="fk-report-form__radio">
            {l.fromStep}
          </Radio>
          <Radio value="inline" className="fk-report-form__radio">
            {l.inline}
          </Radio>
        </div>
      </RadioGroup>
      {mode === 'reference' ? (
        <TextField className="fk-ltr-text" label={l.reference} hint={l.referenceHint} value={from} onChange={setFrom} />
      ) : (
        <TextArea
          className="fk-ltr-text"
          monospace
          rows={8}
          label={l.definition}
          hint={l.definitionHint}
          value={text}
          onChange={(t) => {
            setText(t)
            setShowError(false)
          }}
          {...(!parsed.ok && (showError || text.trim()) ? { errorMessage: fill(l.parseError, { message: parsed.message }, locale) } : {})}
        />
      )}
      <div className="fk-report-form__preview">
        <AriaButton className="fk-report-form__toggle" aria-expanded={previewOpen} aria-controls={previewId} onPress={() => setPreviewOpen((o) => !o)}>
          <ChevronDown className="fk-report-form__chevron" data-open={previewOpen || undefined} aria-hidden="true" focusable="false" />
          {l.preview}
        </AriaButton>
        <section id={previewId} aria-label={l.preview} className="fk-report-form__preview-body" hidden={!previewOpen}>
          {previewOpen ? preview : null}
        </section>
      </div>
      <NodeFormFooter onSave={save} onCancel={onCancel} labels={{ save: l.save, cancel: l.cancel }} />
    </div>
  )
}
