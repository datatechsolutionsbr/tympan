// Editor dialog stack: opening a dialog while another is open pushes the
// current one; closing pops and restores it with its payload.

import { createContext, useContext, useState, type ReactNode } from 'react'
import { createStore, useStoreSelector, type Store } from './store'

export type EditorDialogKind = 'agent-editor' | 'node-config' | 'flow-settings'

export interface EditorDialogEntry<P = unknown> {
  kind: EditorDialogKind
  payload: P
}

export interface DialogStackData {
  active: EditorDialogEntry | null
  stack: EditorDialogEntry[]
}

export interface DialogStack extends Store<DialogStackData> {
  open<P>(kind: EditorDialogKind, payload: P): void
  close(): void
  closeAll(): void
}

export function createDialogStack(): DialogStack {
  const base = createStore<DialogStackData>({ active: null, stack: [] })
  return {
    ...base,
    open(kind, payload) {
      const s = base.getState()
      base.setState({ active: { kind, payload }, stack: s.active ? [...s.stack, s.active] : s.stack })
    },
    close() {
      const s = base.getState()
      const stack = s.stack.slice(0, -1)
      base.setState({ active: s.stack[s.stack.length - 1] ?? null, stack })
    },
    closeAll() {
      base.setState({ active: null, stack: [] })
    },
  }
}

const DialogStackContext = createContext<DialogStack | null>(null)

export function DialogStackProvider({ stack, children }: { stack?: DialogStack; children: ReactNode }) {
  const [own] = useState(() => stack ?? createDialogStack())
  return <DialogStackContext.Provider value={stack ?? own}>{children}</DialogStackContext.Provider>
}

export function useDialogStack(): DialogStack {
  const s = useContext(DialogStackContext)
  if (!s) throw new Error('Editor dialogs must be inside <DialogStackProvider> (FlowEditor provides one).')
  return s
}

export function useOptionalDialogStack(): DialogStack | null {
  return useContext(DialogStackContext)
}

/** The active dialog when it is of `kind`, else null. */
export function useActiveDialog<P = unknown>(kind: EditorDialogKind): EditorDialogEntry<P> | null {
  const stack = useDialogStack()
  return useStoreSelector(stack, (s) => (s.active?.kind === kind ? (s.active as EditorDialogEntry<P>) : null))
}
