import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../test/axe'
import { cssOf, mediaBlock } from '../../test/css'
import { VariableListEditor, type VariableListEditorProps } from './VariableListEditor'

function Controlled(props: Partial<VariableListEditorProps> & { initial?: string[]; spy?: (n: string[]) => void }) {
  const [value, setValue] = useState(props.initial ?? [])
  return (
    <VariableListEditor
      label="Input variables"
      {...props}
      value={value}
      onChange={(n) => {
        props.spy?.(n)
        setValue(n)
      }}
    />
  )
}

describe('VariableListEditor', () => {
  it('adds a typed name on Enter, clears the field and keeps focus there', async () => {
    const spy = vi.fn()
    const { container } = render(<Controlled spy={spy} />)
    const field = screen.getByRole('textbox', { name: 'New name' })
    await userEvent.type(field, 'region{Enter}')
    expect(spy).toHaveBeenCalledWith(['region'])
    expect(field).toHaveValue('')
    expect(field).toHaveFocus()
    expect(screen.getByRole('status')).toHaveTextContent('region added')
    await expectNoAxeViolations(container)
  })

  it('refuses a duplicate with an error', async () => {
    const spy = vi.fn()
    render(<Controlled initial={['a']} spy={spy} />)
    await userEvent.type(screen.getByRole('textbox', { name: 'New name' }), 'a{Enter}')
    expect(spy).not.toHaveBeenCalled()
    expect(screen.getByText('Already in the list')).toBeInTheDocument()
  })

  it('hides the add row when full', () => {
    render(<VariableListEditor value={['a', 'b']} onChange={() => {}} max={2} />)
    expect(screen.queryByRole('textbox', { name: 'New name' })).toBeNull()
  })

  it('edits a name inline when editable', async () => {
    const spy = vi.fn()
    render(<Controlled initial={['a']} editable spy={spy} />)
    const row = screen.getByRole('textbox', { name: 'Name 1' })
    await userEvent.clear(row)
    await userEvent.type(row, 'b')
    expect(spy).toHaveBeenLastCalledWith(['b'])
  })

  it('removes a name and moves focus to the next remove button', async () => {
    const spy = vi.fn()
    render(<Controlled initial={['a', 'b']} spy={spy} />)
    await userEvent.click(screen.getByRole('button', { name: 'Remove a' }))
    expect(spy).toHaveBeenCalledWith(['b'])
    await waitFor(() => expect(screen.getByRole('button', { name: 'Remove b' })).toHaveFocus())
  })

  it('numbers rows in order when numbered', () => {
    render(<VariableListEditor value={['x', 'y', 'z']} onChange={() => {}} numbered />)
    expect(screen.getAllByRole('listitem').map((li) => li.textContent?.slice(0, 1))).toEqual(['1', '2', '3'])
  })

  it('disables add while the field is empty and gives 44 px rows', () => {
    render(<VariableListEditor value={[]} onChange={() => {}} />)
    expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled()
    const css = cssOf('forms/VariableListEditor.css')
    expect(css).toMatch(/min-block-size:\s*44px/)
    expect(mediaBlock(css, /\(forced-colors: active\)/)).toMatch(/CanvasText/)
  })
})
