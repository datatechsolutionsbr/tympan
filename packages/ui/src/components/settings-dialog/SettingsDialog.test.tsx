import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { PreferenceGroup, SettingsDialog, type SettingsDialogProps, type SettingsPage } from './SettingsDialog'
import * as rtlDom from '@testing-library/react'
import { expectNoAxeViolations as axeRtl } from '../../../test/axe'
import { renderRtl } from '../../../test/rtl'

const profilePage = (extra: SettingsPage['items'] = []): SettingsPage => ({
  heading: 'Your profile',
  items: [{ type: 'portrait', id: 'face', initials: 'AN' }, { type: 'entry', id: 'name', caption: 'Name', text: 'Ana' }, ...extra],
})

const base: SettingsDialogProps = {
  open: true,
  onClose: () => {},
  title: 'Settings',
  outline: [
    { id: 'profile', label: 'Profile' },
    { id: 'preferences', label: 'Preferences' },
  ],
  content: {
    profile: profilePage(),
    preferences: {
      heading: 'Preferences',
      items: [
        { type: 'toggle', id: 'haptics', caption: 'Haptics', on: true, onFlip: () => {} },
        {
          type: 'pick',
          id: 'density',
          caption: 'Density',
          look: 'cards',
          chosen: 'default',
          onPick: () => {},
          answers: [
            { id: 'compact', caption: 'Compact' },
            { id: 'default', caption: 'Default' },
          ],
        },
      ],
    },
  },
}

describe('SettingsDialog', () => {
  it('lists the sections and shows Profile first', () => {
    render(<SettingsDialog {...base} />)
    expect(screen.getByRole('button', { name: 'Profile' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('button', { name: 'Preferences' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Your profile' })).toBeInTheDocument()
  })

  it('copies a read-only value and announces it', async () => {
    const user = userEvent.setup()
    render(
      <SettingsDialog
        {...base}
        outline={[{ id: 'workspace', label: 'Workspace' }]}
        content={{ workspace: { heading: 'Workspace', items: [{ type: 'entry', id: 'id', caption: 'Workspace id', text: 'ws-9f2c', locked: true, copy: true }] } }}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Copy Workspace id' }))
    expect(await navigator.clipboard.readText()).toBe('ws-9f2c')
    await waitFor(() => expect(screen.getByText('Copied')).toBeInTheDocument())
  })

  it('reports each typed value', async () => {
    const onChange = vi.fn()
    render(<SettingsDialog {...base} content={{ profile: { heading: 'Your profile', items: [{ type: 'entry', id: 'bio', caption: 'Bio', text: '', onText: onChange }] } }} />)
    await userEvent.type(screen.getByRole('textbox', { name: 'Bio' }), 'ab')
    expect(onChange).toHaveBeenCalledWith('a')
    expect(onChange).toHaveBeenCalledTimes(2)
  })

  it('reports a password mismatch on the confirm field and calls onSubmit once when they match', async () => {
    const onSubmit = vi.fn()
    render(<SettingsDialog {...base} content={{ profile: profilePage([{ type: 'passphrase', id: 'pass', onSave: onSubmit }]) }} />)
    await userEvent.type(screen.getByLabelText('Current password'), 'a')
    await userEvent.type(screen.getByLabelText('New password'), 'b1')
    await userEvent.type(screen.getByLabelText('Confirm the new password'), 'b2')
    await userEvent.click(screen.getByRole('button', { name: 'Change password' }))
    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByText('The two new passwords are different.')).toBeInTheDocument()
    await userEvent.clear(screen.getByLabelText('Confirm the new password'))
    await userEvent.type(screen.getByLabelText('Confirm the new password'), 'b1')
    await userEvent.click(screen.getByRole('button', { name: 'Change password' }))
    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit).toHaveBeenCalledWith('a', 'b1', 'b1')
  })

  it('shows the placeholder for an unconfigured section', () => {
    render(<SettingsDialog {...base} outline={[{ id: 'billing', label: 'Billing' }]} />)
    expect(screen.getByText('Nothing to configure in this section yet.')).toBeInTheDocument()
  })

  it('shows the access-denied view when the initial section is not available', () => {
    render(<SettingsDialog {...base} startAt="keys" locked={{ heading: 'No access', reason: 'Ask an owner.' }} />)
    expect(screen.getByRole('heading', { name: 'No access' })).toBeInTheDocument()
  })

  it('fires sign out', async () => {
    const onPress = vi.fn()
    render(<SettingsDialog {...base} exit={{ label: 'Sign out', onPress }} />)
    await userEvent.click(screen.getByRole('button', { name: 'Sign out' }))
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('draws a language select and a list-look pick from the same item model', async () => {
    const onPick = vi.fn()
    render(
      <SettingsDialog
        {...base}
        startAt="preferences"
        content={{
          preferences: {
            heading: 'Preferences',
            lead: 'Applies to this device.',
            items: [
              { type: 'language', id: 'lang', caption: 'Language', chosen: 'pt-BR', answers: [{ id: 'pt-BR', caption: 'Português' }, { id: 'en', caption: 'English' }], onPick },
              { type: 'pick', id: 'start', caption: 'Start page', chosen: 'a', answers: [{ id: 'a', caption: 'Overview' }, { id: 'b', caption: 'Base' }], onPick },
            ],
          },
        }}
      />,
    )
    expect(screen.getByText('Applies to this device.')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('radio', { name: 'Base' }))
    expect(onPick).toHaveBeenCalledWith('b')
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Language' }), 'en')
    expect(onPick).toHaveBeenCalledWith('en')
  })

  it('renders PreferenceGroup with its title', () => {
    render(
      <PreferenceGroup title="Appearance">
        <p>Body</p>
      </PreferenceGroup>,
    )
    expect(screen.getByRole('group', { name: 'Appearance' })).toHaveTextContent('Body')
  })

  it('has no axe violations on preferences', async () => {
    render(<SettingsDialog {...base} startAt="preferences" />)
    await expectNoAxeViolations(document.body)
  })
})

describe('SettingsDialog in right-to-left (ar)', () => {
  it('renders mirrored where directional and passes axe', async () => {
    renderRtl(<SettingsDialog open onClose={() => {}} title="الإعدادات" outline={[{ id: 'preferences', label: 'التفضيلات' }]} />)
    expect(await rtlDom.screen.findByRole('dialog', { name: /الإعدادات/ })).toBeInTheDocument()
    await axeRtl(document.body)
  })
})
