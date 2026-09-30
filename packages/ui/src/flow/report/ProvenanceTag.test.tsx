import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { renderWithProvider } from '../../../test/render'
import { ClaimTitle } from './ClaimTitle'
import { ProvenanceTag } from './ProvenanceTag'

describe('ClaimTitle', () => {
  it('renders the assertion sentence with title weight and no a11y violations', async () => {
    const { container } = render(<ClaimTitle>Extração responde por 80% do tempo de ETL.</ClaimTitle>)
    const claim = screen.getByText('Extração responde por 80% do tempo de ETL.')
    expect(claim.className).toBe('ty-claim-title')
    await expectNoAxeViolations(container)
  })
})

describe('ProvenanceTag', () => {
  it('renders icon and node name as a plain tag with a provenance accessible name', async () => {
    const { container } = renderWithProvider(<ProvenanceTag nodeName="staging.transform" />)
    expect(screen.getByText('staging.transform')).toBeInTheDocument()
    expect(container.querySelector('.ty-provenance-tag__icon svg')).not.toBeNull()
    expect(screen.getByLabelText('Provenance: staging.transform')).toBeInTheDocument()
    await expectNoAxeViolations(container)
  })

  it('renders a link to the node detail when href is given', async () => {
    renderWithProvider(<ProvenanceTag nodeName="staging.transform" href="#/node/transform" />)
    const link = screen.getByRole('link', { name: 'Provenance: Open staging.transform' })
    expect(link).toHaveAttribute('href', '#/node/transform')
    expect(link.className).toBe('ty-provenance-tag')
  })

  it('translates the accessible prefix with the provider locale', () => {
    renderWithProvider(<ProvenanceTag nodeName="carga" />, { locale: 'pt-BR' })
    expect(screen.getByLabelText('Procedência: carga')).toBeInTheDocument()
  })
})
