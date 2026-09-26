import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { ThemeScope } from '../../internal/ThemeScope'
import { PasswordStrength } from './PasswordStrength'

const word = () => screen.getByRole('meter').getAttribute('aria-valuetext')

describe('PasswordStrength', () => {
  it('renders nothing for an empty password', () => {
    const { container } = render(<PasswordStrength password="" />)
    expect(container).toBeEmptyDOMElement()
  })

  it('"abc" is Weak', () => {
    render(<PasswordStrength password="abc" />)
    expect(word()).toBe('Weak')
  })

  it('eight lowercase letters are Fair under the default policy', () => {
    render(<PasswordStrength password="abcdefgh" />)
    expect(word()).toBe('Fair')
  })

  it('all default rules except uppercase is Good', () => {
    render(<PasswordStrength password="abcdefg1" />)
    expect(word()).toBe('Good')
  })

  it('a long password meeting all rules is Strong', () => {
    render(<PasswordStrength password="Correct-Horse-42-Staple" />)
    expect(word()).toBe('Strong')
  })

  it('the length rule mentions the minimum', () => {
    render(<PasswordStrength password="abc" showRequirements policy={{ minLength: 12 }} />)
    expect(screen.getByText(/At least 12 characters/)).toBeInTheDocument()
  })

  it('marks the symbol rule met when the password has "!"', () => {
    render(<PasswordStrength password="abc!" showRequirements policy={{ symbol: true }} />)
    const item = screen.getByText(/A symbol/).closest('li')!
    expect(item).toHaveAttribute('data-met')
    expect(item).toHaveTextContent(/^met:/)
  })

  it('always shows four segments and exposes the level word as value text', () => {
    const { container } = render(<PasswordStrength password="x" />)
    expect(container.querySelectorAll('.fk-password-strength__segment')).toHaveLength(4)
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuetext', 'Weak')
    expect(within(screen.getByRole('meter')).getByText('Weak')).toBeVisible()
  })

  it('announces politely and is not focusable', () => {
    render(<PasswordStrength password="abc" />)
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite')
    expect(screen.getByRole('meter')).not.toHaveAttribute('tabindex')
  })

  it('stops the fill transition under reduced motion and draws segments in forced colours', () => {
    const css = cssOf('components/password-strength/PasswordStrength.css')
    expect(mediaBlock(css, /\(prefers-reduced-motion:\s*reduce\)/)).toMatch(/transition:\s*none/)
    expect(mediaBlock(css, /\(forced-colors:\s*active\)/)).toMatch(/CanvasText/)
  })

  it('has no axe violations, light and dark', async () => {
    const { container } = render(
      <>
        {(['light', 'dark'] as const).map((scheme) => (
          <ThemeScope key={scheme} scheme={scheme}>
            <PasswordStrength password="abcdefg1" showRequirements />
          </ThemeScope>
        ))}
      </>,
    )
    await expectNoAxeViolations(container)
  })
})
