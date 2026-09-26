// ConversationShell: the assistant's full-screen workspace, assembled from
// three regions: the thread history (inline start), the dialogue (centre) and
// the live canvas (inline end) when the assistant produced or opened a flow.
// Below the small breakpoint the history lives in a drawer; below the medium
// one the canvas does.

import { useMemo, useReducer, useRef, type ReactNode } from 'react'
import { History } from 'lucide-react'
import { Button, Drawer, useMediaQuery } from '@fakhir/ui'
import { useConfirm, type ConfirmFn } from '../internal/confirm'
import { fill, useFlowLocale, useLabels } from '../internal/labels'
import { AssistantConversation, assistantLabels, type AssistantLabels } from './AssistantConversation'
import { LiveCanvasPanel } from './LiveCanvasPanel'
import { deviceStarStore, ThreadHistory, type StarredThreads, type ThreadSummary } from './ThreadHistory'
import { newestFlowArtifact, type AssistantSession, type FlowArtifact } from './useAssistantSession'

export interface ConversationShellProps {
  session: AssistantSession
  threads: ThreadSummary[]
  onOpenThread: (id: string) => void
  onRemoveThread: (id: string) => Promise<void> | void
  onStartThread: () => void
  labels?: Partial<AssistantLabels>
  suggestions?: string[]
  /** Mounts the real editor for a flow artifact; a read-only preview otherwise. */
  renderCanvas?: (artifact: FlowArtifact) => ReactNode
  banner?: ReactNode
  appMark?: ReactNode
  starred?: StarredThreads
  /** Time zone of the day groups (the device's by default). */
  timeZone?: string
  /** Confirmation service (the nearest ConfirmProvider by default). */
  confirm?: ConfirmFn
  locale?: string
  currency?: string
  className?: string
}

interface Workspace {
  starredOnly: boolean
  historyDrawer: boolean
  localStars: string[]
  /** Artifact the person closed; a newer one opens the canvas again. */
  dismissed: string | null
}

type WorkspaceMove = { set: Partial<Workspace> }

const workspaceReducer = (w: Workspace, m: WorkspaceMove): Workspace => ({ ...w, ...m.set })

export function ConversationShell(props: ConversationShellProps) {
  const { session, threads, timeZone, currency } = props
  const l = useLabels(assistantLabels, props.labels)
  const fromProvider = useFlowLocale().locale
  const locale = props.locale ?? fromProvider
  const contextConfirm = useConfirm()
  const confirm = props.confirm ?? contextConfirm
  const historyBeside = useMediaQuery('(min-width: 640px)', true)
  const canvasBeside = useMediaQuery('(min-width: 768px)', true)
  const rootRef = useRef<HTMLDivElement>(null)
  const [w, move] = useReducer(workspaceReducer, undefined, (): Workspace => ({ starredOnly: false, historyDrawer: false, localStars: props.starred ? [] : deviceStarStore.load(), dismissed: null }))
  const set = (patch: Partial<Workspace>) => move({ set: patch })

  const starredIds = props.starred?.ids ?? w.localStars
  const star = (id: string, on: boolean) => {
    const next = on ? [...starredIds, id] : starredIds.filter((x) => x !== id)
    if (props.starred) {
      props.starred.onChange(next)
      return
    }
    set({ localStars: next })
    deviceStarStore.save(next)
  }

  const artifact = useMemo(() => newestFlowArtifact(session.utterances), [session.utterances])
  const canvasOpen = !!artifact && w.dismissed !== artifact.callId
  const closeCanvas = () => {
    if (artifact) set({ dismissed: artifact.callId })
    requestAnimationFrame(() => rootRef.current?.querySelector<HTMLElement>('[data-fk-composer]')?.focus())
  }

  const remove = async (t: ThreadSummary) => {
    const ok = await confirm({ title: fill(l.deleteTitle, { title: t.title }, locale), message: l.deleteMessage, confirmLabel: l.confirmDelete, cancelLabel: l.cancel, tone: 'danger' })
    if (ok) await props.onRemoveThread(t.id)
  }

  const history = (
    <ThreadHistory
      threads={threads}
      currentId={session.threadId}
      starred={starredIds}
      starredOnly={w.starredOnly}
      {...(timeZone ? { zone: timeZone } : {})}
      labels={l}
      locale={locale}
      onStarredOnly={(on) => set({ starredOnly: on })}
      onStar={star}
      onOpen={(id) => {
        props.onOpenThread(id)
        set({ historyDrawer: false })
      }}
      onRemove={(t) => void remove(t)}
      onStart={props.onStartThread}
    />
  )

  const regions: Array<{ key: string; node: ReactNode }> = [
    {
      key: 'history',
      node: historyBeside ? (
        history
      ) : (
        <Drawer open={w.historyDrawer} onOpenChange={(open) => set({ historyDrawer: open })} title={l.history} placement="bottom">
          {history}
        </Drawer>
      ),
    },
    {
      key: 'centre',
      node: (
        <div className="fk-convo-shell__centre">
          {historyBeside ? null : (
            <div className="fk-convo-shell__bar">
              <Button variant="secondary" size="compact" leadingIcon={<History />} onPress={() => set({ historyDrawer: true })}>
                {l.openHistory}
              </Button>
            </div>
          )}
          {props.banner ? <div className="fk-convo-shell__banner">{props.banner}</div> : null}
          <AssistantConversation
            session={session}
            labels={l}
            variant="full"
            {...(props.suggestions ? { suggestions: props.suggestions } : {})}
            {...(props.appMark ? { appMark: props.appMark } : {})}
            canOpenCanvas={!!artifact && !canvasOpen}
            onOpenCanvas={() => set({ dismissed: null })}
            locale={locale}
            {...(currency ? { currency } : {})}
          />
        </div>
      ),
    },
    {
      key: 'canvas',
      node: artifact && canvasOpen ? <LiveCanvasPanel artifact={artifact} docked={canvasBeside} labels={l} locale={locale} {...(props.renderCanvas ? { render: props.renderCanvas } : {})} onClose={closeCanvas} /> : null,
    },
  ]

  return (
    <div ref={rootRef} className={['fk-convo-shell', props.className].filter(Boolean).join(' ')} data-canvas={canvasOpen && canvasBeside ? 'open' : undefined}>
      {regions.map((r) => (r.node ? <RegionSlot key={r.key}>{r.node}</RegionSlot> : null))}
    </div>
  )
}

/** Keeps each region's element as a direct child of the shell grid. */
function RegionSlot({ children }: { children: ReactNode }) {
  return <>{children}</>
}
