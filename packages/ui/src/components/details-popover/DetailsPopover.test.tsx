import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf } from '../../../test/css'
import { setViewportWidth } from '../../../test/media'
import { DetailsPopover } from './DetailsPopover'
import * as rtlDom from '@testing-library/react'
import rtlUser from '@testing-library/user-event'
import { expectNoAxeViolations as axeRtl } from '../../../test/axe'
import { renderRtl } from '../../../test/rtl'

const change = {
  triggerLabel: 'Details of the change',
  title: 'Status changed',
  comparison: { label: 'Status', fromLabel: 'from', fromValue: 'Pending', toLabel: 'to', toValue: 'Proved' },
}

describe('DetailsPopover', () => {
  it('opens a dialog named by the title with Enter and moves focus inside', async () => {
    render(<DetailsPopover {...change} />)
    const trigger = screen.getByRole('button', { name: 'Details of the change' })
    expect(trigger).toHaveAttribute('aria-haspopup', 'dialog')
    trigger.focus()
    await userEvent.keyboard('{Enter}')
    const dialog = await screen.findByRole('dialog', { name: 'Status changed' })
    expect(dialog.contains(document.activeElement)).toBe(true)
  })

  it('closes on Escape and returns focus to the trigger', async () => {
    render(<DetailsPopover {...change} />)
    const trigger = screen.getByRole('button', { name: 'Details of the change' })
    await userEvent.click(trigger)
    await screen.findByRole('dialog')
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).toBeNull()
    await waitFor(() => expect(trigger).toHaveFocus())
  })

  it('reads the comparison as a sentence with both values in order', async () => {
    render(<DetailsPopover {...change} />)
    await userEvent.click(screen.getByRole('button'))
    const dialog = await screen.findByRole('dialog')
    expect(dialog.textContent?.replace(/\s+/g, ' ')).toContain('Status: from Pending to Proved')
  })

  it('shows the agent mark and word for an agent', async () => {
    render(<DetailsPopover {...change} actor={{ kind: 'agent', name: 'limit-counter', detail: 'model-x' }} />)
    await userEvent.click(screen.getByRole('button'))
    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveTextContent('agent')
    expect(dialog.querySelector('[data-kind="agent"]')).not.toBeNull()
  })

  it('renders no empty blocks with only a title and a note', async () => {
    render(<DetailsPopover triggerLabel="Details" title="Note added" note={{ label: 'Note', value: 'Checked twice.' }} />)
    await userEvent.click(screen.getByRole('button'))
    const dialog = await screen.findByRole('dialog')
    expect(dialog.querySelector('.ty-details-popover__row, .ty-details-popover__when, .ty-details-popover__change')).toBeNull()
    expect(dialog).toHaveTextContent('Checked twice.')
  })

  it('opens as a bottom drawer under 640', async () => {
    setViewportWidth(375)
    render(<DetailsPopover {...change} />)
    await userEvent.click(screen.getByRole('button', { name: 'Details of the change' }))
    expect(await screen.findByRole('dialog', { name: 'Status changed' })).toBeInTheDocument()
    expect(document.querySelector('.ty-details-popover')).toBeNull()
  })

  it('keeps a 44 px target', () => {
    expect(cssOf('components/details-popover/DetailsPopover.css')).toMatch(/max\(100%,\s*var\(--ty-control-target\)\)/)
  })

  it('has no axe violations when open', async () => {
    render(<DetailsPopover {...change} tone="success" actor={{ kind: 'person', name: 'Ana Souza', detail: 'ana@example.org' }} timestamp="2026-09-23T10:00:00Z" note={{ label: 'Note', value: 'Ok.' }} />)
    await userEvent.click(screen.getByRole('button'))
    await screen.findByRole('dialog')
    await expectNoAxeViolations(document.body)
  })
})

describe('DetailsPopover in right-to-left (ar)', () => {
  it('renders mirrored where directional and passes axe', async () => {
    renderRtl(<DetailsPopover triggerLabel="تفاصيل التغيير" title="تغيرت الحالة" tone="success" comparison={{ label: 'الحالة', fromLabel: 'من', fromValue: 'معلق', toLabel: 'إلى', toValue: 'مثبت' }} />)
    await rtlUser.click(rtlDom.screen.getByRole('button', { name: 'تفاصيل التغيير' }))
    const dialog = await rtlDom.screen.findByRole('dialog')
    // The from → to arrow points along the reading direction.
    expect(dialog.querySelector('.ty-details-popover__arrow')).toHaveClass('ty-mirror-rtl')
    await axeRtl(document.body)
  })
})
