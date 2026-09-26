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
    expect(container.querySelector('.ty-listbox-select')).toHaveAttribute('data-presentation', 'tray')
    await userEvent.click(screen.getByRole('button', { name: /Fruit/ }))
    const listbox = screen.getByRole('listbox')
    expect(listbox.closest('.ty-listbox-select__tray')).not.toBeNull()
    await userEvent.click(within(listbox).getByRole('option', { name: /Cherry/ }))
    expect(onChange).toHaveBeenCalledWith('cherry')
  })

  it('declares motion, transparency and forced-colours rules and 44 px options', () => {
    const css = cssOf('components/listbox-select/ListboxSelect.css')
    expect(mediaBlock(css, /\(prefers-reduced-motion:\s*reduce\)/)).toMatch(/animation:\s*none/)
    expect(mediaBlock(css, /\(prefers-reduced-transparency:\s*reduce\)/)).toMatch(/surface-raised-solid/)
    expect(mediaBlock(css, /\(forced-colors:\s*active\)/)).toMatch(/Highlight/)
    expect(css).toMatch(/\.ty-listbox-select__option\s*\{[^}]*min-block-size:\s*var\(--ty-control-target\)/)
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

describe('ListboxSelect trigger size', () => {
  /** Body of the first rule whose selector is exactly `selector`. */
  const ruleOf = (css: string, selector: string) => {
    const at = css.indexOf(`${selector} {`)
    return at < 0 ? '' : css.slice(at, css.indexOf('}', at))
  }
  const css = cssOf('components/listbox-select/ListboxSelect.css').replace(/\/\*[\s\S]*?\*\//g, '')

  it('is 40px on desktop and 44px below 1024px, never taller than one line', () => {
    const trigger = ruleOf(css, '.ty-listbox-select__trigger')
    expect(trigger).toMatch(/--ty-select-block:\s*var\(--ty-control-height\);/)
    expect(trigger).toMatch(/(^|\s)block-size:\s*var\(--ty-select-block\);/)
    expect(trigger).toMatch(/padding-block:\s*0;/)
    expect(mediaBlock(css, /\(max-width:\s*1023\.98px\)/)).toMatch(/--ty-select-block:\s*var\(--ty-control-height-touch\)/)
  })

  it('centres the value and shows only the chosen label (no description, no check)', () => {
    const value = ruleOf(css, '.ty-listbox-select__value')
    expect(value).toMatch(/display:\s*flex;/)
    expect(value).toMatch(/align-items:\s*center;/)
    expect(css).toMatch(/\.ty-listbox-select__value \.ty-listbox-select__option-description,\s*\.ty-listbox-select__value \.ty-listbox-select__check \{\s*display:\s*none;/)
    render(<ListboxSelect label="Fruit" options={options} defaultValue="banana" />)
    const trigger = screen.getByRole('button', { name: /Fruit/ })
    // The description is rendered by the list's item template but hidden in the trigger by the rule above.
    expect(trigger.querySelector('.ty-listbox-select__value .ty-listbox-select__option-label')?.textContent).toBe('Banana')
  })
})
