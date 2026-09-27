import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { SchemaConfigForm } from './SchemaConfigForm'

describe('SchemaConfigForm', () => {
  it('renders a select with a "none" option plus each enum value', async () => {
    const { container } = render(<SchemaConfigForm value={{}} schema={{ properties: { mode: { type: 'string', enum: ['fast', 'exact'] } } }} onSave={() => {}} onCancel={() => {}} />)
    const select = screen.getByLabelText('Mode') as HTMLSelectElement
    expect([...select.options].map((o) => o.textContent)).toEqual(['None', 'fast', 'exact'])
    await expectNoAxeViolations(container)
  })

  it('drops a cleared number property from the emitted value', async () => {
    const onSave = vi.fn()
    render(<SchemaConfigForm value={{ limit: 5 }} schema={{ properties: { limit: { type: 'number' } } }} onSave={onSave} onCancel={() => {}} />)
    await userEvent.clear(screen.getByLabelText('Limit'))
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(onSave).toHaveBeenCalledWith({})
  })

  it('shows an inline error for invalid structured text and still emits the last valid value', async () => {
    const onSave = vi.fn()
    render(<SchemaConfigForm value={{ mapping: { a: 1 } }} schema={{ properties: { mapping: { type: 'object' } } }} onSave={onSave} onCancel={() => {}} />)
    const area = screen.getByLabelText('Mapping')
    await userEvent.type(area, ' trailing')
    expect(screen.getByText(/Not valid structured text/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(onSave).toHaveBeenCalledWith({ mapping: { a: 1 } })
  })

  it('keeps a kind discriminator that is not in the schema', async () => {
    const onSave = vi.fn()
    render(<SchemaConfigForm value={{ kind: 'http', url: 'a' }} schema={{ properties: { url: { type: 'string' } } }} onSave={onSave} onCancel={() => {}} />)
    await userEvent.type(screen.getByLabelText('Url'), 'b')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(onSave).toHaveBeenCalledWith({ kind: 'http', url: 'ab' })
  })

  it('shows only the empty message and the footer for an empty schema', () => {
    render(<SchemaConfigForm value={{}} schema={{}} onSave={() => {}} onCancel={() => {}} />)
    expect(screen.getByText('This step has nothing to configure.')).toBeInTheDocument()
    expect(screen.getAllByRole('button').map((b) => b.textContent)).toEqual(['Cancel', 'Save'])
  })

  it('uses a multi-line area for "systemPrompt"', () => {
    render(<SchemaConfigForm value={{}} schema={{ properties: { systemPrompt: { type: 'string' } } }} onSave={() => {}} onCancel={() => {}} />)
    expect(screen.getByLabelText('System prompt').tagName).toBe('TEXTAREA')
  })

  it('disables save with saveDisabled while cancel still works', async () => {
    const onCancel = vi.fn()
    const onSave = vi.fn()
    render(<SchemaConfigForm value={{}} schema={{}} onSave={onSave} onCancel={onCancel} saveDisabled />)
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(onSave).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onCancel).toHaveBeenCalled()
  })

  it('renders a switch for booleans and marks required fields', () => {
    render(<SchemaConfigForm value={{}} schema={{ properties: { strict: { type: 'boolean' }, name: { type: 'string' } }, required: ['name'] }} onSave={() => {}} onCancel={() => {}} />)
    expect(screen.getByRole('switch', { name: 'Strict' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /Name/ })).toBeRequired()
  })

  it('keeps structured text scrolling inside itself and a visible footer rule in forced colours', () => {
    const css = cssOf('flow/forms/SchemaConfigForm.css')
    expect(css).toMatch(/overflow-x:\s*auto/)
    expect(mediaBlock(cssOf('flow/forms/forms-shared.css'), /\(forced-colors: active\)/)).toMatch(/CanvasText/)
  })
})
