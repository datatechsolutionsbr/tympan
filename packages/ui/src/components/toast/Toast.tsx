import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from 'lucide-react'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from 'react'
import { cx } from '../../internal/cx'
import { requestHaptic, useHapticsEnabled } from '../../internal/haptics'
import { useMessages } from '../../internal/provider'
import { Button } from '../button/Button'

export type ToastTone = 'success' | 'error' | 'warning' | 'info'
export type ToastPlacement = 'top-end' | 'top-center' | 'bottom-center'

export interface ToastOptions {
  tone?: ToastTone
  title: string
  message?: string
  action?: { label: string; onPress: () => void }
  /** Auto-dismiss time in ms, or persistent. Errors and toasts with actions default to persistent. */
  duration?: number | 'persistent'
  /** A later call with the same id replaces this toast in place. */
  id?: string
}

export interface ToastRecord extends Required<Pick<ToastOptions, 'tone' | 'title'>> {
  id: string
  message?: string
  action?: { label: string; onPress: () => void }
  duration: number | 'persistent'
  createdAt: number
}

type ShortcutOptions = Omit<ToastOptions, 'title' | 'tone'>

export interface ToastApi {
  show: (options: ToastOptions) => string
  success: (title: string, options?: ShortcutOptions) => string
  error: (title: string, options?: ShortcutOptions) => string
  warning: (title: string, options?: ShortcutOptions) => string
  info: (title: string, options?: ShortcutOptions) => string
  dismiss: (id: string) => void
  /** Past toasts, newest first (feeds the notification history). */
  history: ToastRecord[]
}

export interface ToastProviderProps {
  maxVisible?: number
  historyLimit?: number
  placement?: ToastPlacement
  onDismiss?: (id: string) => void
  children?: ReactNode
}

/** Default auto-dismiss times (ms) per tone; errors never auto-dismiss. */
export const toastDurations: Record<ToastTone, number | 'persistent'> = {
  success: 5000,
  info: 5000,
  warning: 8000,
  error: 'persistent',
}

const ToastContext = createContext<ToastApi | null>(null)

let counter = 0
const newId = () => `fk-toast-${++counter}`

interface TimerEntry {
  handle?: ReturnType<typeof setTimeout>
  remaining: number
  startedAt: number
}

/** Owns the toast queue and history and renders the region (spec: wave-1/toast.md). */
export function ToastProvider({ maxVisible = 3, historyLimit = 50, placement = 'top-end', onDismiss, children }: ToastProviderProps) {
  const [queue, setQueue] = useState<ToastRecord[]>([])
  const [history, setHistory] = useState<ToastRecord[]>([])
  const timers = useRef(new Map<string, TimerEntry>())
  const pauseReasons = useRef(new Set<string>())
  const onDismissRef = useRef(onDismiss)
  onDismissRef.current = onDismiss
  // The person's haptics preference, read when a toast is shown.
  const hapticsOn = useRef(true)
  hapticsOn.current = useHapticsEnabled()

  const clearTimer = (id: string) => {
    const t = timers.current.get(id)
    if (t?.handle) clearTimeout(t.handle)
    timers.current.delete(id)
  }

  const dismiss = useCallback((id: string) => {
    clearTimer(id)
    setQueue((q) => {
      if (!q.some((t) => t.id === id)) return q
      onDismissRef.current?.(id)
      return q.filter((t) => t.id !== id)
    })
  }, [])

  const arm = useCallback(
    (id: string, ms: number) => {
      const entry: TimerEntry = { remaining: ms, startedAt: Date.now() }
      if (pauseReasons.current.size === 0) entry.handle = setTimeout(() => dismiss(id), ms)
      timers.current.set(id, entry)
    },
    [dismiss],
  )

  const pause = useCallback((reason: string) => {
    const wasRunning = pauseReasons.current.size === 0
    pauseReasons.current.add(reason)
    if (!wasRunning) return
    for (const entry of timers.current.values()) {
      if (entry.handle) {
        clearTimeout(entry.handle)
        entry.handle = undefined
        entry.remaining = Math.max(0, entry.remaining - (Date.now() - entry.startedAt))
      }
    }
  }, [])

  const resume = useCallback(
    (reason: string) => {
      if (!pauseReasons.current.delete(reason) || pauseReasons.current.size > 0) return
      for (const [id, entry] of timers.current) {
        entry.startedAt = Date.now()
        entry.handle = setTimeout(() => dismiss(id), entry.remaining)
      }
    },
    [dismiss],
  )

  const show = useCallback(
    (options: ToastOptions) => {
      const tone = options.tone ?? 'info'
      const id = options.id ?? newId()
      const duration = options.duration ?? (options.action ? 'persistent' : toastDurations[tone])
      const record: ToastRecord = {
        id,
        tone,
        title: options.title,
        message: options.message,
        action: options.action,
        duration,
        createdAt: Date.now(),
      }
      clearTimer(id)
      setQueue((q) => (q.some((t) => t.id === id) ? q.map((t) => (t.id === id ? record : t)) : [...q, record]))
      setHistory((h) => [record, ...h.filter((t) => t.id !== id)].slice(0, historyLimit))
      // Silent before any user gesture (a toast can appear on its own).
      requestHaptic('light', { enabled: hapticsOn.current })
      return id
    },
    [historyLimit],
  )

  const visible = queue.slice(0, maxVisible)

  // Start timers for newly visible, non-persistent toasts.
  useEffect(() => {
    for (const t of visible) {
      if (t.duration !== 'persistent' && !timers.current.has(t.id)) arm(t.id, t.duration)
    }
  })

  // Pause while the window is hidden.
  useEffect(() => {
    const onVisibility = () => (document.hidden ? pause('hidden') : resume('hidden'))
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [pause, resume])

  useEffect(
    () => () => {
      for (const t of timers.current.values()) if (t.handle) clearTimeout(t.handle)
    },
    [],
  )

  const api = useMemo<ToastApi>(
    () => ({
      show,
      success: (title, o) => show({ ...o, title, tone: 'success' }),
      error: (title, o) => show({ ...o, title, tone: 'error' }),
      warning: (title, o) => show({ ...o, title, tone: 'warning' }),
      info: (title, o) => show({ ...o, title, tone: 'info' }),
      dismiss,
      history,
    }),
    [show, dismiss, history],
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastRegion toasts={visible} placement={placement} onDismiss={dismiss} onPause={pause} onResume={resume} />
    </ToastContext.Provider>
  )
}

/** Access the toast API; throws outside a ToastProvider. */
export function useToast(): ToastApi {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast() must be used inside <ToastProvider>. Wrap the app (or the test) in <ToastProvider>.')
  return ctx
}

const toneIcons = { success: CircleCheck, error: CircleAlert, warning: TriangleAlert, info: Info }

interface RegionProps {
  toasts: ToastRecord[]
  placement: ToastPlacement
  onDismiss: (id: string) => void
  onPause: (reason: string) => void
  onResume: (reason: string) => void
}

function ToastRegion({ toasts, placement, onDismiss, onPause, onResume }: RegionProps) {
  const messages = useMessages()
  const regionRef = useRef<HTMLElement>(null)
  const returnFocus = useRef<HTMLElement | null>(null)

  // F6 moves focus to the region (and back out of it).
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key !== 'F6' || !regionRef.current) return
      const region = regionRef.current
      if (region.contains(document.activeElement)) {
        returnFocus.current?.focus()
      } else if (region.querySelector('.fk-toast')) {
        e.preventDefault()
        returnFocus.current = document.activeElement as HTMLElement | null
        region.querySelector<HTMLElement>('.fk-toast')?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const handleDismiss = (id: string) => {
    const region = regionRef.current
    const focusedInside = !!region && region.contains(document.activeElement)
    const last = toasts.length === 1
    onDismiss(id)
    if (focusedInside && last) {
      const target = returnFocus.current
      setTimeout(() => (target?.isConnected ? target.focus() : undefined), 0)
    }
  }

  const polite = toasts.filter((t) => t.tone !== 'error')
  const assertive = toasts.filter((t) => t.tone === 'error')

  return (
    <section
      ref={regionRef}
      className="fk-toast-region"
      data-placement={placement}
      aria-label={messages.toast.region}
      onPointerEnter={() => onPause('hover')}
      onPointerLeave={() => onResume('hover')}
      onFocus={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          if (e.relatedTarget instanceof HTMLElement) returnFocus.current = e.relatedTarget
          onPause('focus')
        }
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) onResume('focus')
      }}
    >
      <div className="fk-toast-region__list" role="alert" aria-live="assertive" aria-atomic="false">
        {assertive.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={handleDismiss} />
        ))}
      </div>
      <div className="fk-toast-region__list" role="status" aria-live="polite" aria-atomic="false">
        {polite.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={handleDismiss} />
        ))}
      </div>
    </section>
  )
}

function ToastItem({ toast, onDismiss }: { toast: ToastRecord; onDismiss: (id: string) => void }) {
  const messages = useMessages()
  const Icon = toneIcons[toast.tone]
  const swipe = useRef<{ x: number; id: number } | null>(null)
  const [offset, setOffset] = useState(0)

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.stopPropagation()
      onDismiss(toast.id)
    }
  }
  // Touch swipe toward the edge dismisses (never the only way).
  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch') swipe.current = { x: e.clientX, id: e.pointerId }
  }
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (swipe.current && swipe.current.id === e.pointerId) setOffset(Math.max(0, e.clientX - swipe.current.x))
  }
  const onPointerUp = () => {
    if (swipe.current && offset > 80) onDismiss(toast.id)
    swipe.current = null
    setOffset(0)
  }

  return (
    <div
      className="fk-toast"
      data-tone={toast.tone}
      tabIndex={0}
      aria-labelledby={`${toast.id}-title`}
      aria-describedby={toast.message ? `${toast.id}-message` : undefined}
      role="group"
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      style={offset ? { transform: `translateX(${offset}px)` } : undefined}
    >
      <Icon className="fk-toast__icon" aria-hidden="true" focusable="false" />
      <div className="fk-toast__body">
        <p className="fk-toast__title" id={`${toast.id}-title`}>
          {toast.title}
        </p>
        {toast.message ? (
          <p className="fk-toast__message" id={`${toast.id}-message`}>
            {toast.message}
          </p>
        ) : null}
        {toast.action ? (
          <div className="fk-toast__actions">
            <Button
              size="compact"
              variant="secondary"
              onPress={() => {
                toast.action?.onPress()
                onDismiss(toast.id)
              }}
            >
              {toast.action.label}
            </Button>
          </div>
        ) : null}
      </div>
      <Button
        className={cx('fk-toast__dismiss')}
        variant="quiet"
        size="compact"
        iconOnly
        accessibleLabel={messages.toast.dismiss}
        leadingIcon={<X />}
        onPress={() => onDismiss(toast.id)}
      />
    </div>
  )
}
