import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useEffect } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { politeAnnouncement } from '../../internal/data-a/announce'
import { defaultMessages } from '../../internal/messages'
import { ThemeScope } from '../../internal/ThemeScope'
import { ToastProvider, useToast } from '../toast/Toast'
import { NotificationCenter, NotificationCenterProvider, relativeNoticeTime, useNotificationCenter } from './NotificationCenter'
import * as rtlDom from '@testing-library/react'
import { expectNoAxeViolations as axeRtl } from '../../../test/axe'
import { renderRtl } from '../../../test/rtl'
import { cssOf as cssOfRtl } from '../../../test/css'

function Raise({ titles }: { titles: string[] }) {
  const toast = useToast()
  useEffect(() => {
    for (const t of titles) toast.success(t, { duration: 60000 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}

function Count() {
  return <output aria-label="history size">{useNotificationCenter().history.length}</output>
}

function setup(titles: string[], limit?: number) {
  return render(
    <ToastProvider historyLimit={100}>
      <NotificationCenterProvider historyLimit={limit}>
        <Raise titles={titles} />
        <NotificationCenter />
        <Count />
      </NotificationCenterProvider>
    </ToastProvider>,
  )
}

// While the modal is open the rest of the page is hidden from assistive technology.
const bell = () => screen.getByRole('button', { name: /^Notifications/, hidden: true })

describe('NotificationCenter', () => {
  it('names the bell with the unseen count', () => {
    setup(['One', 'Two', 'Three'])
    expect(bell()).toHaveAccessibleName('Notifications, 3 unread')
    expect(bell()).toHaveAttribute('aria-haspopup', 'dialog')
  })

  it('closes on Escape and returns focus to the bell', async () => {
    setup(['One'])
    await userEvent.click(bell())
    expect(screen.getByRole('dialog', { name: 'Notifications' })).toBeInTheDocument()
    expect(bell()).toHaveAttribute('aria-expanded', 'true')
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).toBeNull()
    await waitFor(() => expect(bell()).toHaveFocus())
  })

  it('moves focus to the remaining entry after dismissing one', async () => {
    setup(['Upload finished', 'Export ready'])
    await userEvent.click(bell())
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss, Export ready' }))
    expect(screen.getByRole('button', { name: 'Dismiss, Upload finished' })).toHaveFocus()
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss, Upload finished' }))
    expect(screen.getByRole('heading', { name: 'Notifications' })).toHaveFocus()
  })

  it('shows the empty sentence and no "clear all" without entries', async () => {
    setup([])
    await userEvent.click(bell())
    expect(screen.getByText(defaultMessages.notificationCenter.empty)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Clear all' })).toBeNull()
  })

  it('clears everything and announces it politely', async () => {
    setup(['One', 'Two'])
    await userEvent.click(bell())
    await userEvent.click(screen.getByRole('button', { name: 'Clear all' }))
    await act(async () => {
      await Promise.resolve()
    })
    expect(politeAnnouncement()).toBe('Notifications cleared')
    expect(screen.getByText(defaultMessages.notificationCenter.empty)).toBeInTheDocument()
  })

  it('reads the time of a five-minute-old entry as "minutes ago"', () => {
    const now = Date.now()
    expect(relativeNoticeTime(now - 5 * 60000, now, defaultMessages.notificationCenter.time)).toBe('5 minutes ago')
    expect(relativeNoticeTime(now - 90 * 60000, now, defaultMessages.notificationCenter.time)).toBe('1 hour ago')
    expect(relativeNoticeTime(now, now, defaultMessages.notificationCenter.time)).toBe('just now')
  })

  it('keeps only the 50 newest of 60 entries', () => {
    setup(Array.from({ length: 60 }, (_, i) => `Toast ${i + 1}`))
    expect(screen.getByLabelText('history size')).toHaveTextContent('50')
  })

  it('does not slide under reduced motion and is full width below 640', () => {
    const css = cssOf('components/notification-center/NotificationCenter.css')
    expect(mediaBlock(css, /\(prefers-reduced-motion:\s*reduce\)/)).toMatch(/animation:\s*none/)
    expect(mediaBlock(css, /\(max-width:\s*639\.98px\)/)).toMatch(/inline-size:\s*100vw/)
  })

  it('throws a descriptive error outside the provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<Count />)).toThrow(/NotificationCenterProvider/)
    spy.mockRestore()
  })

  it('has no axe violations with the drawer open, light and dark', async () => {
    for (const scheme of ['light', 'dark'] as const) {
      const { unmount } = render(
        <ThemeScope scheme={scheme}>
          <ToastProvider>
            <NotificationCenterProvider>
              <Raise titles={['Upload finished']} />
              <NotificationCenter />
            </NotificationCenterProvider>
          </ToastProvider>
        </ThemeScope>,
      )
      await expectNoAxeViolations(document.body, ['region'])
      await userEvent.click(bell())
      await expectNoAxeViolations(document.body, ['region'])
      unmount()
    }
  })
})

describe('NotificationCenter in right-to-left (ar)', () => {
  it('renders mirrored where directional and passes axe', async () => {
    const { container } = renderRtl(<ToastProvider><NotificationCenterProvider><NotificationCenter /></NotificationCenterProvider></ToastProvider>)
    expect(rtlDom.screen.getByRole('button')).toBeInTheDocument()
    expect(cssOfRtl('components/notification-center/NotificationCenter.css')).toMatch(/animation-name:\s*fk-notification-center-in-rtl/)
    await axeRtl(container)
  })
})
