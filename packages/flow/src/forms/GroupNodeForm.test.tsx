import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../test/axe'
import { cssOf, mediaBlock } from '../../test/css'
import { GroupNodeForm } from './GroupNodeForm'

describe('GroupNodeForm', () => {
  it('trims the name on save', async () => {
    const onSave = vi.fn()
    const { container } = render(<GroupNodeForm value={{ label: '  Intake  ', tone: 'categorical-1' }} onSave={onSave} onCancel={() => {}} />)
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(onSave).toHaveBeenCalledWith({ label: 'Intake', tone: 'categorical-1' })
    await expectNoAxeViolations(container)
  })

  it('disables save for a blank name and Enter does not emit', async () => {
    const onSave = vi.fn()
    render(<GroupNodeForm value={{ label: '', tone: 'categorical-1' }} onSave={onSave} onCancel={() => {}} />)
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
    await userEvent.type(screen.getByRole('textbox', { name: /Name/ }), '   {Enter}')
    expect(onSave).not.toHaveBeenCalled()
    expect(screen.getByText('Give the group a name.')).toBeInTheDocument()
  })

  it('omits a blank description', async () => {
    const onSave = vi.fn()
    render(<GroupNodeForm value={{ label: 'A', description: 'old', tone: 'categorical-1' }} onSave={onSave} onCancel={() => {}} />)
    await userEvent.clear(screen.getByRole('textbox', { name: 'Description' }))
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(onSave.mock.calls[0]![0]).not.toHaveProperty('description')
  })

  it('moves the checked tone with Right Arrow', async () => {
    render(<GroupNodeForm value={{ label: 'A', tone: 'categorical-2' }} onSave={() => {}} onCancel={() => {}} />)
    await userEvent.click(screen.getByRole('radio', { name: 'Orange' }))
    await userEvent.keyboard('{ArrowRight}')
    expect(screen.getByRole('radio', { name: 'Green' })).toBeChecked()
  })

  it('keeps extra keys unchanged', async () => {
    const onSave = vi.fn()
    render(<GroupNodeForm value={{ label: 'A', tone: 'categorical-1', size: { width: 400, height: 300 }, expanded: false }} onSave={onSave} onCancel={() => {}} />)
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(onSave).toHaveBeenCalledWith({ label: 'A', tone: 'categorical-1', size: { width: 400, height: 300 }, expanded: false })
  })

  it('marks the checked swatch by shape (check mark and ring) that survives forced colours', () => {
    const { container } = render(<GroupNodeForm value={{ label: 'A', tone: 'categorical-3' }} onSave={() => {}} onCancel={() => {}} />)
    expect(container.querySelectorAll('.ty-group-form__check')).toHaveLength(1)
    const css = cssOf('forms/GroupNodeForm.css')
    expect(mediaBlock(css, /\(forced-colors: active\)/)).toMatch(/\[data-selected\][^}]*Highlight/)
    expect(css).toMatch(/min-block-size:\s*44px/)
  })
})
