// The conversation history side: a navigation landmark with "new
// conversation", the favourites filter and the threads grouped by day. Each
// row's actions are always visible (not hover-only) for keyboard and touch.

import { MessageSquarePlus, Star, Trash2 } from 'lucide-react'
import { ToggleButton } from 'react-aria-components'
import { Button } from '@fakhir/design-system'
import { fill, useFlowLocale, useLabels } from '../internal/labels'
import { assistantLabels, type AssistantLabels } from './AssistantConversation'
import { groupThreadsByDay, type DayBucket } from './threadDays'

export interface ThreadSummary {
  id: string
  title: string
  updatedAt: string | number | Date
  agents?: string[]
  flowId?: string
  flowName?: string
}

/** Host persistence for favourite threads. */
export interface StarredThreads {
  ids: string[]
  onChange: (ids: string[]) => void
}

const STAR_STORE = 'fk-assistant-favourites'

/** Favourites kept on this device when the host gives none; storage failures stay silent. */
export const deviceStarStore = {
  load(): string[] {
    try {
      const value: unknown = JSON.parse(window.localStorage.getItem(STAR_STORE) ?? '[]')
      return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : []
    } catch {
      return []
    }
  },
  save(ids: string[]): void {
    try {
      window.localStorage.setItem(STAR_STORE, JSON.stringify(ids))
    } catch {
      // Private mode or quota: favourites last for this visit only.
    }
  },
}

const AGENTS_VISIBLE = 3

/** The metadata line of a thread: short id, up to three agents and "+n". */
export function ThreadMetaLine({ id, agents = [], labels }: { id: string; agents?: string[]; labels?: Partial<AssistantLabels> }) {
  const l = useLabels(assistantLabels, labels)
  const { locale } = useFlowLocale()
  const extra = agents.length - AGENTS_VISIBLE
  return (
    <span className="fk-convo-meta">
      <code className="fk-convo-meta__id" title={id}>
        {id.slice(0, 8)}
      </code>
      {agents.slice(0, AGENTS_VISIBLE).map((agent) => (
        <span key={agent} className="fk-convo-meta__agent" dir="auto">
          {agent}
        </span>
      ))}
      {extra > 0 ? <span className="fk-convo-meta__more">{fill(l.moreAgents, { n: extra }, locale)}</span> : null}
    </span>
  )
}

export interface ThreadHistoryProps {
  threads: readonly ThreadSummary[]
  currentId: string | null
  starred: readonly string[]
  starredOnly: boolean
  zone?: string
  labels: AssistantLabels
  locale: string
  onStarredOnly: (on: boolean) => void
  onStar: (id: string, on: boolean) => void
  onOpen: (id: string) => void
  onRemove: (thread: ThreadSummary) => void
  onStart: () => void
}

export function ThreadHistory(p: ThreadHistoryProps) {
  const l = p.labels
  const shown = p.starredOnly ? p.threads.filter((t) => p.starred.includes(t.id)) : p.threads
  const heading: Record<DayBucket, string> = { today: l.today, yesterday: l.yesterday, lastWeek: l.lastWeek, older: l.older }
  const note = !p.threads.length ? l.historyEmpty : !shown.length ? l.noResults : null
  return (
    <nav className="fk-convo-history" aria-label={l.history}>
      <div className="fk-convo-history__tools">
        <Button variant="secondary" size="compact" leadingIcon={<MessageSquarePlus />} onPress={p.onStart}>
          {l.newConversation}
        </Button>
        <ToggleButton className="fk-convo-toggle" isSelected={p.starredOnly} onChange={p.onStarredOnly}>
          <Star aria-hidden="true" focusable="false" />
          <span>{l.favouritesOnly}</span>
        </ToggleButton>
      </div>
      {note ? <p className="fk-convo-history__empty">{note}</p> : null}
      {note
        ? null
        : groupThreadsByDay(shown, new Date(), p.zone).map((group) => {
            const headingId = `fk-convo-group-${group.bucket}`
            return (
              <section key={group.bucket} className="fk-convo-history__group" aria-labelledby={headingId}>
                <h3 id={headingId} className="fk-convo-history__group-title">
                  {heading[group.bucket]}
                </h3>
                <ul className="fk-convo-history__list">
                  {group.threads.map((t) => {
                    const current = t.id === p.currentId
                    return (
                      <li key={t.id} className="fk-convo-row" data-active={current || undefined}>
                        <button type="button" className="fk-convo-row__main" aria-current={current ? 'page' : undefined} title={t.title} onClick={() => p.onOpen(t.id)}>
                          <span className="fk-convo-row__title" dir="auto">
                            {t.title}
                          </span>
                          <ThreadMetaLine id={t.id} {...(t.agents ? { agents: t.agents } : {})} labels={l} />
                        </button>
                        <ToggleButton className="fk-convo-row__fav" aria-label={fill(l.favourite, { title: t.title }, p.locale)} isSelected={p.starred.includes(t.id)} onChange={(on) => p.onStar(t.id, on)}>
                          <Star aria-hidden="true" focusable="false" />
                        </ToggleButton>
                        <Button variant="quiet" size="compact" shape="circle" iconOnly accessibleLabel={fill(l.delete, { title: t.title }, p.locale)} leadingIcon={<Trash2 />} onPress={() => p.onRemove(t)} />
                      </li>
                    )
                  })}
                </ul>
              </section>
            )
          })}
    </nav>
  )
}
