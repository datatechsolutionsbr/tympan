// ConfirmService (spec: wave-2/confirm-service.md).
//
// Questions are held by a small first-in-first-out queue that lives outside
// React. The provider subscribes to it and renders only the question at the
// front, through one of two presenters (compact or dialog). Each question
// resolves its own promise when answered.
import { createContext, useContext, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react'
import { useMessages } from '../../internal/provider'
import { Button } from '../button/Button'
import { CompactConfirm, type ConfirmTone } from '../compact-confirm/CompactConfirm'
import { ModalDialog } from '../modal-dialog/ModalDialog'

/** Field names fixed by the spec. */
export interface ConfirmOptions {
  title: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: ConfirmTone
  icon?: ReactNode
}

export type AskToConfirm = (options: ConfirmOptions) => Promise<boolean>

interface Pending {
  serial: number
  question: ConfirmOptions
  reply: (yes: boolean) => void
}

class QuestionQueue {
  private waiting: Pending[] = []
  private serial = 0
  private listeners = new Set<() => void>()

  enqueue = (question: ConfirmOptions): Promise<boolean> =>
    new Promise<boolean>((reply) => {
      this.waiting = [...this.waiting, { serial: ++this.serial, question, reply }]
      this.emit()
    })

  answerFront(yes: boolean): void {
    const [front, ...rest] = this.waiting
    if (!front) return
    this.waiting = rest
    front.reply(yes)
    this.emit()
  }

  front = (): Pending | undefined => this.waiting[0]

  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private emit() {
    for (const listener of this.listeners) listener()
  }
}

const QueueContext = createContext<QuestionQueue | null>(null)

/** Without a provider: the browser's own prompt, or false where there is none. */
function browserPrompt(options: ConfirmOptions): Promise<boolean> {
  const prompt = typeof window === 'undefined' ? undefined : window.confirm
  if (typeof prompt !== 'function') return Promise.resolve(false)
  try {
    return Promise.resolve(Boolean(prompt.call(window, options.title)))
  } catch {
    return Promise.resolve(false)
  }
}

export interface ConfirmProviderProps {
  /** `compact` (CompactConfirm) or `dialog` (ModalDialog in alert form). */
  presentation?: 'compact' | 'dialog'
  children: ReactNode
}

interface PresenterProps {
  question: ConfirmOptions | undefined
  onReply: (yes: boolean) => void
}

function DialogPresenter({ question, onReply }: PresenterProps) {
  const words = useMessages().confirm
  const risky = question?.tone === 'danger'
  return (
    <ModalDialog
      isOpen={question !== undefined}
      onOpenChange={(open) => {
        if (!open) onReply(false)
      }}
      role="alertdialog"
      width="narrow"
      title={question?.title ?? ''}
      description={question?.message}
      actions={
        <>
          <Button autoFocus={risky} onPress={() => onReply(false)}>
            {question?.cancelLabel ?? words.cancel}
          </Button>
          <Button autoFocus={!risky} variant={risky ? 'danger' : 'primary'} onPress={() => onReply(true)}>
            {question?.confirmLabel ?? words.confirm}
          </Button>
        </>
      }
    />
  )
}

function CompactPresenter({ question, onReply }: PresenterProps) {
  return (
    <CompactConfirm
      open={question !== undefined}
      title={question?.title ?? ''}
      message={question?.message}
      confirmLabel={question?.confirmLabel}
      cancelLabel={question?.cancelLabel}
      tone={question?.tone ?? 'neutral'}
      icon={question?.icon}
      onConfirm={() => onReply(true)}
      onCancel={() => onReply(false)}
    />
  )
}

const PRESENTERS = { compact: CompactPresenter, dialog: DialogPresenter } as const

/**
 * Mount once near the root; `useConfirm()` then returns an async question.
 * Questions asked while one is open wait and open in order.
 */
export function ConfirmProvider({ presentation = 'compact', children }: ConfirmProviderProps) {
  const [queue] = useState(() => new QuestionQueue())
  const front = useSyncExternalStore(queue.subscribe, queue.front, queue.front)
  const Presenter = PRESENTERS[presentation]
  return (
    <QueueContext.Provider value={queue}>
      {children}
      {/* A fresh presenter per question resets its focus and animation. */}
      <Presenter key={front ? front.serial : 'idle'} question={front?.question} onReply={(yes) => queue.answerFront(yes)} />
    </QueueContext.Provider>
  )
}

/** Async yes/no question rendered by the nearest ConfirmProvider. */
export function useConfirm(): AskToConfirm {
  const queue = useContext(QueueContext)
  return useMemo<AskToConfirm>(() => (queue ? queue.enqueue : browserPrompt), [queue])
}
