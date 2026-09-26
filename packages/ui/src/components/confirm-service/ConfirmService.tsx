import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import { useMessages } from '../../internal/provider'
import { Button } from '../button/Button'
import { CompactConfirm, type ConfirmTone } from '../compact-confirm/CompactConfirm'
import { ModalDialog } from '../modal-dialog/ModalDialog'

export interface ConfirmOptions {
  title: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: ConfirmTone
  icon?: ReactNode
}

export type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>

interface Ask {
  options: ConfirmOptions
  settle: (answer: boolean) => void
}

const AskContext = createContext<ConfirmFn | null>(null)

/** Fallback without a provider: the native prompt (tests, isolated previews), false without a window. */
const nativeConfirm: ConfirmFn = (options) => {
  if (typeof window === 'undefined' || typeof window.confirm !== 'function') return Promise.resolve(false)
  try {
    return Promise.resolve(window.confirm(options.title))
  } catch {
    return Promise.resolve(false)
  }
}

export interface ConfirmProviderProps {
  /** `compact` (CompactConfirm) or `dialog` (ModalDialog in alert form). */
  presentation?: 'compact' | 'dialog'
  children: ReactNode
}

/**
 * Mount once near the root; `useConfirm()` then returns an async question
 * (spec: wave-2/confirm-service.md). Calls made while one question is open
 * wait in line and open in order.
 */
export function ConfirmProvider({ presentation = 'compact', children }: ConfirmProviderProps) {
  const line = useRef<Ask[]>([])
  const [head, setHead] = useState<Ask | null>(null)

  const advance = useCallback(() => {
    setHead(line.current[0] ?? null)
  }, [])

  const ask = useCallback<ConfirmFn>(
    (options) =>
      new Promise<boolean>((resolve) => {
        line.current.push({ options, settle: resolve })
        if (line.current.length === 1) advance()
      }),
    [advance],
  )

  const answer = (value: boolean) => {
    const current = line.current.shift()
    current?.settle(value)
    advance()
  }

  return (
    <AskContext.Provider value={ask}>
      {children}
      <ConfirmSurface key={head ? line.current.length + head.options.title : 'idle'} ask={head} presentation={presentation} onAnswer={answer} />
    </AskContext.Provider>
  )
}

function ConfirmSurface({ ask, presentation, onAnswer }: { ask: Ask | null; presentation: 'compact' | 'dialog'; onAnswer: (v: boolean) => void }) {
  const copy = useMessages().confirm
  const o = ask?.options
  const tone = o?.tone ?? 'neutral'
  if (presentation === 'dialog') {
    return (
      <ModalDialog
        isOpen={!!ask}
        onOpenChange={(open) => !open && onAnswer(false)}
        role="alertdialog"
        width="narrow"
        title={o?.title ?? ''}
        description={o?.message}
        actions={
          <>
            <Button autoFocus={tone === 'danger'} onPress={() => onAnswer(false)}>
              {o?.cancelLabel ?? copy.cancel}
            </Button>
            <Button autoFocus={tone !== 'danger'} variant={tone === 'danger' ? 'danger' : 'primary'} onPress={() => onAnswer(true)}>
              {o?.confirmLabel ?? copy.confirm}
            </Button>
          </>
        }
      />
    )
  }
  return (
    <CompactConfirm
      open={!!ask}
      title={o?.title ?? ''}
      message={o?.message}
      confirmLabel={o?.confirmLabel}
      cancelLabel={o?.cancelLabel}
      tone={tone}
      icon={o?.icon}
      onConfirm={() => onAnswer(true)}
      onCancel={() => onAnswer(false)}
    />
  )
}

/** Async yes/no question rendered by the nearest ConfirmProvider. */
export function useConfirm(): ConfirmFn {
  const ask = useContext(AskContext)
  return useMemo(() => ask ?? nativeConfirm, [ask])
}
