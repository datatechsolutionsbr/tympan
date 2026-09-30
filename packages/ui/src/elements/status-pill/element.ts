import { TyElement } from '../base.ts'
import { statusPillDefinition } from './definition.ts'

/**
 * The tone, busy state and English default label of each common status —
 * the React StatusPill's `builtInStatusMap` (whose labels come from the
 * messages catalogue). The map is runtime behaviour: a server rendering
 * (React SSR) passes `tone` and the label itself, and the map
 * only fills in what the host left out.
 */
const STATUS_MAP: Record<string, { tone: string; busy?: boolean; label: string }> = {
  pending: { tone: 'warning', label: 'Pending' },
  approved: { tone: 'success', label: 'Approved' },
  rejected: { tone: 'danger', label: 'Rejected' },
  active: { tone: 'success', label: 'Active' },
  inactive: { tone: 'neutral', label: 'Inactive' },
  processing: { tone: 'info', busy: true, label: 'Processing' },
  error: { tone: 'danger', label: 'Error' },
  success: { tone: 'success', label: 'Success' },
}

/**
 * `<ty-status-pill>`. Nothing interactive: the element applies the status
 * map to what the host left out (an explicit `tone` or `busy` wins) and,
 * built from plain HTML, fills an empty label from the `label` attribute,
 * the map's label or the status key. A framework-rendered label is never
 * touched — the framework owns it.
 */
export class TyStatusPillElement extends TyElement {
  static override definition = statusPillDefinition

  override sync(): void {
    super.sync()
    const root = this.anatomyRoot()
    if (!root) return
    const status = this.getAttribute('status') ?? ''
    const entry = STATUS_MAP[status]
    if (entry && !this.hasAttribute('tone')) root.setAttribute('data-tone', entry.tone)
    if (entry?.busy) root.setAttribute('data-busy', '')
    if (!entry && status && !this.hasAttribute('label')) {
      console.warn(`ty-status-pill: unknown status "${status}"; showing it as a neutral pill.`)
    }
    if (this.owned) {
      const label = root.querySelector('.ty-status__label')
      if (label && !(label.textContent ?? '').trim()) {
        label.textContent = this.getAttribute('label') || entry?.label || status
      }
    }
  }
}
