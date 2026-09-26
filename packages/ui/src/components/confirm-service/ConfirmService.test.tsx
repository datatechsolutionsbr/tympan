import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { ConfirmProvider, useConfirm, type ConfirmOptions } from './ConfirmService'

function Asker({ options, onAnswer }: { options: ConfirmOptions; onAnswer: (v: boolean) => void }) {
  const confirm = useConfirm()
  return <button onClick={() => void confirm(options).then(onAnswer)}>Ask</button>
}

function Twice({ onAnswers }: { onAnswers: (v: boolean[]) => void }) {
  const confirm = useConfirm()
  const [, force] = useState(0)
  return (
    <button
      onClick={() => {
        void Promise.all([confirm({ title: 'First?' }), confirm({ title: 'Second?' })]).then(onAnswers)
        force((n) => n + 1)
      }}
    >
      Ask twice
    </button>
  )
}

describe('ConfirmService', () => {
  it('opens an alert dialog named by the title and resolves true on Confirm', async () => {
    const onAnswer = vi.fn()
    render(
      <ConfirmProvider>
        <Asker options={{ title: 'Delete source?' }} onAnswer={onAnswer} />
      </ConfirmProvider>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Ask' }))
    expect(screen.getByRole('alertdialog', { name: 'Delete source?' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }))
    await waitFor(() => expect(onAnswer).toHaveBeenCalledWith(true))
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())
  })

  it('resolves false on Escape and returns focus to the trigger', async () => {
    const onAnswer = vi.fn()
    render(
      <ConfirmProvider>
        <Asker options={{ title: 'Leave?' }} onAnswer={onAnswer} />
      </ConfirmProvider>,
    )
    const trigger = screen.getByRole('button', { name: 'Ask' })
    await userEvent.click(trigger)
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(onAnswer).toHaveBeenCalledWith(false))
    await waitFor(() => expect(trigger).toHaveFocus())
  })

  it('queues sequential calls and resolves each with its own answer', async () => {
    const onAnswers = vi.fn()
    render(
      <ConfirmProvider>
        <Twice onAnswers={onAnswers} />
      </ConfirmProvider>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Ask twice' }))
    expect(screen.getByRole('alertdialog', { name: 'First?' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }))
    expect(await screen.findByRole('alertdialog', { name: 'Second?' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    await waitFor(() => expect(onAnswers).toHaveBeenCalledWith([true, false]))
  })

  it('focuses Cancel first for the danger tone', async () => {
    render(
      <ConfirmProvider presentation="dialog">
        <Asker options={{ title: 'Remove 12 records?', tone: 'danger', message: 'This removes 12 records.' }} onAnswer={() => {}} />
      </ConfirmProvider>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Ask' }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus())
    await expectNoAxeViolations(document.body)
  })

  it('falls back to the native prompt without a provider', async () => {
    const native = vi.spyOn(window, 'confirm').mockReturnValue(true)
    const onAnswer = vi.fn()
    render(<Asker options={{ title: 'Proceed?' }} onAnswer={onAnswer} />)
    await act(async () => {
      screen.getByRole('button', { name: 'Ask' }).click()
    })
    expect(native).toHaveBeenCalledWith('Proceed?')
    await waitFor(() => expect(onAnswer).toHaveBeenCalledWith(true))
    native.mockRestore()
  })

  it('has no axe violations in compact presentation', async () => {
    render(
      <ConfirmProvider>
        <Asker options={{ title: 'Sign out?' }} onAnswer={() => {}} />
      </ConfirmProvider>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Ask' }))
    await expectNoAxeViolations(document.body)
  })
})
