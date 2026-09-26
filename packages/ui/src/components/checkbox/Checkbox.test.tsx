import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { Checkbox, CheckboxGroup } from './Checkbox'

import * as rtlDom from '@testing-library/react'
import rtlUser from '@testing-library/user-event'
import { expectNoAxeViolations as axeRtl } from '../../../test/axe'
import { renderRtl } from '../../../test/rtl'

describe('Checkbox', () => {
  it('toggles when the row text is clicked and reports the next value', async () => {
    const onChange = vi.fn()
    render(<Checkbox label="I agree" description="Terms of use" onChange={onChange} />)
    await userEvent.click(screen.getByText('I agree'))
    expect(onChange).toHaveBeenCalledWith(true)
    expect(screen.getByRole('checkbox', { name: 'I agree' })).toBeChecked()
    expect(screen.getByRole('checkbox')).toHaveAccessibleDescription('Terms of use')
  })

  it('toggles with Space when focused', async () => {
    render(<Checkbox label="Notify" />)
    await userEvent.tab()
    await userEvent.keyboard(' ')
    expect(screen.getByRole('checkbox', { name: 'Notify' })).toBeChecked()
  })

  it('uses accessibleLabel as the name when there is no label', () => {
    render(<Checkbox accessibleLabel="Select TAMM" />)
    expect(screen.getByRole('checkbox', { name: 'Select TAMM' })).toBeInTheDocument()
  })

  it('exposes the mixed state', () => {
    render(<Checkbox label="All rows" isIndeterminate />)
    const box = screen.getByRole('checkbox', { name: 'All rows' }) as HTMLInputElement
    expect(box.indeterminate).toBe(true)
    expect(box).toBePartiallyChecked()
  })

  it('does nothing when disabled', async () => {
    const onChange = vi.fn()
    render(<Checkbox label="Locked" disabled onChange={onChange} />)
    await userEvent.click(screen.getByText('Locked'))
    expect(onChange).not.toHaveBeenCalled()
    expect(screen.getByRole('checkbox')).not.toBeChecked()
  })

  it('adds a value to a group', async () => {
    const onChange = vi.fn()
    render(
      <CheckboxGroup label="Fruits" defaultValue={['a']} onChange={onChange}>
        <Checkbox value="a" label="Apple" />
        <Checkbox value="b" label="Banana" />
      </CheckboxGroup>,
    )
    expect(screen.getByRole('group', { name: 'Fruits' })).toBeInTheDocument()
    await userEvent.click(screen.getByText('Banana'))
    expect(onChange).toHaveBeenCalledWith(['a', 'b'])
  })

  it('marks invalid and describes the error', () => {
    render(<Checkbox label="Consent" errorMessage="Consent is required" />)
    const box = screen.getByRole('checkbox', { name: 'Consent' })
    expect(box).toHaveAttribute('aria-invalid', 'true')
    expect(box).toHaveAccessibleDescription('Consent is required')
  })

  it('keeps a 44 px row and declares motion and forced-colours rules', () => {
    const css = cssOf('components/checkbox/Checkbox.css')
    expect(css).toMatch(/\.ty-checkbox__row\s*\{[^}]*min-block-size:\s*var\(--ty-control-target\)/)
    expect(mediaBlock(css, /\(prefers-reduced-motion:\s*reduce\)/)).toMatch(/transition:\s*none/)
    expect(mediaBlock(css, /\(forced-colors:\s*active\)/)).toMatch(/CanvasText/)
  })

  it('has no axe violations when checked, unchecked and invalid', async () => {
    const { container } = render(
      <>
        <Checkbox label="Unchecked" />
        <Checkbox label="Checked" defaultSelected />
        <Checkbox label="Invalid" errorMessage="Required" appearance="bare" />
      </>,
    )
    await expectNoAxeViolations(container)
  })
})

describe('Checkbox in right-to-left (ar)', () => {
  it('renders mirrored where directional and passes axe', async () => {
    const { container } = renderRtl(<Checkbox label="أؤكد أنني فتحت المصدر" />)
    const box = rtlDom.screen.getByRole('checkbox', { name: 'أؤكد أنني فتحت المصدر' })
    await rtlUser.click(box)
    expect(box).toBeChecked()
    await axeRtl(container)
  })
})
