import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { ThemeScope } from '../../internal/ThemeScope'
import { ProfileAvatar } from './ProfileAvatar'
import { expectNoAxeViolations as axeRtl } from '../../../test/axe'
import { renderRtl } from '../../../test/rtl'

describe('ProfileAvatar', () => {
  it('shows the picture with the name as alternative text', () => {
    render(<ProfileAvatar name="Maria Souza" pictureUrl="/maria.png" />)
    expect(screen.getByRole('img', { name: 'Maria Souza' })).toHaveAttribute('src', '/maria.png')
  })

  it('shows the initial of the name and is announced by the name', () => {
    render(<ProfileAvatar name="maria" />)
    const img = screen.getByRole('img', { name: 'maria' })
    expect(img).toHaveTextContent('M')
  })

  it('falls back to the e-mail initial', () => {
    render(<ProfileAvatar email="joao@x.org" />)
    expect(screen.getByRole('img', { name: 'joao@x.org' })).toHaveTextContent('J')
  })

  it('shows a neutral glyph labelled "Profile" when nothing is known', () => {
    const { container } = render(<ProfileAvatar />)
    expect(screen.getByRole('img', { name: 'Profile' })).toBeInTheDocument()
    expect(container.querySelector('svg')).not.toBeNull()
    expect(container.textContent).toBe('')
  })

  it('falls back to the initial when the picture fails to load', () => {
    const { container } = render(<ProfileAvatar name="Ana" pictureUrl="/broken.png" />)
    fireEvent.error(container.querySelector('img')!)
    expect(container.querySelector('img')).toBeNull()
    expect(screen.getByRole('img', { name: 'Ana' })).toHaveTextContent('A')
  })

  it('exposes nothing when decorative', () => {
    const { container } = render(<ProfileAvatar name="Ana" decorative />)
    expect(screen.queryByRole('img')).toBeNull()
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true')
  })

  it('scales the initial with the disc and keeps a border in forced colours', () => {
    const css = cssOf('components/profile-avatar/ProfileAvatar.css')
    expect(css).toMatch(/font-size:\s*\d+cqi/)
    expect(mediaBlock(css, /\(forced-colors:\s*active\)/)).toMatch(/CanvasText/)
  })

  it('has no axe violations, light and dark', async () => {
    const { container } = render(
      <>
        {(['light', 'dark'] as const).map((scheme) => (
          <ThemeScope key={scheme} scheme={scheme}>
            <ProfileAvatar name="Maria" size="md" />
            <ProfileAvatar email="joao@x.org" size="sm" />
            <ProfileAvatar size="lg" />
            <ProfileAvatar name="Ana" pictureUrl="/ana.png" size="lg" />
          </ThemeScope>
        ))}
      </>,
    )
    await expectNoAxeViolations(container)
  })
})

describe('ProfileAvatar in right-to-left (ar)', () => {
  it('renders mirrored where directional and passes axe', async () => {
    const { container } = renderRtl(<><ProfileAvatar name="نور" size="sm" /><ProfileAvatar name={'e\u0301mile'} size="sm" /></>)
    // Initials are whole grapheme clusters.
    expect(container.textContent).toContain('ن')
    expect(container.textContent).toContain('E\u0301')
    await axeRtl(container)
  })
})
