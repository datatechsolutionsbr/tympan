// Shared footer of every node configuration form: a divider, then Cancel
// (secondary) and Save (primary) aligned to the end. Save is an explicit
// button; Enter in a single-line field never submits by itself.

import { Button } from '../../index'
import { defineLabels, useLabels } from '../internal/labels'

export interface NodeFormFooterLabels {
  save: string
  cancel: string
}

export const nodeFormFooterLabels = defineLabels<NodeFormFooterLabels>('NodeFormFooter', {
  en: { save: 'Save', cancel: 'Cancel' },
  'pt-BR': { save: 'Salvar', cancel: 'Cancelar' },
  es: { save: 'Guardar', cancel: 'Cancelar' },
})

export const defaultNodeFormFooterLabels: NodeFormFooterLabels = nodeFormFooterLabels.bundles.en

export interface NodeFormFooterProps {
  onSave: () => void
  onCancel: () => void
  saveDisabled?: boolean
  /** Id of the element explaining why Save is disabled. */
  disabledReasonId?: string
  labels?: Partial<NodeFormFooterLabels>
}

export function NodeFormFooter({ onSave, onCancel, saveDisabled = false, disabledReasonId, labels }: NodeFormFooterProps) {
  const l = useLabels(nodeFormFooterLabels, labels)
  return (
    <div className="ty-node-form-footer" data-ty-form-footer="">
      <Button variant="secondary" onPress={onCancel}>
        {l.cancel}
      </Button>
      <span className="ty-node-form-footer__save" aria-describedby={saveDisabled ? disabledReasonId : undefined}>
        <Button variant="primary" disabled={saveDisabled} onPress={onSave}>
          {l.save}
        </Button>
      </span>
    </div>
  )
}
