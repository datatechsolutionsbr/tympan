import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { Switch, SwitchGroup } from './Switch'

import * as rtlDom from '@testing-library/react'
import rtlUser from '@testing-library/user-event'
import { expectNoAxeViolations as axeRtl } from '../../../test/axe'
import { renderRtl } from '../../../test/rtl'

describe('Switch', () => {
  it('has role switch and starts unchecked', () => {
    render(<Switch label="Notifications" />)
    const sw = screen.getByRole('switch', { name: 'Notifications' })
    expect(sw).not.toBeChecked()
  })

  it('calls onChange with true on click, also via its label', async () => {
    const onChange = vi.fn()
    render(<Switch label="Notifications" onChange={onChange} />)
    await userEvent.click(screen.getByText('Notifications'))
    expect(onChange).toHaveBeenCalledWith(true)
    expect(screen.getByRole('switch')).toBeChecked()
  })

  it('toggles with Space and with Enter', async () => {
    render(<Switch label="Dark mode" />)
    await userEvent.tab()
    await userEvent.keyboard(' ')
    expect(screen.getByRole('switch')).toBeChecked()
    await userEvent.keyboard('{Enter}')
    expect(screen.getByRole('switch')).not.toBeChecked()
  })

  it('toggles uncontrolled from defaultSelected', async () => {
    render(<Switch label="Sync" defaultSelected />)
    expect(screen.getByRole('switch')).toBeChecked()
    await userEvent.click(screen.getByRole('switch'))
    expect(screen.getByRole('switch')).not.toBeChecked()
  })

  it('does not change when disabled', async () => {
    const onChange = vi.fn()
    render(<Switch label="Locked" disabled onChange={onChange} />)
    await userEvent.click(screen.getByText('Locked'))
    screen.getByRole('switch').focus()
    await userEvent.keyboard(' ')
    await userEvent.keyboard('{Enter}')
    expect(onChange).not.toHaveBeenCalled()
  })

  it('is focusable but unchangeable when readOnly', async () => {
    const onChange = vi.fn()
    render(<Switch label="Fixed" readOnly defaultSelected onChange={onChange} />)
    await userEvent.tab()
    expect(screen.getByRole('switch')).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    await userEvent.click(screen.getByRole('switch'))
    expect(onChange).not.toHaveBeenCalled()
    expect(screen.getByRole('switch')).toBeChecked()
  })

  it('puts the tile description in the accessible description', () => {
    render(<Switch layout="tile" label="Weekly digest" description="Every Monday" />)
    const sw = screen.getByRole('switch', { name: 'Weekly digest' })
    expect(sw).toHaveAccessibleDescription('Every Monday')
  })

  it('uses accessibleLabel without a visible label', () => {
    render(<Switch accessibleLabel="Enable row" />)
    expect(screen.getByRole('switch', { name: 'Enable row' })).toBeInTheDocument()
  })

  it('keeps a 44 px hit area at the small size', () => {
    const { container } = render(<Switch label="Small" size="small" />)
    expect(container.querySelector('.ty-switch')).toHaveAttribute('data-size', 'small')
    const css = cssOf('components/switch/Switch.css')
    expect(css).toMatch(/\.ty-switch\s*\{[^}]*min-block-size:\s*var\(--ty-control-target\)/)
    expect(css).toMatch(/\.ty-switch__track::before\s*\{[^}]*block-size:\s*max\(100%,\s*var\(--ty-control-target\)\)/)
  })

  it('runs no transition under reduced motion; forced colours outline the track', () => {
    const css = cssOf('components/switch/Switch.css')
    expect(mediaBlock(css, /\(prefers-reduced-motion:\s*reduce\)/)).toMatch(/\.ty-switch__thumb\s*\{[^}]*transition:\s*none/)
    expect(mediaBlock(css, /\(forced-colors:\s*active\)/)).toMatch(/CanvasText/)
  })

  it('groups rows under a label and has no axe violations', async () => {
    const { container } = render(
      <SwitchGroup label="Email">
        <Switch label="Mentions" />
        <Switch label="Digest" layout="tile" description="Weekly" defaultSelected />
      </SwitchGroup>,
    )
    expect(screen.getByRole('group', { name: 'Email' })).toBeInTheDocument()
    await expectNoAxeViolations(container)
  })
})

describe('Switch in right-to-left (ar)', () => {
  it('renders mirrored where directional and passes axe', async () => {
    const { container } = renderRtl(<Switch label="الإشعارات" />)
    const sw = rtlDom.screen.getByRole('switch', { name: 'الإشعارات' })
    await rtlUser.click(sw)
    expect(sw).toBeChecked()
    // The thumb travels towards the inline end, which is the left in right-to-left.
    expect(cssOf('components/switch/Switch.css')).toMatch(/:dir\(rtl\)\s*\{[^}]*translateX\(calc\(-1/)
    await axeRtl(container)
  })
})
