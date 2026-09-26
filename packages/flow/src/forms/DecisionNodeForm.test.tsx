import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { FakhirProvider } from '@fakhir/design-system'
import { expectNoAxeViolations } from '../../test/axe'
import { DecisionNodeForm, validateDecision } from './DecisionNodeForm'

const value = {
  kind: 'decision' as const,
  input: { ref: 'assertion.value' },
  options: [
    { value: 'confirmed_primary', label: 'Confirmed, primary' },
    { value: 'not_confirmed', label: 'Not confirmed' },
  ],
  provider: 'p1',
  model: 'm1',
  modelVersion: '2026-09-01',
  keep: 'me',
}

describe('DecisionNodeForm', () => {
  it('saves the full decision config and keeps unknown keys', async () => {
    const onSave = vi.fn()
    const { container } = render(<DecisionNodeForm value={value} providers={[{ id: 'p1', name: 'Provider one' }]} models={[{ id: 'm1', provider: 'p1' }]} onSave={onSave} onCancel={() => {}} />)
    await userEvent.type(screen.getByRole('spinbutton', { name: /Review threshold/ }), '0.7')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ kind: 'decision', input: { ref: 'assertion.value' }, provider: 'p1', model: 'm1', modelVersion: '2026-09-01', threshold: 0.7, keep: 'me', outputVariable: 'decision' }))
    expect(onSave.mock.calls[0]![0].options).toEqual(value.options)
    await expectNoAxeViolations(container)
  })

  it('needs two options, unique non-blank values and an input reference', () => {
    expect(validateDecision('x', [{ key: 'a', value: 'one' }], '').tooFew).toBe(true)
    const dup = validateDecision('x', [{ key: 'a', value: 'one' }, { key: 'b', value: 'one' }], '')
    expect(dup.duplicate).toEqual(['a', 'b'])
    expect(validateDecision('', [], '').input).toBe(true)
    expect(validateDecision('x', [], '1.5').threshold).toBe(true)
  })

  it('shows the duplicate error and disables save', async () => {
    render(<DecisionNodeForm value={value} onSave={() => {}} onCancel={() => {}} />)
    const second = screen.getByRole('group', { name: 'Option 2' })
    const field = within(second).getByRole('textbox', { name: 'Value' })
    await userEvent.clear(field)
    await userEvent.type(field, 'confirmed_primary')
    expect(screen.getAllByText('This value is already used by another option.')).toHaveLength(2)
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
  })

  it('adds and removes options and picks a reference chip', async () => {
    const onSave = vi.fn()
    render(<DecisionNodeForm value={{ ...value, input: { ref: '' } }} references={['assertion.value', 'record.stage']} onSave={onSave} onCancel={() => {}} />)
    await userEvent.click(screen.getByRole('button', { name: 'record.stage' }))
    await userEvent.click(screen.getByRole('button', { name: 'Add option' }))
    expect(screen.getByRole('group', { name: 'Option 3' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Remove option 3' }))
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(onSave.mock.calls[0]![0].input.ref).toBe('record.stage')
  })

  it('works under RTL with Portuguese strings', async () => {
    render(
      <FakhirProvider locale="pt-BR">
        <div dir="rtl">
          <DecisionNodeForm value={value} onSave={() => {}} onCancel={() => {}} />
        </div>
      </FakhirProvider>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Adicionar opção' }))
    expect(screen.getByRole('group', { name: 'Opção 3' })).toBeInTheDocument()
  })
})
