import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Grid, List } from 'lucide-react'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { SegmentedControl } from './SegmentedControl'

import * as rtlDom from '@testing-library/react'
import rtlUser from '@testing-library/user-event'
import { expectNoAxeViolations as axeRtl } from '../../../test/axe'
import { useState as useRtlState } from 'react'
import { renderRtl } from '../../../test/rtl'

const periods = ['Day', 'Week', 'Month']

describe('SegmentedControl', () => {
  it('checks the value and keeps only it in the tab order', async () => {
    render(
      <>
        <button type="button">before</button>
        <SegmentedControl label="Period" options={periods} defaultValue="Week" onChange={() => {}} />
        <button type="button">after</button>
      </>,
    )
    const week = screen.getByRole('radio', { name: 'Week' })
    expect(week).toBeChecked()
    screen.getByRole('button', { name: 'before' }).focus()
    await userEvent.tab()
    expect(week).toHaveFocus()
    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'after' })).toHaveFocus()
  })

  it('selects the next segment with ArrowRight and calls onChange', async () => {
    const onChange = vi.fn()
    render(<SegmentedControl label="Period" options={periods} defaultValue="Week" onChange={onChange} />)
    await userEvent.tab()
    await userEvent.keyboard('{ArrowRight}')
    expect(onChange).toHaveBeenCalledWith('Month')
    expect(screen.getByRole('radio', { name: 'Month' })).toBeChecked()
  })

  it('wraps from the last segment to the first', async () => {
    const onChange = vi.fn()
    render(<SegmentedControl label="Period" options={periods} defaultValue="Month" onChange={onChange} />)
    await userEvent.tab()
    await userEvent.keyboard('{ArrowRight}')
    expect(onChange).toHaveBeenCalledWith('Day')
  })

  it('does not call onChange when the selected segment is clicked again', async () => {
    const onChange = vi.fn()
    render(<SegmentedControl label="Period" options={periods} defaultValue="Week" onChange={onChange} />)
    await userEvent.click(screen.getByText('Week'))
    expect(onChange).not.toHaveBeenCalled()
  })

  it('is exposed as disabled and ignores clicks when disabled', async () => {
    const onChange = vi.fn()
    render(<SegmentedControl label="Period" options={periods} disabled onChange={onChange} />)
    await userEvent.click(screen.getByText('Month'))
    expect(onChange).not.toHaveBeenCalled()
    expect(screen.getByRole('radiogroup', { name: 'Period' })).toHaveAttribute('aria-disabled', 'true')
  })

  it('keeps labels as accessible names when icon-only', () => {
    render(
      <SegmentedControl
        label="View"
        iconOnly
        options={[
          { value: 'grid', label: 'Grid', icon: Grid },
          { value: 'list', label: 'List', icon: List },
        ]}
        onChange={() => {}}
      />,
    )
    expect(screen.getByRole('radio', { name: 'Grid' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'List' })).toBeInTheDocument()
  })

  it('keeps 44 px hit areas and declares motion and forced-colours rules', () => {
    const css = cssOf('components/segmented-control/SegmentedControl.css')
    expect(css).toMatch(/\.ty-segmented-control__segment::before\s*\{[^}]*block-size:\s*max\(100%,\s*var\(--ty-control-target\)\)/)
    expect(mediaBlock(css, /\(prefers-reduced-motion:\s*reduce\)/)).toMatch(/transition:\s*none/)
    expect(mediaBlock(css, /\(forced-colors:\s*active\)/)).toMatch(/Highlight/)
  })

  it('has no axe violations', async () => {
    const { container } = render(<SegmentedControl label="Period" options={periods} onChange={() => {}} />)
    await expectNoAxeViolations(container)
  })
})

describe('SegmentedControl in right-to-left (ar)', () => {
  it('renders mirrored where directional and passes axe', async () => {
    function Host() {
      const [value, setValue] = useRtlState('يوم')
      return <SegmentedControl label="الفترة" options={['يوم', 'أسبوع', 'شهر']} value={value} onChange={setValue} />
    }
    const { container } = renderRtl(<Host />)
    await rtlUser.click(rtlDom.screen.getByRole('radio', { name: 'يوم' }))
    // In right-to-left, Left Arrow moves forward (to the option on the left).
    await rtlUser.keyboard('{ArrowLeft}')
    expect(rtlDom.screen.getByRole('radio', { name: 'أسبوع' })).toBeChecked()
    await axeRtl(container)
  })
})
