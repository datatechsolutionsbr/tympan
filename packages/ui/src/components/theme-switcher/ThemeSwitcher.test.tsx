import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { ThemeScope } from '../../internal/ThemeScope'
import { ThemeSwitcher } from './ThemeSwitcher'
import { expectNoAxeViolations as axeRtl } from '../../../test/axe'
import * as rtlDom from '@testing-library/react'
import { renderRtl } from '../../../test/rtl'

describe('ThemeSwitcher', () => {
  it('full variant: an unchecked switch named "Dark mode" in light mode', () => {
    render(<ThemeSwitcher mode="light" onModeChange={() => {}} />)
    expect(screen.getByRole('switch', { name: 'Dark mode' })).not.toBeChecked()
  })

  it('toggling the switch requests dark', async () => {
    const onModeChange = vi.fn()
    render(<ThemeSwitcher mode="light" onModeChange={onModeChange} />)
    await userEvent.click(screen.getByRole('switch'))
    expect(onModeChange).toHaveBeenCalledWith('dark')
  })

  it('keeps a stable name and reports checked in dark mode', () => {
    render(<ThemeSwitcher mode="dark" onModeChange={() => {}} />)
    expect(screen.getByRole('switch', { name: 'Dark mode' })).toBeChecked()
  })

  it('compact variant names the action and requests light', async () => {
    const onModeChange = vi.fn()
    render(<ThemeSwitcher mode="dark" variant="compact" onModeChange={onModeChange} />)
    await userEvent.click(screen.getByRole('button', { name: 'Switch to light mode' }))
    expect(onModeChange).toHaveBeenCalledWith('light')
  })

  it('has no animation under reduced motion', () => {
    const reduced = mediaBlock(cssOf('components/theme-switcher/ThemeSwitcher.css'), /\(prefers-reduced-motion:\s*reduce\)/)
    expect(reduced).toMatch(/\.ty-theme-switcher__knob[\s\S]*transition:\s*none/)
  })

  it('keeps a 44 px hit area and system colours in forced-colors mode', () => {
    const css = cssOf('components/theme-switcher/ThemeSwitcher.css')
    expect(css).toMatch(/min-block-size:\s*var\(--ty-control-target\)/)
    expect(css).toMatch(/inline-size:\s*max\(100%,\s*var\(--ty-control-target\)\)/)
    expect(mediaBlock(css, /\(forced-colors:\s*active\)/)).toMatch(/Highlight/)
  })

  it('has no axe violations, light and dark', async () => {
    const { container } = render(
      <>
        {(['light', 'dark'] as const).map((scheme) => (
          <ThemeScope key={scheme} scheme={scheme}>
            <ThemeSwitcher mode={scheme} onModeChange={() => {}} />
            <ThemeSwitcher mode={scheme} variant="compact" onModeChange={() => {}} />
          </ThemeScope>
        ))}
      </>,
    )
    await expectNoAxeViolations(container)
  })
})

describe('ThemeSwitcher in right-to-left (ar)', () => {
  it('renders mirrored where directional and passes axe', async () => {
    const { container } = renderRtl(<ThemeSwitcher mode="light" onModeChange={() => {}} />)
    expect(rtlDom.screen.getByRole('switch')).toBeInTheDocument()
    expect(cssOf('components/theme-switcher/ThemeSwitcher.css')).toMatch(/:dir\(rtl\)\s*\{[^}]*translate:\s*calc\(-1/)
    await axeRtl(container)
  })
})
