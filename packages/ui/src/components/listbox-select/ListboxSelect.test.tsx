import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { setViewportWidth } from '../../../test/media'
import { ListboxSelect } from './ListboxSelect'

import * as rtlDom from '@testing-library/react'
import { expectNoAxeViolations as axeRtl } from '../../../test/axe'
import { renderRtl } from '../../../test/rtl'

const options = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana', description: 'Yellow' },
  { value: 'blocked', label: 'Blocked', disabled: true },
  { value: 'cherry', label: 'Cherry' },
]

describe('ListboxSelect', () => {
  it('opens on ArrowDown with the selected option focused', async () => {
    render(<ListboxSelect label="Fruit" options={options} defaultValue="banana" />)
    screen.getByRole('button', { name: /Fruit/ }).focus()
    await userEvent.keyboard('{ArrowDown}')
    const listbox = screen.getByRole('listbox')
    expect(within(listbox).getByRole('option', { name: /Banana/ })).toHaveFocus()
  })

  it('moves focus by type-ahead', async () => {
    render(<ListboxSelect label="Fruit" options={options} />)
    screen.getByRole('button', { name: /Fruit/ }).focus()
    await userEvent.keyboard('{ArrowDown}')
    await userEvent.keyboard('b')
    expect(screen.getByRole('option', { name: /Banana/ })).toHaveFocus()
  })

  it('fires onChange on Enter, closes and returns focus to the trigger', async () => {
    const onChange = vi.fn()
    render(<ListboxSelect label="Fruit" options={options} onChange={onChange} />)
    const trigger = screen.getByRole('button', { name: /Fruit/ })
    trigger.focus()
    await userEvent.keyboard('{ArrowDown}')
    await userEvent.keyboard('{ArrowDown}')
    await userEvent.keyboard('{Enter}')
    expect(onChange).toHaveBeenCalledWith('banana')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    await waitFor(() => expect(trigger).toHaveFocus())
    expect(trigger).toHaveTextContent('Banana')
  })

  it('closes on Escape without changing the value', async () => {
    const onChange = vi.fn()
    render(<ListboxSelect label="Fruit" options={options} defaultValue="apple" onChange={onChange} />)
    const trigger = screen.getByRole('button', { name: /Fruit/ })
    trigger.focus()
    await userEvent.keyboard('{ArrowDown}')
    await userEvent.keyboard('{ArrowDown}')
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(onChange).not.toHaveBeenCalled()
    expect(trigger).toHaveTextContent('Apple')
  })

  it('skips disabled options when arrowing', async () => {
    render(<ListboxSelect label="Fruit" options={options} defaultValue="banana" />)
    screen.getByRole('button', { name: /Fruit/ }).focus()
    await userEvent.keyboard('{ArrowDown}')
    await userEvent.keyboard('{ArrowDown}')
    expect(screen.getByRole('option', { name: /Cherry/ })).toHaveFocus()
    expect(screen.getByRole('option', { name: /Blocked/ })).toHaveAttribute('aria-disabled', 'true')
  })

  it('includes the value in form submission when named', async () => {
    const { container } = render(
      <form>
        <ListboxSelect label="Fruit" name="fruit" options={options} defaultValue="cherry" />
      </form>,
    )
    expect(new FormData(container.querySelector('form')!).get('fruit')).toBe('cherry')
  })

  it('opens nothing when disabled', async () => {
    render(<ListboxSelect label="Fruit" options={options} disabled />)
    await userEvent.click(screen.getByRole('button', { name: /Fruit/ }))
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('marks the selected option with aria-selected and renders sections', async () => {
    render(<ListboxSelect label="Fruit" sections={[{ title: 'Red', options: [{ value: 'cherry', label: 'Cherry' }] }]} defaultValue="cherry" />)
    await userEvent.click(screen.getByRole('button', { name: /Fruit/ }))
    expect(screen.getByRole('option', { name: /Cherry/ })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('group', { name: 'Red' })).toBeInTheDocument()
  })

  it('uses a bottom tray with the same listbox on narrow screens', async () => {
    setViewportWidth(375)
    const onChange = vi.fn()
    const { container } = render(<ListboxSelect label="Fruit" options={options} onChange={onChange} />)
    expect(container.querySelector('.fk-listbox-select')).toHaveAttribute('data-presentation', 'tray')
    await userEvent.click(screen.getByRole('button', { name: /Fruit/ }))
    const listbox = screen.getByRole('listbox')
    expect(listbox.closest('.fk-listbox-select__tray')).not.toBeNull()
    await userEvent.click(within(listbox).getByRole('option', { name: /Cherry/ }))
    expect(onChange).toHaveBeenCalledWith('cherry')
  })

  it('declares motion, transparency and forced-colours rules and 44 px options', () => {
    const css = cssOf('components/listbox-select/ListboxSelect.css')
    expect(mediaBlock(css, /\(prefers-reduced-motion:\s*reduce\)/)).toMatch(/animation:\s*none/)
    expect(mediaBlock(css, /\(prefers-reduced-transparency:\s*reduce\)/)).toMatch(/surface-raised-solid/)
    expect(mediaBlock(css, /\(forced-colors:\s*active\)/)).toMatch(/Highlight/)
    expect(css).toMatch(/\.fk-listbox-select__option\s*\{[^}]*min-block-size:\s*var\(--fk-control-target\)/)
  })

  it('has no axe violations when closed and open', async () => {
    const { container } = render(<ListboxSelect label="Fruit" hint="Pick one" options={options} />)
    await expectNoAxeViolations(container)
    await userEvent.click(screen.getByRole('button', { name: /Fruit/ }))
    await expectNoAxeViolations(document.body)
  })
})

describe('ListboxSelect in right-to-left (ar)', () => {
  it('renders mirrored where directional and passes axe', async () => {
    const { container } = renderRtl(<ListboxSelect label="القدرة" options={[{ value: 'inform', label: 'يُعلم' }, { value: 'act', label: 'يُنفذ' }]} />)
    expect(rtlDom.screen.getByRole('button', { name: /القدرة/ })).toBeInTheDocument()
    await axeRtl(container)
  })
})
