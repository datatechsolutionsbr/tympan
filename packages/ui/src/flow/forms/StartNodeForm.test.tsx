import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { renderWithProvider } from '../../../test/render'
import { StartNodeForm } from './StartNodeForm'

describe('StartNodeForm', () => {
  it('saves both variables and only the non-empty defaults', async () => {
    const onSave = vi.fn()
    const { container } = render(<StartNodeForm config={{ inputVariables: ['amount', 'term'] }} onSave={onSave} onCancel={() => {}} />)
    await userEvent.type(screen.getByRole('textbox', { name: 'amount' }), '10')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(onSave).toHaveBeenCalledWith({ kind: 'start', inputVariables: ['amount', 'term'], inputDefaults: { amount: '10' } })
    await expectNoAxeViolations(container)
  })

  it('drops the default of a removed variable', async () => {
    const onSave = vi.fn()
    render(<StartNodeForm config={{ inputVariables: ['amount', 'term'], inputDefaults: { amount: '10' } }} onSave={onSave} onCancel={() => {}} />)
    await userEvent.click(screen.getByRole('button', { name: 'Remove amount' }))
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(onSave.mock.calls[0]![0].inputDefaults).toEqual({})
  })

  it('omits a default cleared to empty', async () => {
    const onSave = vi.fn()
    render(<StartNodeForm config={{ inputVariables: ['amount'], inputDefaults: { amount: '10' } }} onSave={onSave} onCancel={() => {}} />)
    await userEvent.clear(screen.getByRole('textbox', { name: 'amount' }))
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(onSave.mock.calls[0]![0].inputDefaults).toEqual({})
  })

  it('hides the defaults group without variables', () => {
    render(<StartNodeForm config={{}} onSave={() => {}} onCancel={() => {}} />)
    expect(screen.queryByRole('group', { name: 'Default values' })).toBeNull()
  })

  it('cancels without saving', async () => {
    const onSave = vi.fn()
    const onCancel = vi.fn()
    render(<StartNodeForm config={{ inputVariables: ['a'] }} onSave={onSave} onCancel={onCancel} />)
    await userEvent.type(screen.getByRole('textbox', { name: 'a' }), 'x')
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onCancel).toHaveBeenCalled()
    expect(onSave).not.toHaveBeenCalled()
  })

  it('keeps unknown keys and drops blank variable names on save', async () => {
    const onSave = vi.fn()
    render(<StartNodeForm config={{ inputVariables: ['a', ''], extra: 1 }} onSave={onSave} onCancel={() => {}} />)
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(onSave).toHaveBeenCalledWith({ kind: 'start', extra: 1, inputVariables: ['a'], inputDefaults: {} })
  })

  it('uses the built-in Portuguese strings under a pt-BR provider', () => {
    renderWithProvider(<StartNodeForm config={{ inputVariables: ['a'] }} onSave={() => {}} onCancel={() => {}} />, { locale: 'pt-BR' })
    expect(screen.getByRole('group', { name: 'Valores padrão' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeInTheDocument()
  })

  it('lays defaults in two columns from the medium breakpoint', () => {
    expect(mediaBlock(cssOf('flow/forms/StartNodeForm.css'), /\(min-width: 768px\)/)).toMatch(/repeat\(2/)
  })
})
