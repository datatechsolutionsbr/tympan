import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FileText } from 'lucide-react'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { ThemeScope } from '../../internal/ThemeScope'
import { Button } from '../button/Button'
import { SectionPanel } from './SectionPanel'
import * as rtlDom from '@testing-library/react'
import { expectNoAxeViolations as axeRtl } from '../../../test/axe'
import { renderRtl } from '../../../test/rtl'

describe('SectionPanel', () => {
  it('is a section named by its heading at the requested level', () => {
    render(
      <SectionPanel title="Sources" headingLevel={3}>
        Body
      </SectionPanel>,
    )
    expect(screen.getByRole('region', { name: 'Sources' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'Sources' })).toBeInTheDocument()
  })

  it('opens a collapsed panel with Enter and shows toolbar, tags and body', async () => {
    render(
      <SectionPanel title="Sources" collapsible defaultOpen={false} toolbar={<span>Toolbar</span>} tags={<span>Tags</span>}>
        Body text
      </SectionPanel>,
    )
    const trigger = screen.getByRole('button', { name: 'Sources' })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('Body text')).not.toBeVisible()
    trigger.focus()
    await userEvent.keyboard('{Enter}')
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('Body text')).toBeVisible()
    expect(screen.getByText('Toolbar')).toBeVisible()
    expect(screen.getByText('Tags')).toBeVisible()
    expect(trigger.getAttribute('aria-controls')).toBe(screen.getByText('Body text').closest('[role="region"]')?.id)
  })

  it('keeps header actions outside the trigger as separate tab stops', async () => {
    render(
      <SectionPanel title="Sources" collapsible actions={<Button>New source</Button>}>
        Body
      </SectionPanel>,
    )
    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'Sources' })).toHaveFocus()
    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'New source' })).toHaveFocus()
    expect(screen.getByRole('button', { name: 'Sources' }).contains(screen.getByRole('button', { name: 'New source' }))).toBe(false)
  })

  it('reports the new state in controlled mode and waits for the prop', async () => {
    const onOpenChange = vi.fn()
    render(
      <SectionPanel title="Sources" collapsible open={false} onOpenChange={onOpenChange}>
        Body
      </SectionPanel>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Sources' }))
    expect(onOpenChange).toHaveBeenCalledWith(true)
    expect(screen.getByRole('button', { name: 'Sources' })).toHaveAttribute('aria-expanded', 'false')
  })

  it('follows a controlled prop change', async () => {
    function Controlled() {
      const [open, setOpen] = useState(true)
      return (
        <SectionPanel title="Sources" collapsible open={open} onOpenChange={setOpen}>
          Body
        </SectionPanel>
      )
    }
    render(<Controlled />)
    await userEvent.click(screen.getByRole('button', { name: 'Sources' }))
    expect(screen.getByRole('button', { name: 'Sources' })).toHaveAttribute('aria-expanded', 'false')
  })

  it('runs no rotation under reduced motion, becomes opaque with reduced transparency, keeps a border in forced colours', () => {
    const css = cssOf('components/section-panel/SectionPanel.css')
    expect(mediaBlock(css, /\(prefers-reduced-motion:\s*reduce\)/)).toMatch(/__chevron\s*\{[^}]*transition:\s*none/)
    expect(mediaBlock(css, /\(prefers-reduced-transparency:\s*reduce\)/)).toMatch(/surface-solid/)
    expect(mediaBlock(css, /\(forced-colors:\s*active\)/)).toMatch(/1px solid CanvasText/)
    expect(css).toMatch(/__trigger\s*\{[^}]*min-block-size:\s*var\(--fk-control-target\)/)
  })

  it('hides the stripe and icon from assistive technology', () => {
    const { container } = render(<SectionPanel title="Sources" accentStripe icon={<FileText />} />)
    expect(container.querySelector('.fk-section-panel__stripe')).toHaveAttribute('aria-hidden', 'true')
    expect(container.querySelector('.fk-section-panel__icon')).toHaveAttribute('aria-hidden', 'true')
  })

  it('has no axe violations, light and dark, static and collapsible', async () => {
    const { container } = render(
      <>
        {(['light', 'dark'] as const).map((scheme) => (
          <ThemeScope key={scheme} scheme={scheme}>
            <SectionPanel title={`Sources ${scheme}`} eyebrow="Collect" subtitle="Where the evidence comes from." accentStripe actions={<Button>New</Button>}>
              Body
            </SectionPanel>
            <SectionPanel title={`Folded ${scheme}`} collapsible defaultOpen={false} scale="surface" elevation="raised">
              Body
            </SectionPanel>
          </ThemeScope>
        ))}
      </>,
    )
    await expectNoAxeViolations(container)
  })
})

describe('SectionPanel in right-to-left (ar)', () => {
  it('renders mirrored where directional and passes axe', async () => {
    const { container } = renderRtl(<SectionPanel title="المصادر والمسار" eyebrow="جمع"><p>نص</p></SectionPanel>)
    expect(rtlDom.screen.getByRole('heading', { name: /المصادر والمسار/ })).toBeInTheDocument()
    await axeRtl(container)
  })
})
