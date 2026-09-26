import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Bell, Languages } from 'lucide-react'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { ThemeScope } from '../../internal/ThemeScope'
import { ToolbarTrigger } from './ToolbarTrigger'
import * as rtlDom from '@testing-library/react'
import { expectNoAxeViolations as axeRtl } from '../../../test/axe'
import { renderRtl } from '../../../test/rtl'

describe('ToolbarTrigger', () => {
  it('names an icon-only trigger by its label and shows a tooltip on focus', async () => {
    render(<ToolbarTrigger icon={<Bell />} label="Notifications" />)
    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'Notifications' })).toHaveFocus()
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Notifications')
  })

  it('keeps a visible caption inside the accessible name', () => {
    render(<ToolbarTrigger icon={<Languages />} label="Language" caption="EN" />)
    const button = screen.getByRole('button')
    expect(button.getAttribute('aria-label')).toContain('EN')
    expect(button).toHaveTextContent('EN')
  })

  it('exposes popup and expanded state', () => {
    render(<ToolbarTrigger icon={<Bell />} label="Account" controls="menu" expanded />)
    const button = screen.getByRole('button', { name: 'Account' })
    expect(button).toHaveAttribute('aria-haspopup', 'menu')
    expect(button).toHaveAttribute('aria-expanded', 'true')
  })

  it('reports a toggle state and fires onPress with Enter and Space', async () => {
    const onPress = vi.fn()
    render(<ToolbarTrigger icon={<Bell />} label="Focus mode" pressed onPress={onPress} />)
    const button = screen.getByRole('button', { name: 'Focus mode' })
    expect(button).toHaveAttribute('aria-pressed', 'true')
    button.focus()
    await userEvent.keyboard('{Enter}')
    await userEvent.keyboard(' ')
    expect(onPress).toHaveBeenCalledTimes(2)
  })

  it('keeps a 44 px hit area and drops transitions under reduced motion', () => {
    const css = cssOf('components/toolbar-trigger/ToolbarTrigger.css')
    expect(css).toMatch(/::after\s*\{[^}]*inline-size:\s*max\(100%,\s*var\(--ty-control-target\)\)/)
    expect(mediaBlock(css, /\(prefers-reduced-motion:\s*reduce\)/)).toMatch(/transition:\s*none/)
    expect(mediaBlock(css, /\(forced-colors:\s*active\)/)).toMatch(/Highlight/)
  })

  it('has no axe violations, light and dark', async () => {
    const { container } = render(
      <>
        {(['light', 'dark'] as const).map((scheme) => (
          <ThemeScope key={scheme} scheme={scheme}>
            <ToolbarTrigger icon={<Bell />} label="Notifications" />
            <ToolbarTrigger icon={<Languages />} label="Language" caption="PT" controls="menu" expanded={false} />
            <ToolbarTrigger icon={<Bell />} label="Muted" disabled />
          </ThemeScope>
        ))}
      </>,
    )
    await expectNoAxeViolations(container)
  })
})

describe('ToolbarTrigger in right-to-left (ar)', () => {
  it('renders mirrored where directional and passes axe', async () => {
    const { container } = renderRtl(<ToolbarTrigger icon={<span />} label="اللغة" caption="ع" />)
    expect(rtlDom.screen.getByRole('button', { name: /اللغة/ })).toBeInTheDocument()
    await axeRtl(container)
  })
})
