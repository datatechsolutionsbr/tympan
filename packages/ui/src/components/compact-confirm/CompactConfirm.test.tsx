import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { resetUserGestureForTests } from '../../internal/haptics'
import { HapticsPreference } from '../../utilities/haptics/haptics'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { CompactConfirm } from './CompactConfirm'
import * as rtlDom from '@testing-library/react'
import { expectNoAxeViolations as axeRtl } from '../../../test/axe'
import { renderRtl } from '../../../test/rtl'

const base = { title: 'Sign out?', onConfirm: () => {}, onCancel: () => {} }

describe('CompactConfirm', () => {
  afterEach(() => {
    Reflect.deleteProperty(navigator, 'vibrate')
  })

  it('renders nothing when closed', () => {
    render(<CompactConfirm {...base} open={false} />)
    expect(screen.queryByRole('alertdialog')).toBeNull()
    expect(document.body.textContent).toBe('')
  })

  it('exposes an alert dialog named by the question with Cancel and Confirm', () => {
    render(<CompactConfirm {...base} open />)
    const dialog = screen.getByRole('alertdialog', { name: 'Sign out?' })
    expect(dialog).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument()
    expect(screen.getByText('Caution')).toBeInTheDocument()
  })

  it('shows custom labels and the source line', () => {
    render(<CompactConfirm {...base} open confirmLabel="Sign out" cancelLabel="Stay" sourceLabel="Fakhir" message="You will need to sign in again." />)
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Stay' })).toBeInTheDocument()
    expect(screen.getByText('Fakhir')).toBeInTheDocument()
    expect(screen.getByRole('alertdialog')).toHaveAccessibleDescription('You will need to sign in again.')
  })

  it('confirms once, cancels on Cancel and on Escape', async () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()
    const { rerender } = render(<CompactConfirm title="Delete?" open onConfirm={onConfirm} onCancel={onCancel} />)
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus()
    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    await userEvent.keyboard('{Escape}')
    expect(onCancel).toHaveBeenCalledTimes(2)
    rerender(<CompactConfirm title="Delete?" open={false} onConfirm={onConfirm} onCancel={onCancel} />)
  })

  it('uses unique label ids per instance', () => {
    render(
      <>
        <CompactConfirm {...base} open title="First?" />
        <CompactConfirm {...base} open title="Second?" />
      </>,
    )
    const [a, b] = screen.getAllByRole('alertdialog', { hidden: true })
    expect(a!.getAttribute('aria-labelledby')).not.toEqual(b!.getAttribute('aria-labelledby'))
  })

  describe('haptics', () => {
    const install = () => {
      const vibrate = vi.fn(() => true)
      Object.defineProperty(navigator, 'vibrate', { configurable: true, value: vibrate })
      return vibrate
    }
    const press = () => document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    beforeEach(() => resetUserGestureForTests())
    afterEach(() => resetUserGestureForTests())

    it('requests one warning haptic when opening after a user gesture', () => {
      const vibrate = install()
      press()
      render(<CompactConfirm {...base} open />)
      expect(vibrate).toHaveBeenCalledTimes(1)
    })

    it('never vibrates before any user gesture', () => {
      const vibrate = install()
      render(<CompactConfirm {...base} open />)
      expect(vibrate).not.toHaveBeenCalled()
    })

    it('honours the haptics preference', () => {
      const vibrate = install()
      press()
      render(
        <HapticsPreference enabled={false}>
          <CompactConfirm {...base} open />
        </HapticsPreference>,
      )
      expect(vibrate).not.toHaveBeenCalled()
    })
  })

  it('moves by opacity only under reduced motion', () => {
    const reduced = mediaBlock(cssOf('components/compact-confirm/CompactConfirm.css'), /\(prefers-reduced-motion:\s*reduce\)/)
    expect(reduced).not.toMatch(/translate/)
  })

  it('has no axe violations', async () => {
    render(<CompactConfirm {...base} open tone="neutral" sourceLabel="Fakhir" message="Consequence." />)
    await expectNoAxeViolations(document.body)
  })
})

describe('CompactConfirm in right-to-left (ar)', () => {
  it('renders mirrored where directional and passes axe', async () => {
    renderRtl(<CompactConfirm open title="تسجيل الخروج؟" message="ستحتاج إلى تسجيل الدخول مرة أخرى." onConfirm={() => {}} onCancel={() => {}} tone="neutral" />)
    expect(await rtlDom.screen.findByRole('alertdialog', { name: /تسجيل الخروج/ })).toBeInTheDocument()
    await axeRtl(document.body)
  })
})
