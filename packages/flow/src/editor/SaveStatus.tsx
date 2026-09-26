// SaveStatus: whether the editor is saving, has saved, or failed to save.
// The status region stays mounted while idle so the next change is announced.

import { CircleAlert, CircleCheck, LoaderCircle } from 'lucide-react'
import { defineLabels, useLabels } from '../internal/labels'

export type SaveState = 'idle' | 'saving' | 'saved' | 'error'

export interface SaveStatusLabels {
  saving: string
  saved: string
  error: string
}

export const saveStatusLabels = defineLabels<SaveStatusLabels>('SaveStatus', {
  en: { saving: 'Saving', saved: 'Saved', error: 'Not saved' },
  'pt-BR': { saving: 'Salvando', saved: 'Salvo', error: 'Não salvo' },
  es: { saving: 'Guardando', saved: 'Guardado', error: 'No guardado' },
})
export const defaultSaveStatusLabels: SaveStatusLabels = saveStatusLabels.bundles.en

export interface SaveStatusProps {
  status: SaveState
  labels?: Partial<SaveStatusLabels>
  /** Show the word visibly (default). When false it stays available to assistive technology. */
  showLabel?: boolean
  className?: string
}

const GLYPH = { saving: LoaderCircle, saved: CircleCheck, error: CircleAlert } as const

export function SaveStatus({ status, labels, showLabel = true, className }: SaveStatusProps) {
  const l = useLabels(saveStatusLabels, labels)
  const Glyph = status === 'idle' ? null : GLYPH[status]
  return (
    <span className={['ty-save-status', className].filter(Boolean).join(' ')} role="status" aria-live="polite" data-status={status}>
      {Glyph ? (
        <>
          <Glyph className="ty-save-status__glyph" aria-hidden="true" focusable="false" />
          <span className={showLabel ? 'ty-save-status__word' : 'ty-visually-hidden'}>{l[status as Exclude<SaveState, 'idle'>]}</span>
        </>
      ) : null}
    </span>
  )
}
