import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Plus } from 'lucide-react'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { renderWithProvider } from '../../../test/render'
import { ThemeScope } from '../../internal/ThemeScope'
import { Button } from './Button'

import * as rtlDom from '@testing-library/react'
import rtlUser from '@testing-library/user-event'
import { expectNoAxeViolations as axeRtl } from '../../../test/axe'
import { renderRtl } from '../../../test/rtl'

describe('Button', () => {
  it('calls onPress once when clicked', async () => {
    const onPress = vi.fn()
    render(<Button onPress={onPress}>Save</Button>)
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('calls onPress on Space and Enter', async () => {
    const onPress = vi.fn()
    render(<Button onPress={onPress}>Save</Button>)
    await userEvent.tab()
    expect(screen.getByRole('button')).toHaveFocus()
    await userEvent.keyboard(' ')
    await userEvent.keyboard('{Enter}')
    expect(onPress).toHaveBeenCalledTimes(2)
  })

  it('renders a link that navigates through the router adapter', async () => {
    const navigate = vi.fn()
    const onPress = vi.fn()
    renderWithProvider(
      <Button href="/sources" onPress={onPress}>
        Sources
      </Button>,
      { navigate },
    )
    const link = screen.getByRole('link', { name: 'Sources' })
    await userEvent.click(link)
    expect(navigate).toHaveBeenCalledWith('/sources', undefined)
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('ignores presses while busy and reports aria-busy', async () => {
    const onPress = vi.fn()
    render(
      <Button busy onPress={onPress}>
        Send
      </Button>,
    )
    const button = screen.getByRole('button', { name: 'Send' })
    await userEvent.click(button)
    expect(onPress).not.toHaveBeenCalled()
    expect(button).toHaveAttribute('aria-busy', 'true')
  })

  it('announces busyLabel in place of the label', () => {
    render(
      <Button busy busyLabel="Sending">
        Send
      </Button>,
    )
    expect(screen.getByRole('button', { name: 'Sending' })).toBeInTheDocument()
  })

  it('does nothing when disabled and is skipped by Tab', async () => {
    const onPress = vi.fn()
    render(
      <>
        <Button disabled onPress={onPress}>
          Delete
        </Button>
        <Button>Next</Button>
      </>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }))
    expect(onPress).not.toHaveBeenCalled()
    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'Next' })).toHaveFocus()
  })

  it('stays reachable with focusableWhenDisabled and reports aria-disabled', async () => {
    const onPress = vi.fn()
    render(
      <Button disabled focusableWhenDisabled onPress={onPress}>
        Publish
      </Button>,
    )
    await userEvent.tab()
    const button = screen.getByRole('button', { name: 'Publish' })
    expect(button).toHaveFocus()
    expect(button).toHaveAttribute('aria-disabled', 'true')
    await userEvent.keyboard('{Enter}')
    expect(onPress).not.toHaveBeenCalled()
  })

  it('uses accessibleLabel as the name of an icon-only button', () => {
    render(<Button iconOnly accessibleLabel="Add source" leadingIcon={<Plus />} />)
    const button = screen.getByRole('button', { name: 'Add source' })
    expect(button).toHaveAttribute('title', 'Add source')
    expect(button.querySelector('svg')?.closest('[aria-hidden="true"]')).not.toBeNull()
  })

  it('warns in development when iconOnly has no accessibleLabel', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    render(<Button iconOnly leadingIcon={<Plus />} />)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('accessibleLabel'))
    warn.mockRestore()
  })

  it('marks the current page in link mode', () => {
    renderWithProvider(
      <Button href="/a" current>
        Overview
      </Button>,
      { navigate: vi.fn() },
    )
    expect(screen.getByRole('link', { name: 'Overview' })).toHaveAttribute('aria-current', 'page')
  })

  it('keeps a 44 px hit area at every size, including compact', () => {
    const { container } = render(<Button size="compact">Edit</Button>)
    expect(container.querySelector('.fk-button')).toHaveAttribute('data-size', 'compact')
    const css = cssOf('components/button/Button.css')
    expect(css).toMatch(/\.fk-button::before\s*\{[^}]*inline-size:\s*max\(100%,\s*var\(--fk-control-target\)\)/)
    expect(css).toMatch(/\.fk-button::before\s*\{[^}]*block-size:\s*max\(100%,\s*var\(--fk-control-target\)\)/)
  })

  it('runs no transform animation under reduced motion', () => {
    const reduced = mediaBlock(cssOf('components/button/Button.css'), /\(prefers-reduced-motion:\s*reduce\)/)
    expect(reduced).toMatch(/\.fk-button\[data-pressed\]\s*\{[^}]*transform:\s*none/)
    expect(reduced).toMatch(/\.fk-button__busy\s*\{[^}]*animation:\s*none/)
  })

  it('draws system colours in forced-colors mode', () => {
    const forced = mediaBlock(cssOf('components/button/Button.css'), /\(forced-colors:\s*active\)/)
    expect(forced).toMatch(/ButtonFace/)
    expect(forced).toMatch(/Highlight/)
  })

  it('has no axe violations in every variant, light and dark', async () => {
    const { container } = render(
      <>
        {(['light', 'dark'] as const).map((scheme) => (
          <ThemeScope key={scheme} scheme={scheme}>
            {(['primary', 'secondary', 'quiet', 'danger'] as const).map((variant) => (
              <Button key={variant} variant={variant}>
                {variant}
              </Button>
            ))}
            <Button iconOnly accessibleLabel="Add" leadingIcon={<Plus />} />
            <Button busy>Busy</Button>
            <Button disabled>Disabled</Button>
          </ThemeScope>
        ))}
      </>,
    )
    await expectNoAxeViolations(container)
  })
})

describe('Button in right-to-left (ar)', () => {
  it('renders mirrored where directional and passes axe', async () => {
    const onPress = vi.fn()
    const { container } = renderRtl(<Button onPress={onPress}>حفظ</Button>)
    await rtlUser.click(rtlDom.screen.getByRole('button', { name: 'حفظ' }))
    expect(onPress).toHaveBeenCalledTimes(1)
    // The 44 px hit area is centred with a physical left: 50% + translate(-50%), identical in both directions.
    expect(cssOf('components/button/Button.css')).toMatch(/\.fk-button::before\s*\{[^}]*left:\s*50%/)
    await axeRtl(container)
  })
})
