// GroupNodeForm: name, description and marker tone of a group frame. The tone
// is decorative; each swatch carries its tone word and the checked one also a
// check mark, so the choice never depends on colour.

import { useId, useState, type KeyboardEvent } from 'react'
import { Label, Radio, RadioGroup } from 'react-aria-components'
import { Check } from 'lucide-react'
import { TextArea, TextField } from '../../index'
import { defineLabels, useLabels } from '../internal/labels'
import { NodeFormFooter } from './NodeFormFooter'

/** Opaque tone name of a categorical token, never a raw colour. */
export type GroupTone = string

export const DEFAULT_GROUP_TONES: readonly GroupTone[] = ['categorical-1', 'categorical-2', 'categorical-3', 'categorical-4', 'categorical-5']

export interface GroupNodeFormLabels {
  name: string
  namePlaceholder: string
  nameRequired: string
  description: string
  descriptionPlaceholder: string
  tone: string
  toneNames: Record<string, string>
  save: string
  cancel: string
}

export const groupNodeFormLabels = defineLabels<GroupNodeFormLabels>('GroupNodeForm', {
  en: {
    name: 'Name',
    namePlaceholder: 'Group name',
    nameRequired: 'Give the group a name.',
    description: 'Description',
    descriptionPlaceholder: 'What these steps do together',
    tone: 'Marker colour',
    toneNames: { 'categorical-1': 'Blue', 'categorical-2': 'Orange', 'categorical-3': 'Green', 'categorical-4': 'Pink', 'categorical-5': 'Teal', neutral: 'Grey' },
    save: 'Save',
    cancel: 'Cancel',
  },
  'pt-BR': {
    name: 'Nome',
    namePlaceholder: 'Nome do grupo',
    nameRequired: 'Dê um nome ao grupo.',
    description: 'Descrição',
    descriptionPlaceholder: 'O que estas etapas fazem juntas',
    tone: 'Cor do marcador',
    toneNames: { 'categorical-1': 'Azul', 'categorical-2': 'Laranja', 'categorical-3': 'Verde', 'categorical-4': 'Rosa', 'categorical-5': 'Azul-petróleo', neutral: 'Cinza' },
    save: 'Salvar',
    cancel: 'Cancelar',
  },
  es: {
    name: 'Nombre',
    namePlaceholder: 'Nombre del grupo',
    nameRequired: 'Dé un nombre al grupo.',
    description: 'Descripción',
    descriptionPlaceholder: 'Lo que estos pasos hacen juntos',
    tone: 'Color del marcador',
    toneNames: { 'categorical-1': 'Azul', 'categorical-2': 'Naranja', 'categorical-3': 'Verde', 'categorical-4': 'Rosa', 'categorical-5': 'Verde azulado', neutral: 'Gris' },
    save: 'Guardar',
    cancel: 'Cancelar',
  },
})

export const defaultGroupNodeFormLabels: GroupNodeFormLabels = groupNodeFormLabels.bundles.en

export interface GroupNodeValue {
  label: string
  description?: string
  tone: GroupTone
  [key: string]: unknown
}

export interface GroupNodeFormProps {
  value: GroupNodeValue
  tones?: readonly GroupTone[]
  onSave: (value: GroupNodeValue) => void
  onCancel: () => void
  labels?: Partial<GroupNodeFormLabels>
}

export function GroupNodeForm({ value, tones = DEFAULT_GROUP_TONES, onSave, onCancel, labels }: GroupNodeFormProps) {
  const l = useLabels(groupNodeFormLabels, labels)
  const toneLabelId = useId()
  const [name, setName] = useState(value.label ?? '')
  const [description, setDescription] = useState(value.description ?? '')
  const [tone, setTone] = useState<GroupTone>(tones.includes(value.tone) ? value.tone : (tones[0] ?? 'neutral'))
  const [showError, setShowError] = useState(false)
  const blank = !name.trim()

  const save = () => {
    if (blank) {
      setShowError(true)
      return
    }
    const { description: _old, ...rest } = value
    const d = description.trim()
    onSave({ ...rest, label: name.trim(), tone, ...(d ? { description: d } : {}) })
  }

  const onNameKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && (e.target as HTMLElement).tagName === 'INPUT') {
      e.preventDefault()
      if (!blank) save()
      else setShowError(true)
    }
  }

  return (
    <div className="ty-node-form ty-group-form">
      <div onKeyDown={onNameKey}>
        <TextField
          label={l.name}
          required
          placeholder={l.namePlaceholder}
          value={name}
          onChange={setName}
          onBlur={() => setShowError(true)}
          {...(showError && blank ? { errorMessage: l.nameRequired } : {})}
        />
      </div>
      <TextArea label={l.description} placeholder={l.descriptionPlaceholder} rows={3} value={description} onChange={setDescription} />
      <RadioGroup className="ty-group-form__tones" value={tone} onChange={setTone} orientation="horizontal" aria-labelledby={toneLabelId}>
        <Label id={toneLabelId} className="ty-group-form__tones-label">
          {l.tone}
        </Label>
        <div className="ty-group-form__swatches">
          {tones.map((t) => {
            const word = l.toneNames[t] ?? t
            return (
              <Radio key={t} value={t} className="ty-group-form__swatch" aria-label={word}>
                {({ isSelected }) => (
                  <>
                    <span className="ty-group-form__chip" data-tone={t} aria-hidden="true">
                      {isSelected ? <Check className="ty-group-form__check" /> : null}
                    </span>
                    <span className="ty-group-form__word">{word}</span>
                  </>
                )}
              </Radio>
            )
          })}
        </div>
      </RadioGroup>
      <NodeFormFooter onSave={save} onCancel={onCancel} saveDisabled={blank} labels={{ save: l.save, cancel: l.cancel }} />
    </div>
  )
}
