import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Plus } from 'lucide-react'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { setViewportWidth } from '../../../test/media'
import { ThemeScope } from '../../internal/ThemeScope'
import { FloatingActionButton } from './FloatingActionButton'
import * as rtlDom from '@testing-library/react'
import { expectNoAxeViolations as axeRtl } from '../../../test/axe'
import { renderRtl } from '../../../test/rtl'

describe('FloatingActionButton', () => {
  it('is inline at 1280 with no floating copy', () => {
    setViewportWidth(1280)
    render(<FloatingActionButton label="New session" icon={<Plus />} onPress={() => {}} />)
    expect(screen.getAllByRole('button', { name: 'New session' })).toHaveLength(1)
    expect(document.querySelector('.ty-fab-dock')).toBeNull()
    expect(screen.getByRole('button')).toHaveTextContent('New session')
  })

  it('floats once at 375, after the content, above the safe area', () => {
    setViewportWidth(375)
    render(
      <main>
        <FloatingActionButton label="New session" icon={<Plus />} onPress={() => {}} />
        <p>Last row</p>
      </main>,
    )
    const buttons = screen.getAllByRole('button', { name: 'New session' })
    expect(buttons).toHaveLength(1)
    const dock = buttons[0]!.closest('.ty-fab-dock')!
    expect(dock).not.toBeNull()
    expect(screen.getByText('Last row').compareDocumentPosition(dock) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(document.body).toHaveAttribute('data-ty-fab-reserve')
    expect(cssOf('components/floating-action-button/FloatingActionButton.css')).toMatch(/safe-area-inset-bottom/)
  })

  it('ignores presses while loading and reports busy', async () => {
    setViewportWidth(375)
    const onPress = vi.fn()
    render(<FloatingActionButton label="New session" icon={<Plus />} onPress={onPress} loading />)
    const button = screen.getByRole('button', { name: 'New session' })
    button.focus()
    await userEvent.keyboard('{Enter}')
    expect(onPress).not.toHaveBeenCalled()
    expect(button).toHaveAttribute('aria-busy', 'true')
  })

  it('announces the label when only the icon is visible', () => {
    setViewportWidth(375)
    render(<FloatingActionButton label="Add source" icon={<Plus />} onPress={() => {}} />)
    expect(screen.getByRole('button', { name: 'Add source' })).toHaveAttribute('data-icon-only')
  })

  it('does not scale in under reduced motion', () => {
    const reduced = mediaBlock(cssOf('components/floating-action-button/FloatingActionButton.css'), /\(prefers-reduced-motion:\s*reduce\)/)
    expect(reduced).toMatch(/\.ty-fab-dock\s*\{[^}]*animation:\s*none/)
  })

  it('has no axe violations in each state, light and dark', async () => {
    setViewportWidth(1280)
    const { container } = render(
      <>
        {(['light', 'dark'] as const).map((scheme) => (
          <ThemeScope key={scheme} scheme={scheme}>
            <FloatingActionButton label={`New ${scheme}`} icon={<Plus />} onPress={() => {}} />
            <FloatingActionButton label={`Busy ${scheme}`} icon={<Plus />} onPress={() => {}} loading />
            <FloatingActionButton label={`Off ${scheme}`} icon={<Plus />} onPress={() => {}} disabled emphasis="secondary" />
          </ThemeScope>
        ))}
      </>,
    )
    await expectNoAxeViolations(container)
    setViewportWidth(375)
    await expectNoAxeViolations(document.body)
  })
})

describe('FloatingActionButton in right-to-left (ar)', () => {
  it('renders mirrored where directional and passes axe', async () => {
    const { container } = renderRtl(<FloatingActionButton label="جلسة جديدة" icon={<span />} onPress={() => {}} presentation="inline" />)
    expect(rtlDom.screen.getByRole('button', { name: 'جلسة جديدة' })).toBeInTheDocument()
    await axeRtl(container)
  })
})
