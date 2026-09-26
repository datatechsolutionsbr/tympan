import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { setMedia } from '../../../test/media'
import { Button } from '../button/Button'
import { Spinner } from './Spinner'

describe('Spinner', () => {
  it('is a progressbar named by its label', () => {
    render(<Spinner label="Saving" />)
    const bar = screen.getByRole('progressbar', { name: 'Saving' })
    expect(bar).not.toHaveAttribute('aria-valuenow')
  })

  it('uses the default label from the messages catalogue', () => {
    render(<Spinner />)
    expect(screen.getByRole('progressbar', { name: 'Loading' })).toBeInTheDocument()
  })

  it('stops rotation under reduced motion and shows the label as text', () => {
    setMedia({ reducedMotion: true })
    render(<Spinner label="Saving" />)
    expect(screen.getByText('Saving')).toBeInTheDocument()
    const reduced = mediaBlock(cssOf('components/spinner/Spinner.css'), /\(prefers-reduced-motion:\s*reduce\)/)
    expect(reduced).toMatch(/\.fk-spinner__ring[^{]*\{[^}]*animation:\s*none/)
    expect(reduced).toMatch(/\.fk-spinner__dot[^{]*\{[^}]*animation:\s*none/)
  })

  it('in a submitting button: aria-busy, name kept, spinner not announced separately', () => {
    render(<Button busy>Send</Button>)
    const button = screen.getByRole('button', { name: 'Send' })
    expect(button).toHaveAttribute('aria-busy', 'true')
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  })

  it('overlay: covered region is aria-busy and its controls cannot be focused', () => {
    const { container } = render(
      <Spinner overlay visible label="Saving">
        <button type="button">Inside</button>
      </Spinner>,
    )
    const region = container.querySelector('.fk-spinner-region')
    expect(region).toHaveAttribute('aria-busy', 'true')
    expect(container.querySelector('.fk-spinner-region__content')).toHaveAttribute('inert')
    expect(screen.getByRole('status')).toHaveTextContent('Saving')
    // jsdom does not implement `inert` focus blocking; browsers do. Assert the attribute contract.
    expect(screen.getByRole('button', { name: 'Inside', hidden: true }).closest('[inert]')).not.toBeNull()
  })

  it('overlay with visible false renders nothing of the overlay', () => {
    const { container } = render(
      <Spinner overlay visible={false} label="Saving">
        <p>content</p>
      </Spinner>,
    )
    expect(container.querySelector('.fk-spinner-overlay')).toBeNull()
    expect(screen.queryByRole('status')).toBeNull()
    expect(container.querySelector('.fk-spinner-region')).not.toHaveAttribute('aria-busy')
  })

  it('inherits the current text colour by default', () => {
    const { container } = render(
      <p style={{ color: 'red' }}>
        <Spinner label="Loading" />
      </p>,
    )
    expect(container.querySelector('.fk-spinner')).toHaveAttribute('data-tone', 'inherit')
    expect(cssOf('components/spinner/Spinner.css')).toMatch(/\.fk-spinner\s*\{[^}]*color:\s*inherit/)
  })

  it('uses system colours in forced-colors mode', () => {
    expect(mediaBlock(cssOf('components/spinner/Spinner.css'), /\(forced-colors:\s*active\)/)).toMatch(/CanvasText/)
  })

  it('has no axe violations', async () => {
    const { container } = render(
      <>
        <Spinner label="Loading" shape="dots" showLabel />
        <Spinner overlay visible label="Saving">
          <p>Region</p>
        </Spinner>
      </>,
    )
    await expectNoAxeViolations(container)
  })
})
