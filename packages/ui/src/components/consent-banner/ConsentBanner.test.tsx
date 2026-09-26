import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { ThemeScope } from '../../internal/ThemeScope'
import { ConsentBanner } from './ConsentBanner'

const KEY = 'ty-consent-test'

describe('ConsentBanner', () => {
  beforeEach(() => window.localStorage.removeItem(KEY))
  afterEach(() => vi.restoreAllMocks())

  it('shows without a stored answer', () => {
    render(<ConsentBanner policyHref="/privacy" storageKey={KEY} />)
    expect(screen.getByRole('region', { name: 'Cookie choice' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Privacy policy' })).toHaveAttribute('href', '/privacy')
  })

  it('Accept stores "accepted", hides and fires once', async () => {
    const onAccept = vi.fn()
    render(<ConsentBanner policyHref="/privacy" storageKey={KEY} onAccept={onAccept} />)
    await userEvent.click(screen.getByRole('button', { name: 'Accept measurement' }))
    expect(window.localStorage.getItem(KEY)).toBe('accepted')
    expect(screen.queryByRole('region')).toBeNull()
    expect(onAccept).toHaveBeenCalledTimes(1)
  })

  it('Reject stores "rejected" and fires onReject', async () => {
    const onReject = vi.fn()
    render(<ConsentBanner policyHref="/privacy" storageKey={KEY} onReject={onReject} />)
    await userEvent.click(screen.getByRole('button', { name: 'Only essential cookies' }))
    expect(window.localStorage.getItem(KEY)).toBe('rejected')
    expect(onReject).toHaveBeenCalledTimes(1)
  })

  it('is not rendered when an answer is stored', () => {
    window.localStorage.setItem(KEY, 'rejected')
    const { container } = render(<ConsentBanner policyHref="/privacy" storageKey={KEY} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders without error when storage throws', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    render(<ConsentBanner policyHref="/privacy" storageKey={KEY} />)
    await userEvent.click(screen.getByRole('button', { name: 'Accept measurement' }))
    expect(screen.queryByRole('region')).toBeNull()
  })

  it('does not trap focus: content behind stays focusable', async () => {
    render(
      <>
        <ConsentBanner policyHref="/privacy" storageKey={KEY} />
        <a href="/content">Content</a>
      </>,
    )
    for (let i = 0; i < 4; i++) await userEvent.tab()
    expect(screen.getByRole('link', { name: 'Content' })).toHaveFocus()
    expect(screen.getByRole('region')).not.toHaveAttribute('aria-modal')
  })

  it('gives both choices equal weight', () => {
    render(<ConsentBanner policyHref="/privacy" storageKey={KEY} />)
    const [a, b] = screen.getAllByRole('button')
    expect(a!.getAttribute('data-variant')).toBe(b!.getAttribute('data-variant'))
  })

  it('has no axe violations, light and dark', async () => {
    const { container } = render(
      <>
        <ThemeScope scheme="light">
          <ConsentBanner policyHref="/privacy" storageKey={KEY} texts={{ label: 'Cookies light' }} />
        </ThemeScope>
        <ThemeScope scheme="dark">
          <ConsentBanner policyHref="/privacy" storageKey={KEY} texts={{ label: 'Cookies dark' }} />
        </ThemeScope>
      </>,
    )
    await expectNoAxeViolations(container)
  })
})
