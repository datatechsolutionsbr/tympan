// FlowSettingsDialog: a flow's identity (name, description, slug) and, when
// known, its lifecycle. Emits only what changed (name and description always).

import { useEffect, useId, useState, type KeyboardEvent } from 'react'
import { Button, Fieldset, Switch, TextArea, TextField } from '@fakhir/design-system'
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

/** The patch for the edited values against the opening data. */
export function flowSettingsPatch(original: FlowSettingsPayload, edited: { name: string; description: string; slug: string; isDraft?: boolean; isActive?: boolean }): FlowSettingsPatch {
  const patch: FlowSettingsPatch = { name: edited.name.trim(), description: edited.description.trim() }
  if (original.slug !== undefined) {
    const slug = edited.slug.trim()
    if (slug !== (original.slug ?? '')) patch.slug = slug === '' ? null : slug
  }
  if (original.isDraft !== undefined && edited.isDraft !== undefined && edited.isDraft !== original.isDraft) patch.isDraft = edited.isDraft
  if (original.isActive !== undefined && edited.isActive !== undefined && edited.isActive !== original.isActive) patch.isActive = edited.isActive
  return patch
}

export function FlowSettingsDialog({ onSave, labels }: FlowSettingsDialogProps) {
  const l = useLabels(flowSettingsDialogLabels, labels)
  const { direction } = useFlowLocale()
  const active = useActiveDialog<FlowSettingsPayload>('flow-settings')
  const stack = useDialogStack()
  const original = active?.payload ?? null
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [slug, setSlug] = useState('')
  const [isDraft, setDraft] = useState<boolean | undefined>(undefined)
  const [isActive, setActive] = useState<boolean | undefined>(undefined)
  const [nameError, setNameError] = useState(false)
  const [saving, setSaving] = useState(false)
  const draftId = useId()
  const activeId = useId()

  useEffect(() => {
    if (!original) return
    setName(original.name)
    setDescription(original.description)
    setSlug(original.slug ?? '')
    setDraft(original.isDraft)
    setActive(original.isActive)
    setNameError(false)
    setSaving(false)
  }, [original])

  if (!original) return null
  const hasLifecycle = original.slug !== undefined || original.isDraft !== undefined || original.isActive !== undefined

  const save = async () => {
    if (saving) return
    if (!name.trim()) {
      setNameError(true)
      return
    }
    setSaving(true)
    try {
      await onSave(flowSettingsPatch(original, { name, description, slug, isDraft, isActive }))
      stack.close()
    } catch {
      // The host shows the error; the dialog stays open for retry.
      setSaving(false)
    }
  }

  // Enter in a single-line field saves; the description (a text area) keeps Enter.
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const t = e.target as HTMLElement
    if (e.key === 'Enter' && !e.shiftKey && t instanceof HTMLInputElement && (t.type === 'text' || t.type === '')) {
      e.preventDefault()
      void save()
    }
  }

  return (
    <SectionedModal
      isOpen
      onOpenChange={(open) => {
        if (!open && !saving) stack.close()
      }}
      eyebrow={l.eyebrow}
      title={l.title}
      subtitle={l.subtitle}
      width="regular"
      busy={saving}
      className="fk-flow-settings"
      footer={
        <>
          <Button variant="secondary" onPress={() => stack.close()} disabled={saving}>
            {l.cancel}
          </Button>
          <Button variant="primary" busy={saving} busyLabel={l.saving} onPress={() => void save()}>
            {l.save}
          </Button>
        </>
      }
    >
      <div className="fk-flow-settings__fields" dir={direction} onKeyDown={onKeyDown}>
        <TextField
          label={l.name}
          value={name}
          required
          readOnly={saving}
          onChange={(v) => {
            setName(v)
            if (v.trim()) setNameError(false)
          }}
          {...(nameError ? { errorMessage: l.nameRequired } : {})}
        />
        <TextArea label={l.description} value={description} onChange={setDescription} readOnly={saving} rows={3} />
        {hasLifecycle ? (
          <>
            {original.slug !== undefined ? <TextField label={l.slug} hint={l.slugHint} value={slug} onChange={setSlug} readOnly={saving} /> : null}
            {original.isDraft !== undefined || original.isActive !== undefined ? (
              <Fieldset legend={l.lifecycle}>
                {isDraft !== undefined ? (
                  <div className="fk-flow-settings__switch">
                    <Switch label={l.draft} isSelected={isDraft} onChange={setDraft} readOnly={saving} description={<span id={draftId}>{isDraft ? l.draftOn : l.draftOff}</span>} />
                  </div>
                ) : null}
                {isActive !== undefined ? (
                  <div className="fk-flow-settings__switch">
                    <Switch label={l.active} isSelected={isActive} onChange={setActive} readOnly={saving} description={<span id={activeId}>{isActive ? l.activeOn : l.activeOff}</span>} />
                  </div>
                ) : null}
              </Fieldset>
            ) : null}
          </>
        ) : null}
      </div>
    </SectionedModal>
  )
}
