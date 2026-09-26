// State and rules behind VariableListEditor, kept apart from the markup.
//
// The editor's own state is only the entry being typed, a complaint about it
// and the last sentence for the live region; the list itself belongs to the
// host. `nameListStep` is a reducer over that small state.

export type NameIssue = 'blank' | 'duplicate'

/** Why the name at `position` would not survive a save, or null. */
export function issueAt(list: readonly string[], position: number): NameIssue | null {
  const candidate = list[position] ?? ''
  if (candidate.trim() === '') return 'blank'
  return list.indexOf(candidate) < position ? 'duplicate' : null
}

/**
 * Which remove control should hold focus once `position` has been taken out
 * of the list (`remaining` rows now). -1 means the entry field.
 */
export function focusTargetAfter(position: number, remaining: number): number {
  if (remaining === 0) return -1
  return Math.min(position, remaining - 1)
}

export interface EntryState {
  draft: string
  complaint: 'duplicate' | null
  spoken: { kind: 'added' | 'removed'; name: string } | null
}

export type EntryEvent =
  | { type: 'typed'; text: string }
  | { type: 'refused' }
  | { type: 'accepted'; name: string }
  | { type: 'dropped'; name: string }

export const EMPTY_ENTRY: EntryState = { draft: '', complaint: null, spoken: null }

export function nameListStep(state: EntryState, event: EntryEvent): EntryState {
  switch (event.type) {
    case 'typed':
      return { ...state, draft: event.text, complaint: null }
    case 'refused':
      return { ...state, complaint: 'duplicate' }
    case 'accepted':
      return { draft: '', complaint: null, spoken: { kind: 'added', name: event.name } }
    case 'dropped':
      return { ...state, spoken: { kind: 'removed', name: event.name } }
  }
}

/** Outcome of trying to add the current draft to `list`. */
export function admit(list: readonly string[], draft: string): { kind: 'empty' } | { kind: 'taken' } | { kind: 'ok'; name: string; next: string[] } {
  const name = draft.trim()
  if (!name) return { kind: 'empty' }
  if (list.includes(name)) return { kind: 'taken' }
  return { kind: 'ok', name, next: [...list, name] }
}

export const replaceAt = (list: readonly string[], position: number, name: string): string[] => list.map((n, i) => (i === position ? name : n))
export const withoutAt = (list: readonly string[], position: number): string[] => list.filter((_, i) => i !== position)
