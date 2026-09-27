// Past threads, as a navigation landmark: a start button, a "starred only"
// toggle, then shelves of threads by calendar day. Every entry keeps its star
// and remove controls visible (never hover-only) so keyboard and touch reach
// them.

import type { ReactNode } from 'react'
import { MessageSquarePlus, Star, Trash2 } from 'lucide-react'
import { ToggleButton } from 'react-aria-components'
import { Button } from '../../index'
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

/** Host persistence for starred threads. */
export interface StarredThreads {
  ids: string[]
  onChange: (ids: string[]) => void
}

const PIN_KEY = 'ty-assistant-favourites'

function readPins(): string[] {
  const raw = window.localStorage.getItem(PIN_KEY)
  const parsed: unknown = raw ? JSON.parse(raw) : []
  return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : []
}

/** Stars kept in this browser when the host keeps none. Any storage error is swallowed. */
export const deviceStarStore = {
  load: (): string[] => {
    try {
      return readPins()
    } catch {
      return []
    }
  },
  save: (ids: string[]): void => {
    try {
      window.localStorage.setItem(PIN_KEY, JSON.stringify(ids))
    } catch {
      /* stars then live only as long as the page */
    }
  },
}

const SHOWN_AGENTS = 3

/** Short id, the first agents and a "+n" for the rest. */
export function ThreadMetaLine({ id, agents = [], labels }: { id: string; agents?: string[]; labels?: Partial<AssistantLabels> }) {
  const words = useLabels(assistantLabels, labels)
  const { locale } = useFlowLocale()
  const [visible, hidden] = [agents.slice(0, SHOWN_AGENTS), Math.max(0, agents.length - SHOWN_AGENTS)]
  return (
    <span className="ty-convo-meta">
      <code className="ty-convo-meta__id" title={id}>
        {id.slice(0, 8)}
      </code>
      {visible.map((name) => (
        <span key={name} className="ty-convo-meta__agent" dir="auto">
          {name}
        </span>
      ))}
      {hidden ? <span className="ty-convo-meta__more">{fill(words.moreAgents, { n: hidden }, locale)}</span> : null}
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

type Shelf = readonly [key: DayBucket, caption: string, entries: readonly ThreadSummary[]]

/** Shelves to draw, or the sentence to show instead of them. */
function arrange(p: ThreadHistoryProps): Shelf[] | string {
  if (!p.threads.length) return p.labels.historyEmpty
  const kept = p.starredOnly ? p.threads.filter((t) => p.starred.includes(t.id)) : [...p.threads]
  if (!kept.length) return p.labels.noResults
  return groupThreadsByDay(kept, new Date(), p.zone).map(({ bucket, threads }) => [bucket, p.labels[bucket], threads] as const)
}

/** The three parts of an entry, drawn in this order. */
const ENTRY_PARTS: ReadonlyArray<(t: ThreadSummary, p: ThreadHistoryProps) => ReactNode> = [
  (t, p) => (
    <button key="open" type="button" className="ty-convo-row__main" aria-current={t.id === p.currentId ? 'page' : undefined} title={t.title} onClick={() => p.onOpen(t.id)}>
      <span className="ty-convo-row__title" dir="auto">
        {t.title}
      </span>
      <ThreadMetaLine id={t.id} {...(t.agents ? { agents: t.agents } : {})} labels={p.labels} />
    </button>
  ),
  (t, p) => (
    <ToggleButton key="star" className="ty-convo-row__fav" aria-label={fill(p.labels.favourite, { title: t.title }, p.locale)} isSelected={p.starred.includes(t.id)} onChange={(on) => p.onStar(t.id, on)}>
      <Star aria-hidden="true" focusable="false" />
    </ToggleButton>
  ),
  (t, p) => <Button key="remove" variant="quiet" size="compact" shape="circle" iconOnly accessibleLabel={fill(p.labels.delete, { title: t.title }, p.locale)} leadingIcon={<Trash2 />} onPress={() => p.onRemove(t)} />,
]

function ShelfBlock({ shelf, p }: { shelf: Shelf; p: ThreadHistoryProps }) {
  const [key, caption, entries] = shelf
  const captionId = `ty-convo-group-${key}`
  return (
    <section className="ty-convo-history__group" aria-labelledby={captionId}>
      <h3 id={captionId} className="ty-convo-history__group-title">
        {caption}
      </h3>
      <ul className="ty-convo-history__list">
        {entries.map((t) => (
          <li key={t.id} className="ty-convo-row" data-active={t.id === p.currentId || undefined}>
            {ENTRY_PARTS.map((draw) => draw(t, p))}
          </li>
        ))}
      </ul>
    </section>
  )
}

export function ThreadHistory(props: ThreadHistoryProps) {
  const words = props.labels
  const layout = arrange(props)
  return (
    <nav className="ty-convo-history" aria-label={words.history}>
      <div className="ty-convo-history__tools">
        <Button variant="secondary" size="compact" leadingIcon={<MessageSquarePlus />} onPress={props.onStart}>
          {words.newConversation}
        </Button>
        <ToggleButton className="ty-convo-toggle" isSelected={props.starredOnly} onChange={props.onStarredOnly}>
          <Star aria-hidden="true" focusable="false" />
          <span>{words.favouritesOnly}</span>
        </ToggleButton>
      </div>
      {typeof layout === 'string' ? <p className="ty-convo-history__empty">{layout}</p> : layout.map((shelf) => <ShelfBlock key={shelf[0]} shelf={shelf} p={props} />)}
    </nav>
  )
}
