import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { setMedia } from '../../../test/media'
import { Field } from '../field/Field'
import { NativeSelect } from './NativeSelect'

import * as rtlDom from '@testing-library/react'
import { expectNoAxeViolations as axeRtl } from '../../../test/axe'
import { renderRtl } from '../../../test/rtl'

describe('NativeSelect', () => {
  it('turns string options into options whose value equals the label', () => {
    render(<NativeSelect label="Stage" options={['One', 'Two']} />)
    const option = screen.getByRole('option', { name: 'Two' }) as HTMLOptionElement
    expect(option.value).toBe('Two')
  })

  it('cannot choose a disabled option', () => {
    render(<NativeSelect label="Stage" options={[{ value: 'a', label: 'A', disabled: true }, 'B']} />)
    expect(screen.getByRole('option', { name: 'A' })).toBeDisabled()
  })

  it('renders an empty, disabled placeholder first when no value is chosen', () => {
    render(<NativeSelect label="Country" options={['Brazil']} placeholder="Pick a country" />)
    const select = screen.getByRole('combobox', { name: 'Country' }) as HTMLSelectElement
    const first = select.options[0]!
    expect(first.value).toBe('')
    expect(first).toBeDisabled()
    expect(first.textContent).toBe('Pick a country')
    expect(select.value).toBe('')
  })

  it('associates the label without a caller id, and honours a Field id', () => {
    render(
      <>
        <NativeSelect label="Alone" options={['x']} />
        <Field label="In field" hint="Help">
          <NativeSelect options={['y']} />
        </Field>
      </>,
    )
    expect(screen.getByLabelText('Alone').tagName).toBe('SELECT')
    const inField = screen.getByLabelText('In field')
    expect(inField.tagName).toBe('SELECT')
    expect(inField).toHaveAccessibleDescription('Help')
  })

  it('shows a new controlled value from the parent', () => {
    const { rerender } = render(<NativeSelect label="Stage" options={['1', '2']} value="1" onChange={() => {}} />)
    expect(screen.getByRole('combobox')).toHaveValue('1')
    rerender(<NativeSelect label="Stage" options={['1', '2']} value="2" onChange={() => {}} />)
    expect(screen.getByRole('combobox')).toHaveValue('2')
  })

  it('calls onChange with the chosen value and supports groups', async () => {
    const onChange = vi.fn()
    render(<NativeSelect label="Type" groups={[{ label: 'Public', options: ['Portal', 'Bot'] }]} onChange={onChange} />)
    expect(screen.getByRole('group', { name: 'Public' })).toBeInTheDocument()
    await userEvent.selectOptions(screen.getByRole('combobox'), 'Bot')
    expect(onChange).toHaveBeenCalledWith('Bot')
  })

  it('opens a wheel drawer on a narrow touch screen; choosing calls onChange and Done returns focus', async () => {
    setMedia({ width: 375, coarsePointer: true })
    const onChange = vi.fn()
    const { container } = render(
      <form>
        <NativeSelect label="Stage" name="stage" options={['One', 'Two', 'Three']} defaultValue="One" touchPresentation="wheel" onChange={onChange} />
      </form>,
    )
    const trigger = screen.getByRole('button', { name: 'Stage: One' })
    await userEvent.click(trigger)
    const dialog = screen.getByRole('dialog', { name: 'Stage' })
    await userEvent.click(within(dialog).getByRole('option', { name: 'Two' }))
    expect(onChange).toHaveBeenCalledWith('Two')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Done' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Stage: Two' })).toHaveFocus())
    const form = container.querySelector('form')!
    expect(new FormData(form).get('stage')).toBe('Two')
  })

  it('closes the wheel drawer on Escape', async () => {
    setMedia({ width: 375, coarsePointer: true })
    render(<NativeSelect label="Stage" options={['One']} touchPresentation="wheel" />)
    await userEvent.click(screen.getByRole('button', { name: /Stage/ }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('opens nothing when disabled (native and wheel)', async () => {
    render(<NativeSelect label="Native" options={['a']} disabled />)
    expect(screen.getByRole('combobox', { name: 'Native' })).toBeDisabled()
    setMedia({ width: 375, coarsePointer: true })
    render(<NativeSelect label="Wheel" options={['a']} touchPresentation="wheel" disabled />)
    const trigger = screen.getByRole('button', { name: /Wheel/ })
    await userEvent.click(trigger)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('stays native on wide screens even with wheel presentation', () => {
    render(<NativeSelect label="Stage" options={['a']} touchPresentation="wheel" />)
    expect(screen.getByRole('combobox', { name: 'Stage' })).toBeInTheDocument()
  })

  it('announces an error only when it appears after load', () => {
    const { rerender } = render(<NativeSelect label="Stage" options={['a']} errorMessage="Required" />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByRole('combobox')).toHaveAccessibleDescription('Required')
    rerender(<NativeSelect label="Stage" options={['a']} />)
    rerender(<NativeSelect label="Stage" options={['a']} errorMessage="Choose one" />)
    expect(screen.getByRole('alert')).toHaveTextContent('Choose one')
  })

  it('stops the chevron under reduced motion and uses system field colours', () => {
    const css = cssOf('components/native-select/NativeSelect.css')
    expect(mediaBlock(css, /\(prefers-reduced-motion:\s*reduce\)/)).toMatch(/\.fk-native-select__chevron\s*\{[^}]*transition:\s*none/)
    expect(mediaBlock(css, /\(forced-colors:\s*active\)/)).toMatch(/Field/)
  })

  it('has no axe violations', async () => {
    const { container } = render(
      <>
        <NativeSelect label="Stage" hint="Pick one" options={['a', 'b']} />
        <NativeSelect label="Error" options={['a']} errorMessage="Required" />
      </>,
    )
    await expectNoAxeViolations(container)
  })
})

describe('NativeSelect in right-to-left (ar)', () => {
  it('renders mirrored where directional and passes axe', async () => {
    const { container } = renderRtl(<NativeSelect label="المرحلة" options={['1', '2', '3']} defaultValue="2" />)
    expect(rtlDom.screen.getByRole('combobox', { name: 'المرحلة' })).toHaveValue('2')
    await axeRtl(container)
  })
})

describe('NativeSelect control size', () => {
  const css = cssOf('components/native-select/NativeSelect.css').replace(/\/\*[\s\S]*?\*\//g, '')
  const at = css.indexOf('.fk-native-select__control {')
  const control = css.slice(at, css.indexOf('}', at))

  it('is 40px on desktop and 44px below 1024px', () => {
    expect(control).toMatch(/--fk-select-block:\s*var\(--fk-control-height\);/)
    expect(control).toMatch(/(^|\s)block-size:\s*var\(--fk-select-block\);/)
    expect(mediaBlock(css, /\(max-width:\s*1023\.98px\)/)).toMatch(/--fk-select-block:\s*var\(--fk-control-height-touch\)/)
  })

  it('centres the value: the line box fills the inner height, after the font shorthand', () => {
    expect(control).toMatch(/padding-block:\s*0;/)
    const line = control.search(/line-height:\s*calc\(var\(--fk-select-block\) - 2px\);/)
    expect(line).toBeGreaterThan(control.indexOf('font: inherit;'))
  })
})
