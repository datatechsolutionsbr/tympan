import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { TympanProvider } from '@datatechsolutions/tympan'
import { expectNoAxeViolations } from '../../test/axe'
import { OutputSchemaBuilder, type OutputSchema } from './OutputSchemaBuilder'

function Harness({ initial, onChange }: { initial?: OutputSchema | Record<string, unknown>; onChange: (s: OutputSchema | undefined) => void }) {
  const [value, setValue] = useState<OutputSchema | Record<string, unknown> | undefined>(initial)
  return (
    <OutputSchemaBuilder
      value={value}
      onChange={(s) => {
        setValue(s)
        onChange(s)
      }}
    />
  )
}

const last = (fn: ReturnType<typeof vi.fn>) => fn.mock.calls[fn.mock.calls.length - 1]![0]

describe('OutputSchemaBuilder', () => {
  it('adds an empty object schema', async () => {
    const onChange = vi.fn()
    const { container } = render(<Harness onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: 'Add output schema' }))
    expect(last(onChange)).toEqual({ type: 'object', properties: {} })
    await expectNoAxeViolations(container)
  })

  it('emits a required number field', async () => {
    const onChange = vi.fn()
    render(<Harness initial={{ type: 'object', properties: {} }} onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: 'Add field' }))
    await userEvent.type(screen.getByRole('textbox', { name: 'Field name' }), 'price')
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Type' }), 'number')
    await userEvent.click(screen.getByRole('checkbox', { name: 'Required' }))
    expect(last(onChange)).toMatchObject({ properties: { price: { type: 'number' } }, required: ['price'] })
  })

  it('leaves blank-named rows out of the schema', async () => {
    const onChange = vi.fn()
    render(<Harness initial={{ type: 'object', properties: { a: { type: 'string' } } }} onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: 'Add field' }))
    await userEvent.click(screen.getAllByRole('checkbox', { name: 'Required' })[1]!)
    expect(Object.keys(last(onChange).properties)).toEqual(['a'])
  })

  it('turns a field into a list of objects', async () => {
    const onChange = vi.fn()
    render(<Harness initial={{ type: 'object', properties: { items: { type: 'string' } } }} onChange={onChange} />)
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Type' }), 'array')
    expect(last(onChange).properties.items).toMatchObject({ type: 'array', items: { type: 'object' } })
  })

  it('replaces a builder below the depth limit with the depth notice', async () => {
    const onChange = vi.fn()
    render(<Harness initial={{ type: 'object', properties: { outer: { type: 'object', properties: { inner: { type: 'string' } } } } }} onChange={onChange} />)
    const nested = screen.getByRole('region', { name: /outer/ })
    await userEvent.selectOptions(within(nested).getByRole('combobox', { name: 'Type' }), 'object')
    expect(within(nested).getByText(/raw schema/i)).toBeInTheDocument()
  })

  it('removes the schema', async () => {
    const onChange = vi.fn()
    render(<Harness initial={{ type: 'object', properties: {} }} onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: 'Remove schema' }))
    expect(last(onChange)).toBeUndefined()
  })

  it('shows the unsupported state for a non-object top level, also in RTL', () => {
    render(
      <TympanProvider locale="ar">
        <div dir="rtl">
          <OutputSchemaBuilder value={{ type: 'array' }} onChange={() => {}} />
        </div>
      </TympanProvider>,
    )
    expect(screen.getByRole('button', { name: 'Reset to object' })).toBeInTheDocument()
  })
})
