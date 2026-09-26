// Stand-in for the wave-2 ConfirmService: `useConfirm()` returns an async
// confirm function. A host may pass its own through <ConfirmProvider confirm>.

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { Button, ModalDialog } from '@fakhir/design-system'

export interface ConfirmOptions {
  title: string
  message?: string
  confirmLabel: string
  cancelLabel: string
  tone?: 'neutral' | 'danger'
}

export type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>

const ConfirmContext = createContext<ConfirmFn | null>(null)

export function ConfirmProvider({ confirm, children }: { confirm?: ConfirmFn; children: ReactNode }) {
  const [pending, setPending] = useState<ConfirmOptions | null>(null)
  const resolver = useRef<((ok: boolean) => void) | null>(null)
  const builtIn = useCallback<ConfirmFn>(
    (options) =>
      new Promise<boolean>((resolve) => {
        resolver.current = resolve
        setPending(options)
      }),
    [],
  )
  const settle = (ok: boolean) => {
    resolver.current?.(ok)
    resolver.current = null
    setPending(null)
  }
  return (
    <ConfirmContext.Provider value={confirm ?? builtIn}>
      {children}
      {pending ? (
        <ModalDialog
          isOpen
          role="alertdialog"
          width="narrow"
          onOpenChange={(open) => {
            if (!open) settle(false)
          }}
          title={pending.title}
          description={pending.message}
          actions={
            <>
              <Button variant="secondary" autoFocus onPress={() => settle(false)}>
                {pending.cancelLabel}
              </Button>
              <Button variant={pending.tone === 'danger' ? 'danger' : 'primary'} onPress={() => settle(true)}>
                {pending.confirmLabel}
              </Button>
            </>
          }
        />
      ) : null}
    </ConfirmContext.Provider>
  )
}

/** Confirm function from the nearest provider; without one, the browser's confirm. */
export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext)
  return (
    ctx ??
    ((o) => Promise.resolve(typeof window !== 'undefined' && typeof window.confirm === 'function' ? window.confirm([o.title, o.message].filter(Boolean).join('\n')) : true))
  )
}
