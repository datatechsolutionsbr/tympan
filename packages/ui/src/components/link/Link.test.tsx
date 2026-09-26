import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { renderWithProvider } from '../../../test/render'
import { Link } from './Link'

import { expectNoAxeViolations as axeRtl } from '../../../test/axe'
import { renderRtl } from '../../../test/rtl'

describe('Link', () => {
  it('navigates through the router adapter without a page reload', async () => {
    const navigate = vi.fn()
    renderWithProvider(<Link href="/x">Sources</Link>, { navigate })
    await userEvent.click(screen.getByRole('link', { name: 'Sources' }))
    expect(navigate).toHaveBeenCalledWith('/x', undefined)
  })

  it('passes replace to the router adapter', async () => {
    const navigate = vi.fn()
    renderWithProvider(
      <Link href="/x" replace>
        Sources
      </Link>,
      { navigate },
    )
    await userEvent.click(screen.getByRole('link'))
    expect(navigate).toHaveBeenCalledWith('/x', { replace: true })
  })

  it('opens external links in a new context with safe rel and hidden text', () => {
    render(<Link href="https://example.org/doc">Report</Link>)
    const link = screen.getByRole('link', { name: /Report/ })
    expect(link).toHaveAttribute('target', '_blank')
    expect(link.getAttribute('rel')).toContain('noopener')
    expect(link).toHaveTextContent('(opens in a new tab)')
  })

  it('acts as a button without href and fires onPress on Space', async () => {
    const onPress = vi.fn()
    render(<Link onPress={onPress}>Show more</Link>)
    const button = screen.getByRole('button', { name: 'Show more' })
    button.focus()
    await userEvent.keyboard(' ')
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('marks the current page', () => {
    render(
      <Link href="/a" current>
        Overview
      </Link>,
    )
    expect(screen.getByRole('link')).toHaveAttribute('aria-current', 'page')
  })

  it('shows an underline or focus ring when a subtle link is focused', async () => {
    render(
      <Link href="/a" emphasis="subtle">
        Overview
      </Link>,
    )
    await userEvent.tab()
    expect(screen.getByRole('link')).toHaveAttribute('data-focus-visible')
    const css = cssOf('components/link/Link.css')
    expect(css).toMatch(/\.ty-link\[data-focus-visible\]\s*\{[^}]*text-decoration-line:\s*underline[^}]*outline:/)
  })

  it('preserves the browser default on modified clicks', () => {
    const navigate = vi.fn()
    renderWithProvider(<Link href="/x">Sources</Link>, { navigate })
    const link = screen.getByRole('link')
    const event = new MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true, metaKey: true })
    fireEvent(link, event)
    expect(navigate).not.toHaveBeenCalled()
    expect(event.defaultPrevented).toBe(false)
  })

  it('uses LinkText in forced colours and gives standalone links a 44 px hit height', () => {
    const css = cssOf('components/link/Link.css')
    expect(mediaBlock(css, /\(forced-colors:\s*active\)/)).toMatch(/LinkText/)
    expect(css).toMatch(/\.ty-link\[data-standalone\]::before\s*\{[^}]*max\(100%,\s*var\(--ty-control-target\)\)/)
  })

  it('has no axe violations', async () => {
    const { container } = render(
      <p>
        Read the <Link href="/a">guide</Link>, the <Link href="https://example.org">report</Link> or{' '}
        <Link onPress={() => {}}>expand</Link>.
      </p>,
    )
    await expectNoAxeViolations(container)
  })
})

describe('Link in right-to-left (ar)', () => {
  it('renders mirrored where directional and passes axe', async () => {
    const { container } = renderRtl(<Link href="https://www.w3.org/WAI/">مرجع خارجي</Link>)
    expect(container.querySelector('.ty-link__external')).toHaveClass('ty-mirror-rtl')
    await axeRtl(container)
  })
})
