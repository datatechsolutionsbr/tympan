import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { setMedia } from '../../../test/media'
import { ThemeScope } from '../../internal/ThemeScope'
import { GLASS_CHECK_MARKER, GlassCheckToggle } from './GlassCheckToggle'

const css = cssOf('components/glass-check-toggle/GlassCheckToggle.css')
const root = () => document.documentElement

describe('GlassCheckToggle', () => {
  it('renders nothing and leaves the root alone when not enabled', () => {
    const { container } = render(<GlassCheckToggle />)
    expect(container).toBeEmptyDOMElement()
    expect(root()).not.toHaveAttribute(GLASS_CHECK_MARKER)
  })

  it('sets the root marker and aria-pressed when pressed', async () => {
    const onChange = vi.fn()
    render(<GlassCheckToggle enabled onChange={onChange} />)
    const button = screen.getByRole('button', { name: 'Glass check' })
    expect(button).toHaveAttribute('aria-pressed', 'false')
    await userEvent.click(button)
    expect(button).toHaveAttribute('aria-pressed', 'true')
    expect(root()).toHaveAttribute(GLASS_CHECK_MARKER)
    expect(onChange).toHaveBeenCalledWith(true)
  })

  it('removes the marker on unmount while on', () => {
    const { unmount } = render(<GlassCheckToggle enabled defaultOn />)
    expect(root()).toHaveAttribute(GLASS_CHECK_MARKER)
    unmount()
    expect(root()).not.toHaveAttribute(GLASS_CHECK_MARKER)
  })

  it('replaces the page background with the reserved test colour while on', () => {
    // A level-1 surface is translucent over --ty-bg, so its computed backdrop changes with it.
    expect(css).toMatch(/:root\[data-ty-glass-check\][^{]*\{[^}]*--ty-bg:\s*var\(--ty-debug-glass-check\)/)
    expect(css).toMatch(/:root\[data-ty-glass-check\] body\s*\{[^}]*background:\s*transparent/)
  })

  it('explains that the check does not apply under reduced transparency', async () => {
    setMedia({ reducedTransparency: true })
    render(<GlassCheckToggle enabled />)
    const button = screen.getByRole('button', { name: 'Glass check' })
    expect(button).toHaveAttribute('data-moot', 'true')
    await userEvent.tab()
    expect(await screen.findByRole('tooltip')).toHaveTextContent(/does not apply/)
  })

  it('keeps a 44 px hit area and no switching animation; forced colours use system colours', () => {
    expect(css).toMatch(/\.ty-glass-check::before\s*\{[^}]*max\(100%,\s*var\(--ty-control-target\)\)/)
    expect(mediaBlock(css, /\(forced-colors:\s*active\)/)).toMatch(/Highlight/)
  })

  it('has no axe violations, light and dark', async () => {
    const { container } = render(
      <>
        {(['light', 'dark'] as const).map((scheme) => (
          <ThemeScope key={scheme} scheme={scheme}>
            <GlassCheckToggle enabled label={`Glass check ${scheme}`} />
          </ThemeScope>
        ))}
      </>,
    )
    await expectNoAxeViolations(container)
  })
})
