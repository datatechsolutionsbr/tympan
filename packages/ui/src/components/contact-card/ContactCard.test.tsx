import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { ThemeScope } from '../../internal/ThemeScope'
import { ContactChannelCard, ContactOfficeCard, ContactSection } from './ContactCard'

describe('ContactCard', () => {
  it('renders the e-mail as a mail link named by the address, in a description list', () => {
    const { container } = render(<ContactChannelCard purposeLabel="Press" email="press@example.org" />)
    expect(screen.getByRole('link', { name: 'press@example.org' })).toHaveAttribute('href', 'mailto:press@example.org')
    expect(container.querySelector('dl dt')).toHaveTextContent('E-mail')
  })

  it('renders the phone as a tel link', () => {
    render(<ContactChannelCard purposeLabel="Press" email="p@example.org" phone="+55 (11) 3091-1000" />)
    expect(screen.getByRole('link', { name: '+55 (11) 3091-1000' })).toHaveAttribute('href', 'tel:+551130911000')
  })

  it('puts the office address inside an address element', () => {
    const { container } = render(<ContactOfficeCard city="São Paulo" addressLines={['Rua das Estações, 1000', '01000-000']} />)
    expect(container.querySelector('address')).toHaveTextContent('Rua das Estações, 1000')
  })

  it('exposes the section title at the configured level', () => {
    render(
      <ContactSection title="Contact" subtitle="Write to the right team." headingLevel={3}>
        <ContactOfficeCard city="São Paulo" addressLines={['x']} headingLevel={4} />
      </ContactSection>,
    )
    expect(screen.getByRole('heading', { level: 3, name: 'Contact' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Contact' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 4, name: 'São Paulo' })).toBeInTheDocument()
  })

  it('keeps 44 px link targets, one column below 640 px and underlined links in forced colours', () => {
    const css = cssOf('components/contact-card/ContactCard.css')
    expect(css).toMatch(/\.ty-contact-card__link\s*\{[^}]*min-block-size:\s*var\(--ty-control-target\)/)
    expect(css).toMatch(/\.ty-contact-section__grid\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\)/)
    expect(mediaBlock(css, /\(forced-colors:\s*active\)/)).toMatch(/text-decoration:\s*underline/)
  })

  it('has no axe violations, light and dark', async () => {
    const { container } = render(
      <>
        {(['light', 'dark'] as const).map((s) => (
          <ThemeScope key={s} scheme={s}>
            <ContactSection title={`Contact ${s}`} subtitle="Lead">
              <ContactChannelCard purposeLabel="Press" email="press@example.org" phone="+55 11 3091-1000" />
              <ContactOfficeCard city="São Paulo" addressLines={['Rua das Estações, 1000']} />
            </ContactSection>
          </ThemeScope>
        ))}
      </>,
    )
    await expectNoAxeViolations(container)
  })
})
