import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { UpgradeGate } from './UpgradeGate'

function Page(props: { busy?: boolean; onViewPlans?: () => void; onSignOut?: () => void }) {
  return (
    <>
      <button>Behind</button>
      <UpgradeGate onViewPlans={props.onViewPlans ?? (() => {})} onSignOut={props.onSignOut ?? (() => {})} busy={props.busy} />
    </>
  )
}

describe('UpgradeGate', () => {
  it('holds focus inside; Tab never reaches content behind', async () => {
    render(<Page />)
    const dialog = screen.getByRole('dialog', { name: 'Your organisation has no active plan' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog.contains(document.activeElement)).toBe(true)
    for (let i = 0; i < 5; i++) {
      await userEvent.tab()
      expect(dialog.contains(document.activeElement)).toBe(true)
    }
  })

  it('stays open on Escape and says so to screen readers', async () => {
    render(<Page />)
    await userEvent.keyboard('{Escape}')
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAccessibleDescription(/cannot be closed/)
  })

  it('busy: primary is blocked and announces busy', async () => {
    const onViewPlans = vi.fn()
    render(<Page busy onViewPlans={onViewPlans} />)
    const primary = screen.getByRole('button', { name: 'View plans' })
    expect(primary).toHaveAttribute('aria-busy', 'true')
    await userEvent.click(primary)
    expect(onViewPlans).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeEnabled()
  })

  it('calls onSignOut once', async () => {
    const onSignOut = vi.fn()
    render(<Page onSignOut={onSignOut} />)
    await userEvent.click(screen.getByRole('button', { name: 'Sign out' }))
    expect(onSignOut).toHaveBeenCalledTimes(1)
  })

  it('has no axe violations', async () => {
    render(<Page />)
    await expectNoAxeViolations(document.body)
  })
})
