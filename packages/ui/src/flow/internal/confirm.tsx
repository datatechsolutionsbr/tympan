// Asking a person to confirm, until the design system's wave-2 confirm
// service exists. `useConfirm()` gives an async question function; hosts can
// plug in their own through <ConfirmProvider confirm={...}>.

import { createContext, useContext, useState, type ReactNode } from 'react'
import { Button, ModalDialog } from '../../index'

export interface ConfirmOptions {
  title: string
  message?: string
  confirmLabel: string
  cancelLabel: string
  tone?: 'neutral' | 'danger'
}

export type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>

/** An open question: what is asked and how to answer it. */
interface Question {
  ask: ConfirmOptions
  answer: (yes: boolean) => void
}

const AskContext = createContext<ConfirmFn | null>(null)

function QuestionDialog({ question, done }: { question: Question; done: () => void }) {
  const reply = (yes: boolean) => {
    question.answer(yes)
    done()
  }
  const { ask } = question
  return (
    <ModalDialog
      isOpen
      role="alertdialog"
      width="narrow"
      onOpenChange={(open) => (open ? undefined : reply(false))}
      title={ask.title}
      description={ask.message}
      actions={
        <>
          <Button variant="secondary" autoFocus onPress={() => reply(false)}>
            {ask.cancelLabel}
          </Button>
          <Button variant={ask.tone === 'danger' ? 'danger' : 'primary'} onPress={() => reply(true)}>
            {ask.confirmLabel}
          </Button>
        </>
      }
    />
  )
}

export function ConfirmProvider({ confirm, children }: { confirm?: ConfirmFn; children: ReactNode }) {
  const [open, setOpen] = useState<Question | null>(null)
  const [builtIn] = useState<ConfirmFn>(() => (ask: ConfirmOptions) => new Promise<boolean>((answer) => setOpen({ ask, answer })))
  return (
    <AskContext.Provider value={confirm ?? builtIn}>
      {children}
      {open ? <QuestionDialog question={open} done={() => setOpen(null)} /> : null}
    </AskContext.Provider>
  )
}

/** Without a provider the browser's own confirm box answers (true where there is none). */
const browserAsk: ConfirmFn = async ({ title, message }) => {
  if (typeof window === 'undefined' || typeof window.confirm !== 'function') return true
  return window.confirm(message ? `${title}\n${message}` : title)
}

export function useConfirm(): ConfirmFn {
  return useContext(AskContext) ?? browserAsk
}
