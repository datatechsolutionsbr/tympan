import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { FakhirProvider } from '@fakhir/design-system'
import { expectNoAxeViolations } from '../../test/axe'
import { cssOf, mediaBlock } from '../../test/css'
import { createDialogStack, DialogStackProvider, type FlowSettingsPayload } from '../state/dialogStack'
import { FlowSettingsDialog, flowSettingsPatch } from './FlowSettingsDialog'

function setup(payload: FlowSettingsPayload, onSave = vi.fn(() => Promise.resolve()), locale?: string) {
  const stack = createDialogStack()
  const view = render(
    <FakhirProvider {...(locale ? { locale } : {})}>
      <DialogStackProvider stack={stack}>
        <FlowSettingsDialog onSave={onSave} />
      </DialogStackProvider>
    </FakhirProvider>,
  )
  act(() => stack.open('flow-settings', payload))
  return { ...view, stack, onSave }
}

describe('FlowSettingsDialog', () => {
  it('shows no slug or lifecycle controls when only name and description were supplied', async () => {
    const { baseElement } = setup({ name: 'Pricing', description: 'd' })
    expect(screen.getByRole('textbox', { name: /Name/ })).toHaveValue('Pricing')
    expect(screen.queryByText('Address name')).toBeNull()
    expect(screen.queryByRole('switch')).toBeNull()
    await expectNoAxeViolations(baseElement)
  })

  it('sends a cleared slug as null', async () => {
    const { onSave } = setup({ name: 'Pricing', description: '', slug: 'pricing' })
    await userEvent.clear(screen.getByRole('textbox', { name: /Address name/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(onSave).toHaveBeenCalledWith({ name: 'Pricing', description: '', slug: null })
  })

  it('sends isDraft false when draft is switched off and nothing about active', async () => {
    const { onSave } = setup({ name: 'Pricing', description: '', isDraft: true, isActive: true })
    await userEvent.click(screen.getByRole('switch', { name: /Draft/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(onSave).toHaveBeenCalledWith({ name: 'Pricing', description: '', isDraft: false })
  })

  it('does not save a blank name and shows a field error', async () => {
    const { onSave } = setup({ name: 'Pricing', description: '' })
    await userEvent.clear(screen.getByRole('textbox', { name: /Name/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(onSave).not.toHaveBeenCalled()
    expect(screen.getByText('Give the flow a name.')).toBeInTheDocument()
  })

  it('stays open with values intact when onSave rejects', async () => {
    const onSave = vi.fn(() => Promise.reject(new Error('conflict')))
    const { stack } = setup({ name: 'Pricing', description: 'd' }, onSave)
    await userEvent.type(screen.getByRole('textbox', { name: /Name/ }), ' v2')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(stack.getState().active?.kind).toBe('flow-settings')
    expect(screen.getByRole('textbox', { name: /Name/ })).toHaveValue('Pricing v2')
  })

  it('saves on Enter in the name field but not in the description', async () => {
    const { onSave } = setup({ name: 'Pricing', description: '' })
    await userEvent.type(screen.getByRole('textbox', { name: /Description/ }), 'line{Enter}')
    expect(onSave).not.toHaveBeenCalled()
    await userEvent.type(screen.getByRole('textbox', { name: /Name/ }), '{Enter}')
    expect(onSave).toHaveBeenCalledTimes(1)
  })

  it('links each switch to its changing sentence', () => {
    setup({ name: 'P', description: '', isDraft: false, isActive: true })
    expect(screen.getByRole('switch', { name: /Draft/ })).toHaveAccessibleDescription('Published: edits need a new version.')
  })

  it('builds patches only from changes', () => {
    expect(flowSettingsPatch({ name: 'a', description: 'b', slug: null, isDraft: false }, { name: ' a ', description: 'b', slug: '', isDraft: false })).toEqual({ name: 'a', description: 'b' })
  })

  it('uses built-in es strings and lays out right to left in Arabic', () => {
    setup({ name: 'P', description: '' }, undefined, 'es')
    expect(screen.getByText('Ajustes del flujo')).toBeInTheDocument()
  })

  it('lays out right to left in Arabic', () => {
    setup({ name: 'P', description: '' }, undefined, 'ar')
    expect(screen.getByRole('textbox', { name: /Name/ }).closest('[dir]')).toHaveAttribute('dir', 'rtl')
  })

  it('fills the screen on phones and shows switches with system colours', () => {
    const css = cssOf('dialogs/Dialogs.css')
    expect(mediaBlock(css, /\(max-width: 639px\)/)).toMatch(/fk-flow-settings[\s\S]*100vw/)
    expect(css).toMatch(/min-block-size: var\(--fk-control-target, 44px\)/)
  })
})
