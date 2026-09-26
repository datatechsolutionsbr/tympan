import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { ThemeScope } from '../../internal/ThemeScope'
import { EnvironmentBanner } from './EnvironmentBanner'

describe('EnvironmentBanner', () => {
  it('renders nothing in production without forceShow', () => {
    const { container } = render(<EnvironmentBanner environment="production" />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders with the environment word when forced', () => {
    render(<EnvironmentBanner environment="production" forceShow environmentWord="Development" />)
    expect(screen.getByRole('region', { name: 'Environment' })).toHaveTextContent('Development')
  })

  it('shows user e-mail and role as text', () => {
    render(<EnvironmentBanner environment="development" user={{ email: 'dev@example.org', role: 'Owner' }} facts={{ appName: 'platform', port: 3200 }} />)
    expect(screen.getByText('dev@example.org')).toBeInTheDocument()
    expect(screen.getByText('Owner')).toBeInTheDocument()
    expect(screen.getByText('3200')).toBeInTheDocument()
  })

  it('renders nothing and does not throw when the host config is unavailable', () => {
    const { container } = render(
      <EnvironmentBanner
        environment={() => {
          throw new Error('no config')
        }}
      />,
    )
    expect(container).toBeEmptyDOMElement()
    const { container: c2 } = render(<EnvironmentBanner environment={null} />)
    expect(c2).toBeEmptyDOMElement()
  })

  it('has no axe violations, light and dark', async () => {
    const { container } = render(
      <>
        <ThemeScope scheme="light">
          <EnvironmentBanner environment="development" texts={{ label: 'Environment light' }} user={{ email: 'a@b.c', role: 'Owner' }} />
        </ThemeScope>
        <ThemeScope scheme="dark">
          <EnvironmentBanner environment="test" texts={{ label: 'Environment dark' }} />
        </ThemeScope>
      </>,
    )
    await expectNoAxeViolations(container)
  })
})
