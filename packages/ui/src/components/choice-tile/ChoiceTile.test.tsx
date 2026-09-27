import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Languages } from 'lucide-react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { ThemeScope } from '../../internal/ThemeScope'
import { ChoiceTile } from './ChoiceTile'
import { expectNoAxeViolations as axeRtl } from '../../../test/axe'
import * as rtlDom from '@testing-library/react'
import { renderRtl } from '../../../test/rtl'

function stubVibrate() {
  const vibrate = vi.fn(() => true)
  Object.defineProperty(navigator, 'vibrate', { configurable: true, value: vibrate })
  return vibrate
}

describe('ChoiceTile', () => {
  afterEach(() => {
    delete (navigator as { vibrate?: unknown }).vibrate
  })

  it('calls onPress once and requests a light haptic', async () => {
    const vibrate = stubVibrate()
    const onPress = vi.fn()
    render(
      <ChoiceTile selected={false} onPress={onPress}>
        Brazil
      </ChoiceTile>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Brazil' }))
    expect(onPress).toHaveBeenCalledTimes(1)
    expect(vibrate).toHaveBeenCalledTimes(1)
  })

  it('does nothing when disabled', async () => {
    const onPress = vi.fn()
    render(
      <ChoiceTile selected={false} disabled onPress={onPress}>
        Brazil
      </ChoiceTile>,
    )
    await userEvent.click(screen.getByRole('button'))
    expect(onPress).not.toHaveBeenCalled()
  })

  it('is named by label when the content is an icon', () => {
    render(
      <ChoiceTile selected={false} label="Portuguese">
        <Languages aria-hidden="true" />
      </ChoiceTile>,
    )
    expect(screen.getByRole('button', { name: 'Portuguese' })).toBeInTheDocument()
  })

  it('warns in development for icon-only content without label', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    render(
      <ChoiceTile selected={false}>
        <Languages aria-hidden="true" />
      </ChoiceTile>,
    )
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('label'))
    warn.mockRestore()
  })

  it('reports aria-pressed when selected, and toggles with Space and Enter', async () => {
    const onPress = vi.fn()
    render(
      <ChoiceTile selected onPress={onPress} haptic={false}>
        Park station
      </ChoiceTile>,
    )
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true')
    await userEvent.tab()
    await userEvent.keyboard(' ')
    await userEvent.keyboard('{Enter}')
    expect(onPress).toHaveBeenCalledTimes(2)
  })

  it('keeps a 44 x 44 hit area for every shape; forced colours outline the selection', () => {
    const css = cssOf('components/choice-tile/ChoiceTile.css')
    expect(css).toMatch(/\.ty-choice-tile::before\s*\{[^}]*inline-size:\s*max\(100%,\s*var\(--ty-control-target\)\)/)
    expect(css).toMatch(/\.ty-choice-tile::before\s*\{[^}]*block-size:\s*max\(100%,\s*var\(--ty-control-target\)\)/)
    expect(mediaBlock(css, /\(forced-colors:\s*active\)/)).toMatch(/\[data-selected\][^}]*Highlight/)
    expect(mediaBlock(css, /\(prefers-reduced-motion:\s*reduce\)/)).toMatch(/transition:\s*none/)
  })

  it('has no axe violations, light and dark', async () => {
    const { container } = render(
      <>
        {(['light', 'dark'] as const).map((scheme) => (
          <ThemeScope key={scheme} scheme={scheme}>
            <ChoiceTile selected shape="pill">
              Selected {scheme}
            </ChoiceTile>
            <ChoiceTile selected={false} shape="card" label={`Language ${scheme}`}>
              <Languages aria-hidden="true" />
            </ChoiceTile>
            <ChoiceTile selected={false} disabled>
              Disabled {scheme}
            </ChoiceTile>
          </ThemeScope>
        ))}
      </>,
    )
    await expectNoAxeViolations(container)
  })
})

describe('ChoiceTile in right-to-left (ar)', () => {
  it('renders mirrored where directional and passes axe', async () => {
    const { container } = renderRtl(<ChoiceTile selected shape="pill" onPress={() => {}}>العربية</ChoiceTile>)
    expect(rtlDom.screen.getByRole('button', { name: 'العربية' })).toHaveAttribute('aria-pressed', 'true')
    await axeRtl(container)
  })
})
