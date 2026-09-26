// ConversationShell: full-screen assistant workspace. History at the inline
// start (a Drawer below the small breakpoint), the dialogue in the centre and
// a live canvas at the inline end (a full-screen Drawer below the medium
// breakpoint) that opens when the assistant produces or reads a flow.

import { useMemo, useRef, useState, type ComponentType, type ReactNode } from 'react'
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

/** Calendar day of `d` in `timeZone`, as a day number (UTC days since epoch). */
function dayNumber(d: Date, timeZone?: string): number {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(d)
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value)
  return Math.floor(Date.UTC(get('year'), get('month') - 1, get('day')) / 86_400_000)
}

/**
 * Buckets conversations by calendar day in the given (or the device's) time
 * zone: today, yesterday, the 7 days before, older. Unparsable dates are
 * older; empty groups are left out; order inside a group is kept.
 */
export function groupConversationsByDate<C extends { updatedAt: string | number | Date }>(conversations: readonly C[], now: Date = new Date(), timeZone?: string): Array<{ key: DateGroupKey; items: C[] }> {
  const today = dayNumber(now, timeZone)
  const groups: Record<DateGroupKey, C[]> = { today: [], yesterday: [], lastWeek: [], older: [] }
  for (const c of conversations) {
    const d = new Date(c.updatedAt)
    if (Number.isNaN(d.getTime())) {
      groups.older.push(c)
      continue
    }
    const age = today - dayNumber(d, timeZone)
    groups[age <= 0 ? 'today' : age === 1 ? 'yesterday' : age <= 7 ? 'lastWeek' : 'older'].push(c)
  }
  return (['today', 'yesterday', 'lastWeek', 'older'] as const).filter((k) => groups[k].length).map((key) => ({ key, items: groups[key] }))
}

/** The metadata line of a history row: short id and up to three agents plus "+n". */
export function ConversationMetaLine({ id, agents = [], labels }: { id: string; agents?: string[]; labels?: Partial<AssistantLabels> }) {
  const l = useLabels(assistantLabels, labels)
  const { locale } = useFlowLocale()
  const shown = agents.slice(0, 3)
  const extra = agents.length - shown.length
  return (
    <span className="fk-convo-meta">
      <code className="fk-convo-meta__id">{id.slice(0, 8)}</code>
      {shown.map((a) => (
        <span key={a} className="fk-convo-meta__agent" dir="auto">
          {a}
        </span>
      ))}
      {extra > 0 ? <span className="fk-convo-meta__more">{fill(l.moreAgents, { n: extra }, locale)}</span> : null}
    </span>
  )
}

export interface FavouritesAdapter {
  ids: string[]
  onChange: (ids: string[]) => void
}

const FAVOURITES_KEY = 'fk-assistant-favourites'

function useFavourites(adapter?: FavouritesAdapter): FavouritesAdapter {
  const [own, setOwn] = useState<string[]>(() => {
    try {
      const raw = window.localStorage.getItem(FAVOURITES_KEY)
      const parsed: unknown = raw ? JSON.parse(raw) : []
      return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : []
    } catch {
      return []
    }
  })
  if (adapter) return adapter
  return {
    ids: own,
    onChange(ids) {
      setOwn(ids)
      try {
        window.localStorage.setItem(FAVOURITES_KEY, JSON.stringify(ids))
      } catch {
        // Storage may be unavailable (private mode, quota); favourites stay for the session.
      }
    },
  }
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

interface PreviewProps {
  graph: unknown
  label?: string
}

function DefaultCanvas({ artifact, fallback }: { artifact: GraphArtifact; fallback: string }) {
  // FlowPreview belongs to the editor group; read it from the barrel so this
  // module does not depend on its presence at build time.
  const Preview = (editorGroup as unknown as { FlowPreview?: ComponentType<PreviewProps> }).FlowPreview
  if (!Preview) return <p className="fk-convo-canvas__fallback">{fallback}</p>
  return <Preview graph={artifact.graph} label={artifact.flowId ?? fallback} />
}

export function ConversationShell(props: ConversationShellProps) {
  const { chat, conversations, onSelect, onDelete, onNew, suggestions, renderCanvas, banner, appMark, timeZone, locale, currency, className } = props
  const l = useLabels(assistantLabels, props.labels)
  const { locale: providerLocale } = useFlowLocale()
  const loc = locale ?? providerLocale
  const contextConfirm = useConfirm()
  const confirm = props.confirm ?? contextConfirm
  const favourites = useFavourites(props.favourites)
  const [onlyFavourites, setOnlyFavourites] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const wide = useMediaQuery('(min-width: 640px)', true)
  const medium = useMediaQuery('(min-width: 768px)', true)
  const rootRef = useRef<HTMLDivElement>(null)

  const artifact = useMemo(() => latestGraphArtifact(chat.messages), [chat.messages])
  const [dismissed, setDismissed] = useState<string | null>(null)
  const canvasOpen = !!artifact && dismissed !== artifact.toolCallId
  const closeCanvas = () => {
    if (artifact) setDismissed(artifact.toolCallId)
    requestAnimationFrame(() => rootRef.current?.querySelector<HTMLElement>('[data-fk-composer]')?.focus())
  }

  const visible = onlyFavourites ? conversations.filter((c) => favourites.ids.includes(c.id)) : conversations
  const groups = groupConversationsByDate(visible, new Date(), timeZone)
  const groupTitle: Record<string, string> = { today: l.today, yesterday: l.yesterday, lastWeek: l.lastWeek, older: l.older }

  const remove = async (c: ConversationSummary) => {
    const ok = await confirm({ title: fill(l.deleteTitle, { title: c.title }, loc), message: l.deleteMessage, confirmLabel: l.confirmDelete, cancelLabel: l.cancel, tone: 'danger' })
    if (ok) await onDelete(c.id)
  }

  const history = (
    <nav className="fk-convo-history" aria-label={l.history}>
      <div className="fk-convo-history__tools">
        <Button variant="secondary" size="compact" leadingIcon={<MessageSquarePlus />} onPress={onNew}>
          {l.newConversation}
        </Button>
        <ToggleButton className="fk-convo-toggle" isSelected={onlyFavourites} onChange={setOnlyFavourites}>
          <Star aria-hidden="true" focusable="false" />
          <span>{l.favouritesOnly}</span>
        </ToggleButton>
      </div>
      {!conversations.length ? (
        <p className="fk-convo-history__empty">{l.historyEmpty}</p>
      ) : !visible.length ? (
        <p className="fk-convo-history__empty">{l.noResults}</p>
      ) : (
        groups.map((g) => (
          <section key={g.key} className="fk-convo-history__group" aria-labelledby={`fk-convo-group-${g.key}`}>
            <h3 id={`fk-convo-group-${g.key}`} className="fk-convo-history__group-title">
              {groupTitle[g.key]}
            </h3>
            <ul className="fk-convo-history__list">
              {g.items.map((c) => {
                const active = c.id === chat.conversationId
                const fav = favourites.ids.includes(c.id)
                return (
                  <li key={c.id} className="fk-convo-row" data-active={active || undefined}>
                    <button
                      type="button"
                      className="fk-convo-row__main"
                      aria-current={active ? 'page' : undefined}
                      title={c.title}
                      onClick={() => {
                        onSelect(c.id)
                        setHistoryOpen(false)
                      }}
                    >
                      <span className="fk-convo-row__title" dir="auto">
                        {c.title}
                      </span>
                      <ConversationMetaLine id={c.id} {...(c.agents ? { agents: c.agents } : {})} labels={l} />
                    </button>
                    <ToggleButton
                      className="fk-convo-row__fav"
                      aria-label={fill(l.favourite, { title: c.title }, loc)}
                      isSelected={fav}
                      onChange={(on) => favourites.onChange(on ? [...favourites.ids, c.id] : favourites.ids.filter((x) => x !== c.id))}
                    >
                      <Star aria-hidden="true" focusable="false" />
                    </ToggleButton>
                    <Button variant="quiet" size="compact" shape="circle" iconOnly accessibleLabel={fill(l.delete, { title: c.title }, loc)} leadingIcon={<Trash2 />} onPress={() => void remove(c)} />
                  </li>
                )
              })}
            </ul>
          </section>
        ))
      )}
    </nav>
  )

  const canvasBody = artifact ? renderCanvas ? renderCanvas(artifact) : <DefaultCanvas artifact={artifact} fallback={l.canvasUnavailable} /> : null

  return (
    <div ref={rootRef} className={['fk-convo-shell', className].filter(Boolean).join(' ')} data-canvas={canvasOpen && medium ? 'open' : undefined}>
      {wide ? (
        history
      ) : (
        <Drawer open={historyOpen} onOpenChange={setHistoryOpen} title={l.history} placement="bottom">
          {history}
        </Drawer>
      )}
      <div className="fk-convo-shell__centre">
        {!wide ? (
          <div className="fk-convo-shell__bar">
            <Button variant="secondary" size="compact" leadingIcon={<History />} onPress={() => setHistoryOpen(true)}>
              {l.openHistory}
            </Button>
          </div>
        ) : null}
        {banner ? <div className="fk-convo-shell__banner">{banner}</div> : null}
        <AssistantConversation
          chat={chat}
          labels={l}
          variant="full"
          {...(suggestions ? { suggestions } : {})}
          {...(appMark ? { appMark } : {})}
          canOpenCanvas={!!artifact && !canvasOpen}
          onOpenCanvas={() => setDismissed(null)}
          locale={loc}
          {...(currency ? { currency } : {})}
        />
      </div>
      {artifact && canvasOpen ? (
        medium ? (
          <aside className="fk-convo-canvas" aria-label={l.liveCanvas}>
            <header className="fk-convo-canvas__header">
              <h2 className="fk-convo-canvas__title">{l.liveCanvas}</h2>
              {artifact.flowId ? <code className="fk-convo-canvas__id">{fill(l.flowId, { id: artifact.flowId.slice(0, 8) }, loc)}</code> : null}
              <Button variant="quiet" size="compact" shape="circle" iconOnly accessibleLabel={l.closeCanvas} leadingIcon={<X />} onPress={closeCanvas} />
            </header>
            <div className="fk-convo-canvas__body">{canvasBody}</div>
          </aside>
        ) : (
          <Drawer open onOpenChange={(o) => (o ? undefined : closeCanvas())} title={l.liveCanvas} placement="bottom" maxHeight="100dvh">
            <div className="fk-convo-canvas__body">{canvasBody}</div>
          </Drawer>
        )
      ) : null}
    </div>
  )
}
