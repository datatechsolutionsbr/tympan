import { act, render, screen } from '@testing-library/react'
import { Bell } from 'lucide-react'
import { describe, expect, it } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { politeAnnouncement } from '../../internal/data-a/announce'
import { ThemeScope } from '../../internal/ThemeScope'
import { Button } from '../button/Button'
import { CountBadge } from './CountBadge'
import { expectNoAxeViolations as axeRtl } from '../../../test/axe'
import { renderRtl } from '../../../test/rtl'

const noun = { one: 'notification', other: 'notifications' }

function Host({ count, announce = false }: { count: number; announce?: boolean }) {
  return (
    <span style={{ position: 'relative', display: 'inline-block' }}>
      <Button iconOnly accessibleLabel="Notifications" leadingIcon={<Bell />} aria-describedby="badge-desc" />
      <CountBadge count={count} itemNoun={noun} id="badge-desc" announce={announce} />
    </span>
  )
}

describe('CountBadge', () => {
  it('renders nothing at zero', () => {
    const { container } = render(<CountBadge count={0} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('describes the host with the count and noun', () => {
    render(<Host count={3} />)
    expect(screen.getByRole('button', { name: 'Notifications' })).toHaveAccessibleDescription('3 notifications')
  })

  it('caps the visible counter while the accessible text keeps the exact number', () => {
    const { container } = render(<Host count={150} />)
    expect(container.querySelector('.ty-count-badge__value')).toHaveTextContent('99+')
    expect(container.querySelector('.ty-count-badge__value')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByRole('button')).toHaveAccessibleDescription('150 notifications')
  })

  it('announces an increase once through the shared polite region', async () => {
    const { rerender } = render(<Host count={2} announce />)
    rerender(<Host count={3} announce />)
    await act(async () => {
      await Promise.resolve()
    })
    expect(politeAnnouncement()).toBe('3 notifications')
    expect(document.querySelectorAll('[data-ty-polite-announcer]')).toHaveLength(1)
  })

  it('plays no animation under reduced motion and uses system colours in forced colours', () => {
    const css = cssOf('components/count-badge/CountBadge.css')
    expect(mediaBlock(css, /\(prefers-reduced-motion:\s*reduce\)/)).toMatch(/animation:\s*none/)
    expect(mediaBlock(css, /\(forced-colors:\s*active\)/)).toMatch(/Mark/)
    expect(css).not.toMatch(/infinite/)
  })

  it('has no axe violations, light and dark', async () => {
    const { container } = render(
      <>
        {(['light', 'dark'] as const).map((scheme) => (
          <ThemeScope key={scheme} scheme={scheme}>
            <CountBadge count={7} />
            <CountBadge count={120} tone="neutral" />
          </ThemeScope>
        ))}
      </>,
    )
    await expectNoAxeViolations(container)
  })
})

describe('CountBadge in right-to-left (ar)', () => {
  it('renders mirrored where directional and passes axe', async () => {
    const { container } = renderRtl(<CountBadge count={150} />, { locale: 'ar-EG' })
    // The cap and the count use the locale's digits.
    expect(container.querySelector('.ty-count-badge__value')).toHaveTextContent('٩٩+')
    await axeRtl(container)
  })
})
