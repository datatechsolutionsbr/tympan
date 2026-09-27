// FlowSettingsDialog: edits a flow's name, description and (when the opener
// knows them) its slug and lifecycle switches. Save sends name and description
// always, and every other field only when it changed.

import { useEffect, useId, useState, type KeyboardEvent } from 'react'
import { Button, Fieldset, Switch, TextArea, TextField } from '../../index'
import { SectionedModal } from '../internal/SectionedModal'
import { defineLabels, useFlowLocale, useLabels } from '../internal/labels'
import { useActiveDialog, useDialogStack, type FlowSettingsPayload } from '../state/dialogStack'

export interface FlowSettingsPatch {
  name: string
  description: string
  slug?: string | null
  isDraft?: boolean
  isActive?: boolean
}

export interface FlowSettingsDialogLabels {
  eyebrow: string
  title: string
  subtitle: string
  name: string
  nameRequired: string
  description: string
  slug: string
  slugHint: string
  lifecycle: string
  draft: string
  draftOn: string
  draftOff: string
  active: string
  activeOn: string
  activeOff: string
  cancel: string
  save: string
  saving: string
}

export const flowSettingsDialogLabels = defineLabels<FlowSettingsDialogLabels>('FlowSettingsDialog', {
  en: {
    eyebrow: 'Flow',
    title: 'Flow settings',
    subtitle: 'Name, description and lifecycle of this flow.',
    name: 'Name',
    nameRequired: 'Give the flow a name.',
    description: 'Description',
    slug: 'Address name',
    slugHint: 'Leave blank to use the generated one.',
    lifecycle: 'Lifecycle',
    draft: 'Draft',
    draftOn: 'Editable; runs are not affected.',
    draftOff: 'Published: edits need a new version.',
    active: 'Active',
    activeOn: 'Listed and runnable.',
    activeOff: 'Archived: hidden from default listings.',
    cancel: 'Cancel',
    save: 'Save',
    saving: 'Saving',
  },
  'pt-BR': {
    eyebrow: 'Fluxo',
    title: 'Configurações do fluxo',
    subtitle: 'Nome, descrição e ciclo de vida deste fluxo.',
    name: 'Nome',
    nameRequired: 'Dê um nome ao fluxo.',
    description: 'Descrição',
    slug: 'Nome no endereço',
    slugHint: 'Deixe em branco para usar o gerado.',
    lifecycle: 'Ciclo de vida',
    draft: 'Rascunho',
    draftOn: 'Editável; execuções não são afetadas.',
    draftOff: 'Publicado: edições exigem nova versão.',
    active: 'Ativo',
    activeOn: 'Listado e executável.',
    activeOff: 'Arquivado: fora das listagens padrão.',
    cancel: 'Cancelar',
    save: 'Salvar',
    saving: 'Salvando',
  },
  es: {
    eyebrow: 'Flujo',
    title: 'Ajustes del flujo',
    subtitle: 'Nombre, descripción y ciclo de vida de este flujo.',
    name: 'Nombre',
    nameRequired: 'Dale un nombre al flujo.',
    description: 'Descripción',
    slug: 'Nombre en la dirección',
    slugHint: 'Déjalo en blanco para usar el generado.',
    lifecycle: 'Ciclo de vida',
    draft: 'Borrador',
    draftOn: 'Editable; las ejecuciones no se ven afectadas.',
    draftOff: 'Publicado: los cambios requieren una nueva versión.',
    active: 'Activo',
    activeOn: 'Listado y ejecutable.',
    activeOff: 'Archivado: oculto en los listados predeterminados.',
    cancel: 'Cancelar',
    save: 'Guardar',
    saving: 'Guardando',
  },
})
export const defaultFlowSettingsDialogLabels = flowSettingsDialogLabels.bundles.en

export interface FlowSettingsDialogProps {
  onSave: (patch: FlowSettingsPatch) => Promise<void>
  labels?: Partial<FlowSettingsDialogLabels>
}

/** What the person is editing; `undefined` switches are not offered. */
interface Sheet {
  name: string
  description: string
  slug: string
  isDraft?: boolean
  isActive?: boolean
}

const sheetFrom = (p: FlowSettingsPayload): Sheet => ({
  name: p.name,
  description: p.description,
  slug: p.slug ?? '',
  ...(p.isDraft !== undefined ? { isDraft: p.isDraft } : {}),
  ...(p.isActive !== undefined ? { isActive: p.isActive } : {}),
})

/** The patch for the edited values against the opening data. */
export function flowSettingsPatch(original: FlowSettingsPayload, edited: Sheet): FlowSettingsPatch {
  const patch: FlowSettingsPatch = { name: edited.name.trim(), description: edited.description.trim() }
  const newSlug = edited.slug.trim()
  if (original.slug !== undefined && newSlug !== (original.slug ?? '')) patch.slug = newSlug || null
  const flips = (['isDraft', 'isActive'] as const).filter((k) => original[k] !== undefined && edited[k] !== undefined && edited[k] !== original[k])
  for (const k of flips) patch[k] = edited[k]!
  return patch
}

/** Enter saves from single-line text inputs only (the description keeps its line breaks). */
const savesOnEnter = (e: KeyboardEvent<HTMLElement>) => e.key === 'Enter' && !e.shiftKey && e.target instanceof HTMLInputElement && (e.target.type === 'text' || e.target.type === '')

export function FlowSettingsDialog({ onSave, labels }: FlowSettingsDialogProps) {
  const l = useLabels(flowSettingsDialogLabels, labels)
  const { direction } = useFlowLocale()
  const opened = useActiveDialog<FlowSettingsPayload>('flow-settings')
  const stack = useDialogStack()
  const original = opened?.payload ?? null
  const [sheet, setSheet] = useState<Sheet>({ name: '', description: '', slug: '' })
  const [blankName, setBlankName] = useState(false)
  const [saving, setSaving] = useState(false)
  const draftNote = useId()
  const activeNote = useId()

  useEffect(() => {
    if (!original) return
    setSheet(sheetFrom(original))
    setBlankName(false)
    setSaving(false)
  }, [original])

  if (!original) return null
  const put = (change: Partial<Sheet>) => setSheet((s) => ({ ...s, ...change }))

  const commit = async () => {
    if (saving) return
    if (!sheet.name.trim()) return setBlankName(true)
    setSaving(true)
    try {
      await onSave(flowSettingsPatch(original, sheet))
      stack.close()
    } catch {
      // The host reports the error; the values stay for another try.
      setSaving(false)
    }
  }

  const switches = [
    { key: 'isDraft' as const, label: l.draft, on: l.draftOn, off: l.draftOff, noteId: draftNote },
    { key: 'isActive' as const, label: l.active, on: l.activeOn, off: l.activeOff, noteId: activeNote },
  ].filter((s) => sheet[s.key] !== undefined)

  return (
    <SectionedModal
      isOpen
      onOpenChange={(stillOpen) => {
        if (!stillOpen && !saving) stack.close()
      }}
      eyebrow={l.eyebrow}
      title={l.title}
      subtitle={l.subtitle}
      width="regular"
      busy={saving}
      className="ty-flow-settings"
      footer={
        <>
          <Button variant="secondary" onPress={() => stack.close()} disabled={saving}>
            {l.cancel}
          </Button>
          <Button variant="primary" busy={saving} busyLabel={l.saving} onPress={() => void commit()}>
            {l.save}
          </Button>
        </>
      }
    >
      <div
        className="ty-flow-settings__fields"
        dir={direction}
        onKeyDown={(e) => {
          if (!savesOnEnter(e)) return
          e.preventDefault()
          void commit()
        }}
      >
        <TextField
          label={l.name}
          value={sheet.name}
          required
          readOnly={saving}
          onChange={(name) => {
            put({ name })
            if (name.trim()) setBlankName(false)
          }}
          {...(blankName ? { errorMessage: l.nameRequired } : {})}
        />
        <TextArea label={l.description} value={sheet.description} onChange={(description) => put({ description })} readOnly={saving} rows={3} />
        {original.slug !== undefined && <TextField label={l.slug} hint={l.slugHint} value={sheet.slug} onChange={(slug) => put({ slug })} readOnly={saving} />}
        {switches.length > 0 && (
          <Fieldset legend={l.lifecycle}>
            {switches.map((s) => (
              <div key={s.key} className="ty-flow-settings__switch">
                <Switch
                  label={s.label}
                  isSelected={sheet[s.key]!}
                  onChange={(v) => put({ [s.key]: v })}
                  readOnly={saving}
                  description={<span id={s.noteId}>{sheet[s.key] ? s.on : s.off}</span>}
                />
              </div>
            ))}
          </Fieldset>
        )}
      </div>
    </SectionedModal>
  )
}
