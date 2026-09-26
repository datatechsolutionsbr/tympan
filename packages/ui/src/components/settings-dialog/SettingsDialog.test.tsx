import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { PreferenceGroup, SettingsDialog, type SettingsDialogProps } from './SettingsDialog'
import * as rtlDom from '@testing-library/react'
import { expectNoAxeViolations as axeRtl } from '../../../test/axe'
import { renderRtl } from '../../../test/rtl'

const base: SettingsDialogProps = {
  open: true,
  onClose: () => {},
  title: 'Settings',
  sections: [
    { id: 'profile', label: 'Profile' },
    { id: 'preferences', label: 'Preferences' },
  ],
  profile: { title: 'Your profile', fallbackText: 'AN', fields: [{ key: 'name', label: 'Name', value: 'Ana', kind: 'text' }] },
  preferences: {
    title: 'Preferences',
    switches: [{ key: 'haptics', label: 'Haptics', value: true, onChange: () => {} }],
    choiceGroups: [
      {
        key: 'density',
        label: 'Density',
        value: 'default',
        onChange: () => {},
        options: [
          { value: 'compact', label: 'Compact' },
          { value: 'default', label: 'Default' },
        ],
      },
    ],
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
        sections={[{ id: 'workspace', label: 'Workspace' }]}
        workspace={{ title: 'Workspace', fields: [{ key: 'id', label: 'Workspace id', value: 'ws-9f2c', kind: 'text', readOnly: true, copyable: true }] }}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Copy Workspace id' }))
    expect(await navigator.clipboard.readText()).toBe('ws-9f2c')
    await waitFor(() => expect(screen.getByText('Copied')).toBeInTheDocument())
  })

  it('reports each typed value', async () => {
    const onChange = vi.fn()
    render(<SettingsDialog {...base} profile={{ ...base.profile!, fields: [{ key: 'bio', label: 'Bio', value: '', kind: 'text', onChange }] }} />)
    await userEvent.type(screen.getByRole('textbox', { name: 'Bio' }), 'ab')
    expect(onChange).toHaveBeenCalledWith('a')
    expect(onChange).toHaveBeenCalledTimes(2)
  })

  it('reports a password mismatch on the confirm field and calls onSubmit once when they match', async () => {
    const onSubmit = vi.fn()
    render(<SettingsDialog {...base} profile={{ ...base.profile!, password: { onSubmit } }} />)
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
    render(<SettingsDialog {...base} sections={[{ id: 'billing', label: 'Billing' }]} />)
    expect(screen.getByText('Nothing to configure in this section yet.')).toBeInTheDocument()
  })

  it('shows the access-denied view when the initial section is not available', () => {
    render(<SettingsDialog {...base} initialSection="keys" accessDenied={{ title: 'No access', description: 'Ask an owner.' }} />)
    expect(screen.getByRole('heading', { name: 'No access' })).toBeInTheDocument()
  })

  it('fires sign out', async () => {
    const onPress = vi.fn()
    render(<SettingsDialog {...base} signOut={{ label: 'Sign out', onPress }} />)
    await userEvent.click(screen.getByRole('button', { name: 'Sign out' }))
    expect(onPress).toHaveBeenCalledTimes(1)
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
    render(<SettingsDialog {...base} initialSection="preferences" />)
    await expectNoAxeViolations(document.body)
  })
})

describe('SettingsDialog in right-to-left (ar)', () => {
  it('renders mirrored where directional and passes axe', async () => {
    renderRtl(<SettingsDialog open onClose={() => {}} title="الإعدادات" sections={[{ id: 'preferences', label: 'التفضيلات' }]} />)
    expect(await rtlDom.screen.findByRole('dialog', { name: /الإعدادات/ })).toBeInTheDocument()
    await axeRtl(document.body)
  })
})
