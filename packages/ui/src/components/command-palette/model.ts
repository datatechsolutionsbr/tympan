// Pure model of CommandPalette: turns groups, scope, query, the actions
// sub-list and the recent store into a flat list of rows (for keyboard
// movement) grouped into sections (for rendering).
import type { ReactNode } from 'react'
import { fuzzyHit } from '../../internal/overlays-nav/fuzzy'
import { orderChoices, type ChoiceStat } from '../../internal/overlays-nav/recent'

export interface CommandAction {
  id: string
  label: string
  icon?: ReactNode
  shortcut?: string
  onSelect: () => void
}

export interface CommandItem {
  id: string
  label: string
  description?: string
  icon?: ReactNode
  /** Matched but not shown. */
  keywords?: string[]
  hint?: string
  shortcut?: string
  scopeId?: string
  actions?: CommandAction[]
  onSelect: () => void
}

export interface CommandGroup {
  id: string
  heading: string
  scopeId?: string
  items: CommandItem[]
}

export interface CommandScope {
  id: string
  label: string
  icon?: ReactNode
}

export type RowKind = 'item' | 'action' | 'fallback'

export interface Row {
  /** DOM-safe option key, unique in the list. */
  key: string
  kind: RowKind
  label: string
  description?: string
  icon?: ReactNode
  hint?: string
  shortcut?: string
  /** Matched label indices to mark. */
  marks: number[]
  item?: CommandItem
  run: () => void
}

export interface Section {
  key: string
  heading: string
  rows: Row[]
}

export interface ViewInput {
  groups: CommandGroup[]
  scope: string | null
  query: string
  /** Item whose actions sub-list is open. */
  subItem: CommandItem | null
  fallbackActions: CommandAction[]
  recent: ChoiceStat[]
  recentVisible: number
  headings: { recent: string; actionsFor: (label: string) => string; fallback: string }
  /** Locale for case folding and word breaks in matching. */
  locale?: string
}

const inScope = (scope: string | null, group: CommandGroup, item: CommandItem) =>
  scope === null || (item.scopeId ?? group.scopeId) === scope

const itemRow = (item: CommandItem, prefix: string, marks: number[] = []): Row => ({
  key: `${prefix}${item.id}`,
  kind: 'item',
  label: item.label,
  description: item.description,
  icon: item.icon,
  hint: item.hint,
  shortcut: item.shortcut,
  marks,
  item,
  run: item.onSelect,
})

const actionRow = (a: CommandAction, kind: RowKind, label = a.label): Row => ({
  key: `${kind}-${a.id}`,
  kind,
  label,
  icon: a.icon,
  shortcut: a.shortcut,
  marks: [],
  run: a.onSelect,
})

/** Best score of an item over its label, description, keywords and group heading. */
function scoreItem(query: string, item: CommandItem, heading: string, locale?: string): { score: number; marks: number[] } | null {
  const label = fuzzyHit(query, item.label, locale)
  let best = label ? label.score : -Infinity
  for (const other of [item.description, ...(item.keywords ?? []), heading]) {
    if (!other) continue
    const hit = fuzzyHit(query, other, locale)
    if (hit && hit.score - 1 > best) best = hit.score - 1
  }
  if (best === -Infinity) return null
  return { score: best, marks: label?.at ?? [] }
}

export function buildView(v: ViewInput): Section[] {
  if (v.subItem) {
    return [{ key: 'sub', heading: v.headings.actionsFor(v.subItem.label), rows: (v.subItem.actions ?? []).map((a) => actionRow(a, 'action')) }]
  }
  const q = v.query.trim()
  const sections: Section[] = []
  if (!q) {
    const byId = new Map<string, CommandItem>()
    for (const g of v.groups) for (const it of g.items) if (inScope(v.scope, g, it)) byId.set(it.id, it)
    const recentRows = orderChoices(v.recent)
      .map((r) => byId.get(r.id))
      .filter((it): it is CommandItem => !!it)
      .slice(0, v.recentVisible)
      .map((it) => itemRow(it, 'recent-'))
    if (recentRows.length) sections.push({ key: 'recent', heading: v.headings.recent, rows: recentRows })
    for (const g of v.groups) {
      const rows = g.items.filter((it) => inScope(v.scope, g, it)).map((it) => itemRow(it, `${g.id}-`))
      if (rows.length) sections.push({ key: g.id, heading: g.heading, rows })
    }
    return sections
  }
  for (const g of v.groups) {
    const scored = g.items
      .filter((it) => inScope(v.scope, g, it))
      .map((it) => ({ it, hit: scoreItem(q, it, g.heading, v.locale) }))
      .filter((x): x is { it: CommandItem; hit: { score: number; marks: number[] } } => x.hit !== null)
      .sort((a, b) => b.hit.score - a.hit.score)
    if (scored.length) sections.push({ key: g.id, heading: g.heading, rows: scored.map((x) => itemRow(x.it, `${g.id}-`, x.hit.marks)) })
  }
  if (!sections.length && v.fallbackActions.length) {
    sections.push({
      key: 'fallback',
      heading: v.headings.fallback,
      rows: v.fallbackActions.map((a) => actionRow(a, 'fallback', a.label.split('{query}').join(q))),
    })
  }
  return sections
}
