import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { ThemeScope } from '../../internal/ThemeScope'
import { TagField, type TagFieldProps } from './TagField'
import * as rtlDom from '@testing-library/react'
import { expectNoAxeViolations as axeRtl } from '../../../test/axe'
import { renderRtl } from '../../../test/rtl'

function Stateful(props: Omit<TagFieldProps, 'value' | 'onChange'> & { initial?: string[]; spy?: (v: string[]) => void }) {
  const { initial = [], spy, ...rest } = props
  const [value, setValue] = useState(initial)
  return (
    <TagField
      label="Tags"
      {...rest}
      value={value}
      onChange={(v) => {
        spy?.(v)
        setValue(v)
      }}
    />
  )
}

describe('TagField', () => {
  it('commits a typed value on Enter', async () => {
    const onChange = vi.fn()
    render(<TagField label="Tags" value={[]} onChange={onChange} />)
    await userEvent.type(screen.getByRole('textbox', { name: 'Tags' }), 'alpha{Enter}')
    expect(onChange).toHaveBeenCalledWith(['alpha'])
  })

  it('commits on comma too', async () => {
    const spy = vi.fn()
    render(<Stateful spy={spy} />)
    await userEvent.type(screen.getByRole('textbox', { name: 'Tags' }), 'one,two,')
    expect(spy).toHaveBeenLastCalledWith(['one', 'two'])
    expect(screen.getByRole('textbox', { name: 'Tags' })).toHaveValue('')
  })

  it('rejects a duplicate ignoring case after trimming', async () => {
    const onChange = vi.fn()
    render(<TagField label="Tags" value={['Alpha']} onChange={onChange} />)
    await userEvent.type(screen.getByRole('textbox', { name: 'Tags' }), ' alpha {Enter}')
    expect(onChange).not.toHaveBeenCalled()
  })

  it('rejects entries the validator refuses, and uses its normalised form', async () => {
    const onChange = vi.fn()
    render(<TagField label="Tags" value={[]} onChange={onChange} validate={(r) => (r === 'bad' ? null : r.toUpperCase())} />)
    const input = screen.getByRole('textbox', { name: 'Tags' })
    await userEvent.type(input, 'bad{Enter}')
    expect(onChange).not.toHaveBeenCalled()
    await userEvent.clear(input)
    await userEvent.type(input, 'ok{Enter}')
    expect(onChange).toHaveBeenCalledWith(['OK'])
  })

  it('disables the entry at max and enables it again after a removal', async () => {
    render(<Stateful max={2} initial={['a', 'b']} />)
    expect(screen.getByRole('textbox', { name: 'Tags' })).toBeDisabled()
    await userEvent.click(screen.getByRole('button', { name: 'Remove a' }))
    expect(screen.getByRole('textbox', { name: 'Tags' })).toBeEnabled()
  })

  it('removes the last pill with Backspace in an empty entry and returns focus to the entry after a removal', async () => {
    const spy = vi.fn()
    render(<Stateful initial={['a', 'b', 'c']} spy={spy} />)
    const input = screen.getByRole('textbox', { name: 'Tags' })
    await userEvent.click(input)
    await userEvent.keyboard('{Backspace}')
    expect(spy).toHaveBeenLastCalledWith(['a', 'b'])
    await userEvent.click(screen.getByRole('button', { name: 'Remove a' }))
    expect(spy).toHaveBeenLastCalledWith(['b'])
    expect(input).toHaveFocus()
  })

  it('rejects free text when only suggestions are allowed', async () => {
    const onChange = vi.fn()
    render(<TagField label="Tags" value={[]} onChange={onChange} suggestions={['pt', 'en']} allowFreeText={false} />)
    await userEvent.type(screen.getByRole('combobox', { name: 'Tags' }), 'zzz{Enter}')
    expect(onChange).not.toHaveBeenCalled()
  })

  it('highlights the last option on ArrowUp and commits it with Enter', async () => {
    const spy = vi.fn()
    render(<Stateful suggestions={['pt', 'en', 'es']} suggestionLabels={{ pt: 'Português', en: 'English', es: 'Español' }} spy={spy} />)
    const combo = screen.getByRole('combobox', { name: 'Tags' })
    await userEvent.click(combo)
    await userEvent.keyboard('{ArrowUp}')
    const listbox = screen.getByRole('listbox')
    const options = within(listbox).getAllByRole('option')
    expect(combo).toHaveAttribute('aria-activedescendant', options[options.length - 1]!.id)
    await userEvent.keyboard('{Enter}')
    expect(spy).toHaveBeenLastCalledWith(['es'])
    await userEvent.keyboard('{Escape}')
    expect(screen.getByRole('row', { name: 'Español' })).toBeInTheDocument()
    expect(combo).toHaveValue('')
  })

  it('closes the popup on Escape without changing the value', async () => {
    const onChange = vi.fn()
    render(<TagField label="Tags" value={[]} onChange={onChange} suggestions={['pt', 'en']} />)
    const combo = screen.getByRole('combobox', { name: 'Tags' })
    await userEvent.type(combo, 'p')
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('listbox')).toBeNull()
    expect(onChange).not.toHaveBeenCalled()
  })

  it('links the helper text as a description of the entry', () => {
    render(<TagField label="Tags" value={[]} onChange={() => {}} helperText="Press Enter to add." />)
    expect(screen.getByRole('textbox', { name: 'Tags' })).toHaveAccessibleDescription(/Press Enter to add\./)
  })

  it('marks the field invalid with the error text', () => {
    render(<TagField label="Tags" value={[]} onChange={() => {}} errorText="Add at least one." />)
    const input = screen.getByRole('textbox', { name: 'Tags' })
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAccessibleDescription(/Add at least one\./)
  })

  it('keeps 44 px remove targets and highlights options in forced colours', () => {
    const css = cssOf('components/tag-field/TagField.css')
    expect(css).toMatch(/\.ty-tag-field__drop::before\s*\{[^}]*inline-size:\s*max\(100%,\s*var\(--ty-control-target\)\)/)
    expect(mediaBlock(css, /\(forced-colors:\s*active\)/)).toMatch(/Highlight/)
    expect(mediaBlock(css, /\(prefers-reduced-motion:\s*reduce\)/)).toMatch(/animation:\s*none/)
  })

  it('has no axe violations, light and dark', async () => {
    const { container } = render(
      <>
        {(['light', 'dark'] as const).map((scheme) => (
          <ThemeScope key={scheme} scheme={scheme}>
            <TagField label={`Headers ${scheme}`} value={['x-trace', 'accept']} onChange={() => {}} helperText="Enter or comma adds." tone="accent" />
            <TagField ariaLabel={`Languages ${scheme}`} value={['pt']} onChange={() => {}} suggestions={['pt', 'en']} tone={3} />
          </ThemeScope>
        ))}
      </>,
    )
    await expectNoAxeViolations(container)
  })
})

describe('TagField in right-to-left (ar)', () => {
  it('renders mirrored where directional and passes axe', async () => {
    const { container } = renderRtl(<TagField label="الرؤوس" value={['معرف']} onChange={() => {}} />)
    expect(rtlDom.screen.getByText('معرف')).toBeInTheDocument()
    await axeRtl(container)
  })
})
