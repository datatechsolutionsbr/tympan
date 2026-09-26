import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf } from '../../../test/css'
import { ThemeScope } from '../../internal/ThemeScope'
import { COPY_CONFIRMATION_MS, CopyIdentifier } from './CopyIdentifier'
import { expectNoAxeViolations as axeRtl } from '../../../test/axe'
import { renderRtl } from '../../../test/rtl'

const long = '0f3c9a2e-5b1d-4e7a-9c8b-2d6f1a0e4b3c'

afterEach(() => {
  vi.useRealTimers()
})

describe('CopyIdentifier', () => {
  it('shows eight characters and an ellipsis; the name holds the full value', () => {
    render(<CopyIdentifier value={long} />)
    expect(long).toHaveLength(36)
    const button = screen.getByRole('button', { name: `Copy: ${long}` })
    // The whole value is in the tree; CSS elides it after about eight character widths.
    expect(button).toHaveTextContent(long)
    expect(button.querySelector('[data-elided]')).toHaveStyle({ '--ty-copy-visible': '8' })
  })

  it('shows a short value whole', () => {
    render(<CopyIdentifier value="abc123" />)
    expect(screen.getByRole('button')).toHaveTextContent(/^abc123$/)
  })

  it('copies copyValue on Space and announces it', async () => {
    const user = userEvent.setup()
    const onCopy = vi.fn()
    render(<CopyIdentifier value={long} copyValue={`https://x.org/r/${long}`} onCopy={onCopy} />)
    await user.tab()
    await user.keyboard(' ')
    expect(await navigator.clipboard.readText()).toBe(`https://x.org/r/${long}`)
    expect(screen.getByRole('status')).toHaveTextContent(/copied/i)
    expect(onCopy).toHaveBeenCalledWith(true)
  })

  it('does not trigger the handler of a clickable parent', async () => {
    const user = userEvent.setup()
    const onRow = vi.fn()
    render(
      <div onClick={onRow}>
        <CopyIdentifier value={long} />
      </div>,
    )
    await user.click(screen.getByRole('button'))
    expect(onRow).not.toHaveBeenCalled()
  })

  it('announces failure when the clipboard rejects', async () => {
    const user = userEvent.setup()
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('denied'))
    const onCopy = vi.fn()
    render(<CopyIdentifier value={long} onCopy={onCopy} />)
    await user.click(screen.getByRole('button'))
    expect(onCopy).toHaveBeenCalledWith(false)
    expect(screen.getByRole('status')).toHaveTextContent(/failed/i)
    expect(screen.getByRole('button')).toHaveTextContent(long.slice(0, 8))
  })

  it('returns to the idle icon after about two seconds', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const { container } = render(<CopyIdentifier value={long} />)
    await user.click(screen.getByRole('button'))
    expect(container.firstElementChild).toHaveAttribute('data-phase', 'copied')
    act(() => {
      vi.advanceTimersByTime(COPY_CONFIRMATION_MS + 10)
    })
    expect(container.firstElementChild).toHaveAttribute('data-phase', 'idle')
  })

  it('keeps a 44 px hit area', () => {
    expect(cssOf('components/copy-identifier/CopyIdentifier.css')).toMatch(/__trigger::before\s*\{[^}]*inline-size:\s*max\(100%,\s*var\(--ty-control-target\)\)/)
  })

  it('has no axe violations, light and dark', async () => {
    const { container } = render(
      <>
        {(['light', 'dark'] as const).map((scheme) => (
          <ThemeScope key={scheme} scheme={scheme}>
            <CopyIdentifier value={long} />
          </ThemeScope>
        ))}
      </>,
    )
    await expectNoAxeViolations(container)
  })
})

describe('CopyIdentifier in right-to-left (ar)', () => {
  it('renders mirrored where directional and passes axe', async () => {
    const { container } = renderRtl(<CopyIdentifier value="ae-tamm-4-0-9f2c7d1e3b5a" />)
    // A machine identifier reads left to right inside right-to-left text.
    expect(container.querySelector('[data-elided]')).toHaveAttribute('dir', 'ltr')
    await axeRtl(container)
  })
})
