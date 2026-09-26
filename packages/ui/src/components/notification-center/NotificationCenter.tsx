import { Bell, BellOff, CircleAlert, CircleCheck, Info, TriangleAlert, X } from 'lucide-react'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Dialog, Heading, Modal, ModalOverlay } from 'react-aria-components'
import { cx } from '../../internal/cx'
import { announcePolitely } from '../../internal/data-a/announce'
import type { DataAMessages } from '../../internal/messages/data-a'
import { useMessages } from '../../internal/provider'
import { Button } from '../button/Button'
import { CountBadge } from '../count-badge/CountBadge'
import { useToast, type ToastTone } from '../toast/Toast'

export interface Notice {
  id: string
  tone: ToastTone
  title: string
  message?: string
  createdAt: number
}

export interface NotificationCenterApi {
  /** Newest first, capped at `historyLimit`. */
  history: Notice[]
  isOpen: boolean
  open: () => void
  close: () => void
  remove: (id: string) => void
  clear: () => void
  /** Entries added since the drawer was last opened. */
  unseenCount: number
}

export interface NotificationCenterProviderProps {
  historyLimit?: number
  onOpenChange?: (open: boolean) => void
  children: ReactNode
}

const CenterContext = createContext<NotificationCenterApi | null>(null)

interface Ledger {
  removed: ReadonlySet<string>
  clearedAt: number
  seenAt: number
}

/**
 * Session history of the messages raised through the Toast service. Place it
 * inside `ToastProvider`: it reads the toast history, it never raises toasts.
 */
export function NotificationCenterProvider({ historyLimit = 50, onOpenChange, children }: NotificationCenterProviderProps) {
  const toast = useToast()
  const [isOpen, setOpen] = useState(false)
  const [ledger, setLedger] = useState<Ledger>({ removed: new Set(), clearedAt: -Infinity, seenAt: -Infinity })

  const history = useMemo(
    () =>
      toast.history
        .filter((t) => t.createdAt > ledger.clearedAt && !ledger.removed.has(t.id))
        .slice(0, historyLimit)
        .map(({ id, tone, title, message, createdAt }): Notice => ({ id, tone, title, message, createdAt })),
    [toast.history, ledger, historyLimit],
  )

  const toggle = useCallback(
    (next: boolean) => {
      setOpen(next)
      setLedger((l) => ({ ...l, seenAt: Date.now() }))
      onOpenChange?.(next)
    },
    [onOpenChange],
  )

  const api = useMemo<NotificationCenterApi>(
    () => ({
      history,
      isOpen,
      open: () => toggle(true),
      close: () => toggle(false),
      remove: (id) => setLedger((l) => ({ ...l, removed: new Set([...l.removed, id]) })),
      clear: () => setLedger((l) => ({ ...l, clearedAt: Date.now(), removed: new Set() })),
      unseenCount: isOpen ? 0 : history.filter((n) => n.createdAt > ledger.seenAt).length,
    }),
    [history, isOpen, toggle, ledger.seenAt],
  )

  return <CenterContext.Provider value={api}>{children}</CenterContext.Provider>
}

export function useNotificationCenter(): NotificationCenterApi {
  const ctx = useContext(CenterContext)
  if (!ctx) throw new Error('useNotificationCenter() must be used inside <NotificationCenterProvider>.')
  return ctx
}

type TimeCopy = DataAMessages['notificationCenter']['time']

/** Localised "5 minutes ago" style phrase. */
export function relativeNoticeTime(createdAt: number, now: number, copy: TimeCopy): string {
  const minutes = Math.floor(Math.max(0, now - createdAt) / 60000)
  if (minutes < 1) return copy.justNow
  if (minutes < 60) return copy.minutes(minutes)
  const hours = Math.floor(minutes / 60)
  return hours < 24 ? copy.hours(hours) : copy.days(Math.floor(hours / 24))
}

const TONE_GLYPH = { success: CircleCheck, error: CircleAlert, warning: TriangleAlert, info: Info } as const

function Entry({ notice, now, onDismiss, buttonRef }: { notice: Notice; now: number; onDismiss: () => void; buttonRef: (el: HTMLElement | null) => void }) {
  const copy = useMessages().notificationCenter
  const Glyph = TONE_GLYPH[notice.tone]
  return (
    <li className="fk-notification-center__entry" data-tone={notice.tone}>
      <Glyph className="fk-icon fk-notification-center__glyph" aria-hidden="true" focusable="false" />
      <div className="fk-notification-center__text">
        <p className="fk-notification-center__tone">{copy.tone[notice.tone]}</p>
        <p className="fk-notification-center__title">{notice.title}</p>
        {notice.message ? <p className="fk-notification-center__message">{notice.message}</p> : null}
        <p className="fk-notification-center__time">{relativeNoticeTime(notice.createdAt, now, copy.time)}</p>
      </div>
      <Button
        ref={buttonRef}
        variant="quiet"
        size="compact"
        shape="circle"
        iconOnly
        accessibleLabel={copy.dismiss(notice.title)}
        leadingIcon={<X />}
        onPress={onDismiss}
      />
    </li>
  )
}

/** Where focus goes after an entry leaves: next, else previous, else the title. */
function useFocusAfterRemoval(ids: string[]) {
  const buttons = useRef(new Map<string, HTMLElement>())
  const titleRef = useRef<HTMLHeadingElement>(null)
  const pending = useRef<number | null>(null)
  useEffect(() => {
    if (pending.current === null) return
    const index = Math.min(pending.current, ids.length - 1)
    pending.current = null
    const target = index >= 0 ? buttons.current.get(ids[index]!) : titleRef.current
    target?.focus()
  }, [ids])
  const bind = (id: string) => (el: HTMLElement | null) => {
    if (el) buttons.current.set(id, el)
    else buttons.current.delete(id)
  }
  return { bind, titleRef, markRemoved: (index: number) => (pending.current = index) }
}

export interface NotificationCenterProps {
  className?: string
}

/** Bell button with unseen count and the history drawer (spec: wave-2/notification-center.md). */
export function NotificationCenter({ className }: NotificationCenterProps) {
  const center = useNotificationCenter()
  const messages = useMessages()
  const copy = messages.notificationCenter
  const closeLabel = messages.close
  const ids = useMemo(() => center.history.map((n) => n.id), [center.history])
  const focus = useFocusAfterRemoval(ids)
  const now = Date.now()

  const bellName = center.unseenCount > 0 ? copy.bellUnseen(copy.bell, center.unseenCount) : copy.bell
  const clearAll = () => {
    center.clear()
    announcePolitely(copy.cleared)
    focus.markRemoved(-1)
  }

  return (
    <span className={cx('fk-notification-center', className)}>
      <span className="fk-notification-center__bell">
        <Button
          variant="quiet"
          iconOnly
          accessibleLabel={bellName}
          leadingIcon={<Bell />}
          aria-haspopup="dialog"
          aria-expanded={center.isOpen}
          onPress={center.open}
        />
        <CountBadge count={center.unseenCount} />
      </span>
      <ModalOverlay className="fk-notification-center__backdrop" isOpen={center.isOpen} onOpenChange={(o) => !o && center.close()} isDismissable>
        <Modal className="fk-notification-center__drawer">
          <Dialog className="fk-notification-center__dialog">
            <header className="fk-notification-center__head">
              <Bell className="fk-icon" aria-hidden="true" focusable="false" />
              <Heading slot="title" level={2} ref={focus.titleRef} tabIndex={-1} className="fk-notification-center__heading">
                {copy.title}
              </Heading>
              {center.history.length > 0 ? (
                <Button variant="quiet" size="compact" onPress={clearAll}>
                  {copy.clearAll}
                </Button>
              ) : null}
              <Button variant="quiet" size="compact" shape="circle" iconOnly accessibleLabel={closeLabel} leadingIcon={<X />} onPress={center.close} />
            </header>
            {center.history.length === 0 ? (
              <div className="fk-notification-center__empty">
                <BellOff className="fk-icon" aria-hidden="true" focusable="false" />
                <p>{copy.empty}</p>
              </div>
            ) : (
              <ul className="fk-notification-center__list">
                {center.history.map((notice, index) => (
                  <Entry
                    key={notice.id}
                    notice={notice}
                    now={now}
                    buttonRef={focus.bind(notice.id)}
                    onDismiss={() => {
                      focus.markRemoved(index)
                      center.remove(notice.id)
                    }}
                  />
                ))}
              </ul>
            )}
          </Dialog>
        </Modal>
      </ModalOverlay>
    </span>
  )
}
