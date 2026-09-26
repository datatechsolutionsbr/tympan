// ConversationShell: the assistant's full-screen workspace. History of
// conversations at the inline start, the dialogue in the middle, and the live
// canvas at the inline end whenever the assistant has produced or opened a
// flow. On small screens history and canvas move into drawers.

import { useMemo, useReducer, useRef, type ComponentType, type ReactNode } from 'react'
import { History, MessageSquarePlus, Star, Trash2, X } from 'lucide-react'
import { ToggleButton } from 'react-aria-components'
import { Button, Drawer, useMediaQuery } from '@fakhir/design-system'
import * as editorGroup from '../editor'
import { useConfirm, type ConfirmFn } from '../internal/confirm'
import { fill, useFlowLocale, useLabels } from '../internal/labels'
import { AssistantConversation, assistantLabels, type AssistantLabels } from './AssistantConversation'
import { latestGraphArtifact, type AssistantChat } from './useAssistantChat'

export interface ConversationSummary {
  id: string
  title: string
  updatedAt: string | number | Date
  agents?: string[]
  boundFlowId?: string
  boundFlowName?: string
}

export type DateGroupKey = 'today' | 'yesterday' | 'lastWeek' | 'older'

const DAY_MS = 86_400_000

/** Calendar day of an instant in a time zone, counted in whole days since the epoch. */
function calendarDay(instant: Date, timeZone?: string): number {
  const [y, m, d] = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(instant).split('-').map(Number)
  return Math.floor(Date.UTC(y!, m! - 1, d!) / DAY_MS)
}

/** Age in calendar days → bucket. */
const BUCKETS: ReadonlyArray<[DateGroupKey, (age: number) => boolean]> = [
  ['today', (age) => age <= 0],
  ['yesterday', (age) => age === 1],
  ['lastWeek', (age) => age <= 7],
  ['older', () => true],
]

/**
 * Buckets conversations by calendar day in the given (or the device's) time
 * zone: today, yesterday, the 7 days before, older. Unparsable dates are
 * older; empty groups are left out; order inside a group is kept.
 */
export function groupConversationsByDate<C extends { updatedAt: string | number | Date }>(conversations: readonly C[], now: Date = new Date(), timeZone?: string): Array<{ key: DateGroupKey; items: C[] }> {
  const reference = calendarDay(now, timeZone)
  const bucketOf = (c: C): DateGroupKey => {
    const when = new Date(c.updatedAt)
    if (Number.isNaN(when.getTime())) return 'older'
    const age = reference - calendarDay(when, timeZone)
    return BUCKETS.find(([, fits]) => fits(age))![0]
  }
  const tagged = conversations.map((c) => [bucketOf(c), c] as const)
  return BUCKETS.map(([key]) => ({ key, items: tagged.filter(([k]) => k === key).map(([, c]) => c) })).filter((g) => g.items.length > 0)
}

const AGENTS_SHOWN = 3

/** The metadata line of a history row: short id and up to three agents plus "+n". */
export function ConversationMetaLine({ id, agents = [], labels }: { id: string; agents?: string[]; labels?: Partial<AssistantLabels> }) {
  const l = useLabels(assistantLabels, labels)
  const { locale } = useFlowLocale()
  const hidden = Math.max(0, agents.length - AGENTS_SHOWN)
  return (
    <span className="fk-convo-meta">
      <code className="fk-convo-meta__id" title={id}>
        {id.slice(0, 8)}
      </code>
      {agents.slice(0, AGENTS_SHOWN).map((name) => (
        <span key={name} className="fk-convo-meta__agent" dir="auto">
          {name}
        </span>
      ))}
      {hidden > 0 && <span className="fk-convo-meta__more">{fill(l.moreAgents, { n: hidden }, locale)}</span>}
    </span>
  )
}

export interface FavouritesAdapter {
  ids: string[]
  onChange: (ids: string[]) => void
}

const STARRED_KEY = 'fk-assistant-favourites'

/** Device storage for favourites; unavailable storage (private mode, quota) is silent. */
const deviceStars = {
  read(): string[] {
    try {
      const parsed: unknown = JSON.parse(window.localStorage.getItem(STARRED_KEY) ?? '[]')
      return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : []
    } catch {
      return []
    }
  },
  write(ids: string[]) {
    try {
      window.localStorage.setItem(STARRED_KEY, JSON.stringify(ids))
    } catch {
      // Favourites then live for this session only.
    }
  },
}

export interface GraphArtifact {
  toolCallId: string
  flowId?: string
  graph: Record<string, unknown>
}

export interface ConversationShellProps {
  chat: AssistantChat
  labels?: Partial<AssistantLabels>
  conversations: ConversationSummary[]
  onSelect: (id: string) => void
  onDelete: (id: string) => Promise<void> | void
  onNew: () => void
  suggestions?: string[]
  renderCanvas?: (artifact: GraphArtifact) => ReactNode
  banner?: ReactNode
  appMark?: ReactNode
  favourites?: FavouritesAdapter
  /** Time zone for the date groups (defaults to the device). */
  timeZone?: string
  /** Confirmation service (defaults to the nearest ConfirmProvider). */
  confirm?: ConfirmFn
  locale?: string
  currency?: string
  className?: string
}

/** Workspace view state: favourites filter, history drawer, own starred ids, and the dismissed canvas artifact. */
interface ShellView {
  starredOnly: boolean
  historyOpen: boolean
  ownStars: string[]
  closedArtifact: string | null
}
const alter = (v: ShellView, change: Partial<ShellView>): ShellView => ({ ...v, ...change })

function DefaultCanvas({ artifact, fallback }: { artifact: GraphArtifact; fallback: string }) {
  // FlowPreview comes from the editor group; looked up on the barrel so this
  // module does not require it at build time.
  const Preview = (editorGroup as unknown as { FlowPreview?: ComponentType<{ graph: unknown; label?: string }> }).FlowPreview
  return Preview ? <Preview graph={artifact.graph} label={artifact.flowId ?? fallback} /> : <p className="fk-convo-canvas__fallback">{fallback}</p>
}

interface RowProps {
  item: ConversationSummary
  current: boolean
  starred: boolean
  l: AssistantLabels
  locale: string
  onOpen: () => void
  onStar: (on: boolean) => void
  onDelete: () => void
}

function HistoryRow({ item, current, starred, l, locale, onOpen, onStar, onDelete }: RowProps) {
  return (
    <li className="fk-convo-row" data-active={current || undefined}>
      <button type="button" className="fk-convo-row__main" aria-current={current ? 'page' : undefined} title={item.title} onClick={onOpen}>
        <span className="fk-convo-row__title" dir="auto">
          {item.title}
        </span>
        <ConversationMetaLine id={item.id} {...(item.agents ? { agents: item.agents } : {})} labels={l} />
      </button>
      <ToggleButton className="fk-convo-row__fav" aria-label={fill(l.favourite, { title: item.title }, locale)} isSelected={starred} onChange={onStar}>
        <Star aria-hidden="true" focusable="false" />
      </ToggleButton>
      <Button variant="quiet" size="compact" shape="circle" iconOnly accessibleLabel={fill(l.delete, { title: item.title }, locale)} leadingIcon={<Trash2 />} onPress={onDelete} />
    </li>
  )
}

export function ConversationShell(props: ConversationShellProps) {
  const { chat, conversations, onSelect, onDelete, onNew, suggestions, renderCanvas, banner, appMark, timeZone, currency, className } = props
  const l = useLabels(assistantLabels, props.labels)
  const providerLocale = useFlowLocale().locale
  const locale = props.locale ?? providerLocale
  const askContext = useConfirm()
  const ask = props.confirm ?? askContext
  const roomy = useMediaQuery('(min-width: 640px)', true)
  const canvasBeside = useMediaQuery('(min-width: 768px)', true)
  const root = useRef<HTMLDivElement>(null)
  const [view, change] = useReducer(alter, undefined, (): ShellView => ({ starredOnly: false, historyOpen: false, ownStars: props.favourites ? [] : deviceStars.read(), closedArtifact: null }))

  const stars = props.favourites?.ids ?? view.ownStars
  const setStars = (ids: string[]) => {
    if (props.favourites) return props.favourites.onChange(ids)
    change({ ownStars: ids })
    deviceStars.write(ids)
  }

  const artifact = useMemo(() => latestGraphArtifact(chat.messages), [chat.messages])
  const canvasShown = artifact !== null && view.closedArtifact !== artifact.toolCallId
  const hideCanvas = () => {
    if (artifact) change({ closedArtifact: artifact.toolCallId })
    requestAnimationFrame(() => root.current?.querySelector<HTMLElement>('[data-fk-composer]')?.focus())
  }

  const listed = view.starredOnly ? conversations.filter((c) => stars.includes(c.id)) : conversations
  const bucketTitle: Record<DateGroupKey, string> = { today: l.today, yesterday: l.yesterday, lastWeek: l.lastWeek, older: l.older }

  const confirmDelete = async (c: ConversationSummary) => {
    const yes = await ask({ title: fill(l.deleteTitle, { title: c.title }, locale), message: l.deleteMessage, confirmLabel: l.confirmDelete, cancelLabel: l.cancel, tone: 'danger' })
    if (yes) await onDelete(c.id)
  }

  const emptyText = conversations.length === 0 ? l.historyEmpty : listed.length === 0 ? l.noResults : null
  const history = (
    <nav className="fk-convo-history" aria-label={l.history}>
      <div className="fk-convo-history__tools">
        <Button variant="secondary" size="compact" leadingIcon={<MessageSquarePlus />} onPress={onNew}>
          {l.newConversation}
        </Button>
        <ToggleButton className="fk-convo-toggle" isSelected={view.starredOnly} onChange={(on) => change({ starredOnly: on })}>
          <Star aria-hidden="true" focusable="false" />
          <span>{l.favouritesOnly}</span>
        </ToggleButton>
      </div>
      {emptyText !== null ? (
        <p className="fk-convo-history__empty">{emptyText}</p>
      ) : (
        groupConversationsByDate(listed, new Date(), timeZone).map(({ key, items }) => (
          <section key={key} className="fk-convo-history__group" aria-labelledby={`fk-convo-group-${key}`}>
            <h3 id={`fk-convo-group-${key}`} className="fk-convo-history__group-title">
              {bucketTitle[key]}
            </h3>
            <ul className="fk-convo-history__list">
              {items.map((c) => (
                <HistoryRow
                  key={c.id}
                  item={c}
                  current={c.id === chat.conversationId}
                  starred={stars.includes(c.id)}
                  l={l}
                  locale={locale}
                  onOpen={() => {
                    onSelect(c.id)
                    change({ historyOpen: false })
                  }}
                  onStar={(on) => setStars(on ? [...stars, c.id] : stars.filter((x) => x !== c.id))}
                  onDelete={() => void confirmDelete(c)}
                />
              ))}
            </ul>
          </section>
        ))
      )}
    </nav>
  )

  const canvasBody = artifact && (renderCanvas ? renderCanvas(artifact) : <DefaultCanvas artifact={artifact} fallback={l.canvasUnavailable} />)
  const canvas = !canvasShown ? null : canvasBeside ? (
    <aside className="fk-convo-canvas" aria-label={l.liveCanvas}>
      <header className="fk-convo-canvas__header">
        <h2 className="fk-convo-canvas__title">{l.liveCanvas}</h2>
        {artifact.flowId && (
          <code className="fk-convo-canvas__id" title={artifact.flowId}>
            {fill(l.flowId, { id: artifact.flowId.slice(0, 8) }, locale)}
          </code>
        )}
        <Button variant="quiet" size="compact" shape="circle" iconOnly accessibleLabel={l.closeCanvas} leadingIcon={<X />} onPress={hideCanvas} />
      </header>
      <div className="fk-convo-canvas__body">{canvasBody}</div>
    </aside>
  ) : (
    <Drawer open onOpenChange={(open) => (open ? undefined : hideCanvas())} title={l.liveCanvas} placement="bottom" maxHeight="100dvh">
      <div className="fk-convo-canvas__body">{canvasBody}</div>
    </Drawer>
  )

  return (
    <div ref={root} className={['fk-convo-shell', className].filter(Boolean).join(' ')} data-canvas={canvasShown && canvasBeside ? 'open' : undefined}>
      {roomy ? (
        history
      ) : (
        <Drawer open={view.historyOpen} onOpenChange={(open) => change({ historyOpen: open })} title={l.history} placement="bottom">
          {history}
        </Drawer>
      )}
      <div className="fk-convo-shell__centre">
        {!roomy && (
          <div className="fk-convo-shell__bar">
            <Button variant="secondary" size="compact" leadingIcon={<History />} onPress={() => change({ historyOpen: true })}>
              {l.openHistory}
            </Button>
          </div>
        )}
        {banner && <div className="fk-convo-shell__banner">{banner}</div>}
        <AssistantConversation
          chat={chat}
          labels={l}
          variant="full"
          {...(suggestions ? { suggestions } : {})}
          {...(appMark ? { appMark } : {})}
          canOpenCanvas={artifact !== null && !canvasShown}
          onOpenCanvas={() => change({ closedArtifact: null })}
          locale={locale}
          {...(currency ? { currency } : {})}
        />
      </div>
      {canvas}
    </div>
  )
}
