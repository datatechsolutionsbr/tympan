import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { ErrorState } from './ErrorState'

import * as rtlDom from '@testing-library/react'
import { expectNoAxeViolations as axeRtl } from '../../../test/axe'
import { renderRtl } from '../../../test/rtl'

describe('ErrorState', () => {
  it('network kind describes a connection problem and offers "Try again"', () => {
    render(<ErrorState kind="network" onRetry={() => {}} />)
    expect(screen.getByRole('heading', { name: /connection problem/i })).toBeInTheDocument()
    expect(screen.getByText(/server could not be reached/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
  })

  it('keeps the retry button busy and disabled while the promise is pending', async () => {
    let resolve!: () => void
    const onRetry = vi.fn(() => new Promise<void>((r) => (resolve = r)))
    render(<ErrorState onRetry={onRetry} />)
    const button = screen.getByRole('button', { name: 'Try again' })
    await userEvent.click(button)
    expect(button).toHaveAttribute('aria-busy', 'true')
    expect(button).toHaveAttribute('aria-disabled', 'true')
    await userEvent.click(button)
    expect(onRetry).toHaveBeenCalledTimes(1)
    resolve()
    await vi.waitFor(() => expect(button).not.toHaveAttribute('aria-busy'))
  })

  it('shows status code and problem type as metadata', () => {
    render(<ErrorState kind="conflict" statusCode={409} problemType="https://fakhir.app/problems/stale-version" />)
    expect(screen.getByText('Status 409')).toBeInTheDocument()
    expect(screen.getByText('https://fakhir.app/problems/stale-version').tagName).toBe('CODE')
  })

  it('expands details with a disclosure', async () => {
    render(<ErrorState details="Trace id 42" />)
    const toggle = screen.getByRole('button', { name: 'Technical details' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('Trace id 42')).toBeVisible()
  })

  it('block scope leaves the rest of the page interactive', async () => {
    const onOther = vi.fn()
    render(
      <main>
        <button type="button" onClick={onOther}>
          Other
        </button>
        <ErrorState scope="block" kind="server" title="Map failed" />
      </main>,
    )
    expect(screen.getByRole('region', { name: 'Map failed' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Other' }))
    expect(onOther).toHaveBeenCalled()
  })

  it('announces through an alert when it appears after data was shown', () => {
    render(<ErrorState appearedAfterLoad kind="server" />)
    expect(screen.getByRole('alert')).toHaveTextContent(/the server failed/i)
  })

  it('focuses the title on first render at page scope instead of alerting', () => {
    render(<ErrorState />)
    expect(screen.queryByRole('alert')).toBeNull()
    expect(screen.getByRole('heading', { level: 2 })).toHaveFocus()
  })

  it('renders no retry button without onRetry', () => {
    render(<ErrorState />)
    expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull()
  })

  it('renders the secondary action as a link when given an href', () => {
    render(<ErrorState secondaryAction={{ label: 'Go back', href: '/sources' }} />)
    expect(screen.getByRole('link', { name: 'Go back' })).toHaveAttribute('href', '/sources')
  })

  it('has no axe violations', async () => {
    const { container } = render(
      <ErrorState kind="permission" statusCode={403} details="x" onRetry={() => {}} secondaryAction={{ label: 'Back', onPress: () => {} }} />,
    )
    await expectNoAxeViolations(container)
  })
})

describe('ErrorState in right-to-left (ar)', () => {
  it('renders mirrored where directional and passes axe', async () => {
    const { container } = renderRtl(<ErrorState kind="network" scope="block" onRetry={() => {}} />)
    expect(rtlDom.screen.getByRole('button')).toBeInTheDocument()
    await axeRtl(container)
  })
})
