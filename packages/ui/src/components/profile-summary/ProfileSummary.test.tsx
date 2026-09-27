import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { ThemeScope } from '../../internal/ThemeScope'
import { ProfileSummary } from './ProfileSummary'

describe('ProfileSummary', () => {
  it('falls back to the initials when the picture fails', () => {
    const { container } = render(<ProfileSummary name="Júlia Andrade" pictureUrl="/missing.png" />)
    fireEvent.error(container.querySelector('img')!)
    expect(container.querySelector('.ty-avatar')).toHaveTextContent('JA')
  })

  it('leaves the e-mail out of the document unless showEmail is true', () => {
    const { rerender } = render(<ProfileSummary name="Ana Souza" email="ana@example.org" />)
    expect(screen.queryByText('ana@example.org')).toBeNull()
    rerender(<ProfileSummary name="Ana Souza" email="ana@example.org" showEmail />)
    expect(screen.getByText('ana@example.org')).toBeInTheDocument()
  })

  it('exposes the name once to assistive technology', () => {
    const { container } = render(<ProfileSummary name="Ana Souza" pictureUrl="/a.png" />)
    expect(container.querySelector('img')).toHaveAttribute('alt', '')
    expect(container.querySelector('.ty-avatar')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getAllByText('Ana Souza')).toHaveLength(1)
  })

  it('shows the role as text', () => {
    render(<ProfileSummary name="Ana Souza" role="Owner" />)
    expect(screen.getByText('Owner')).toBeInTheDocument()
  })

  it('truncates with the full value as a title and keeps the avatar border in forced colours', () => {
    render(<ProfileSummary name="A very long name that will not fit" />)
    expect(screen.getByText('A very long name that will not fit')).toHaveAttribute('title', 'A very long name that will not fit')
    expect(mediaBlock(cssOf('components/profile-summary/ProfileSummary.css'), /\(forced-colors:\s*active\)/)).toMatch(/CanvasText/)
  })

  it('has no axe violations, light and dark', async () => {
    const { container } = render(
      <>
        {(['light', 'dark'] as const).map((s) => (
          <ThemeScope key={s} scheme={s}>
            <ProfileSummary name="Júlia Andrade" email="n@example.org" showEmail role="Owner" />
          </ThemeScope>
        ))}
      </>,
    )
    await expectNoAxeViolations(container)
  })
})
