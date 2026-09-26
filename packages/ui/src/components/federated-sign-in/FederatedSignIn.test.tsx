import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { ThemeScope } from '../../internal/ThemeScope'
import { createMarkRegistry, MarkRegistryProvider } from '../third-party-mark-slot/ThirdPartyMarkSlot'
import { FederatedSignIn } from './FederatedSignIn'

const providers = [
  { id: 'a', name: 'A' },
  { id: 'b', name: 'B' },
]

describe('FederatedSignIn', () => {
  it('renders one "Continue with" button per provider', () => {
    render(<FederatedSignIn providers={providers} onSelect={() => {}} />)
    expect(screen.getByRole('button', { name: 'Continue with A' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Continue with B' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Other ways to sign in' })).toBeInTheDocument()
  })

  it('calls onSelect with the provider id', async () => {
    const onSelect = vi.fn()
    render(<FederatedSignIn providers={providers} onSelect={onSelect} />)
    await userEvent.click(screen.getByRole('button', { name: 'Continue with B' }))
    expect(onSelect).toHaveBeenCalledWith('b')
  })

  it('busy provider is busy and the others are disabled', async () => {
    const onSelect = vi.fn()
    render(<FederatedSignIn providers={providers} onSelect={onSelect} busyId="a" />)
    expect(screen.getByRole('button', { name: 'Continue with A' })).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByRole('button', { name: 'Continue with B' })).toBeDisabled()
    await userEvent.click(screen.getByRole('button', { name: 'Continue with A' }))
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('disables every button', () => {
    render(<FederatedSignIn providers={providers} onSelect={() => {}} disabled />)
    for (const b of screen.getAllByRole('button')) expect(b).toBeDisabled()
  })

  it('row arrangement stacks at phone width', () => {
    const { container } = render(<FederatedSignIn providers={providers} onSelect={() => {}} arrangement="row" />)
    expect(container.firstElementChild).toHaveAttribute('data-arrangement', 'row')
    const phone = mediaBlock(cssOf('components/federated-sign-in/FederatedSignIn.css'), /\(max-width:\s*639\.98px\)/)
    expect(phone).toMatch(/\[data-arrangement='row'\]\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/)
  })

  it('draws a host-registered mark decoratively; the name stays text', () => {
    const registry = createMarkRegistry([{ key: 'idp', source: { kind: 'component', render: () => <svg data-testid="idp" /> }, owner: 'IdP', licence: 'host licence' }])
    render(
      <MarkRegistryProvider registry={registry}>
        <FederatedSignIn providers={[{ id: 'x', name: 'IdP', markKey: 'idp' }]} onSelect={() => {}} />
      </MarkRegistryProvider>,
    )
    expect(screen.getByTestId('idp').closest('[aria-hidden="true"]')).not.toBeNull()
    expect(screen.getByRole('button', { name: 'Continue with IdP' })).toBeInTheDocument()
  })

  it('has no axe violations, light and dark', async () => {
    const { container } = render(
      <>
        {(['light', 'dark'] as const).map((s) => (
          <ThemeScope key={s} scheme={s}>
            <FederatedSignIn providers={providers} onSelect={() => {}} busyId="b" aria-label={`Providers ${s}`} />
          </ThemeScope>
        ))}
      </>,
    )
    await expectNoAxeViolations(container)
  })
})
