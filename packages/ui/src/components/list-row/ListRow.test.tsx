import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FileText } from 'lucide-react'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { ThemeScope } from '../../internal/ThemeScope'
import { ListRow } from './ListRow'
import * as rtlDom from '@testing-library/react'
import { expectNoAxeViolations as axeRtl } from '../../../test/axe'
import { renderRtl } from '../../../test/rtl'

describe('ListRow', () => {
  it('lets Tab visit the two actions in order and nothing else', async () => {
    render(
      <ListRow
        title="Survey A"
        metadata={[{ label: 'Answers', value: 3 }]}
        actions={[
          { label: 'Edit', onPress: vi.fn() },
          { label: 'Remove', onPress: vi.fn(), tone: 'danger' },
        ]}
      />,
    )
    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'Edit, Survey A' })).toHaveFocus()
    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'Remove, Survey A' })).toHaveFocus()
    await userEvent.tab()
    expect(document.body).toHaveFocus()
  })

  it('exposes a disabled action as disabled and ignores presses', async () => {
    const onPress = vi.fn()
    render(<ListRow title="Survey A" actions={[{ label: 'Publish', onPress, disabled: true }]} />)
    const button = screen.getByRole('button', { name: 'Publish, Survey A' })
    expect(button).toBeDisabled()
    await userEvent.click(button)
    expect(onPress).not.toHaveBeenCalled()
  })

  it('names repeated actions with the item title', () => {
    render(
      <>
        <ListRow title="A" actions={[{ label: 'Edit', onPress: () => {} }]} />
        <ListRow title="B" actions={[{ label: 'Edit', onPress: () => {} }]} />
      </>,
    )
    expect(screen.getByRole('button', { name: 'Edit, A' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Edit, B' })).toBeInTheDocument()
  })

  it('marks the emphasised variant with text as well as the background', () => {
    const { container } = render(<ListRow title="Plan" variant="emphasised" />)
    expect(container.querySelector('.fk-list-row')).toHaveAttribute('data-variant', 'emphasised')
    expect(screen.getByText('Current')).toBeInTheDocument()
  })

  it('stacks actions under the summary below 640 px with 44 px targets', () => {
    const narrow = mediaBlock(cssOf('components/list-row/ListRow.css'), /\(max-width:\s*639\.98px\)/)
    expect(narrow).toMatch(/\.fk-list-row\s*\{[^}]*flex-direction:\s*column/)
    expect(narrow).toMatch(/\.fk-list-row__action\s*\{[^}]*min-block-size:\s*var\(--fk-control-target\)/)
  })

  it('has no axe violations in every variant, light and dark', async () => {
    const { container } = render(
      <>
        {(['light', 'dark'] as const).map((scheme) => (
          <ThemeScope key={scheme} scheme={scheme}>
            {(['surface', 'compact', 'card', 'emphasised'] as const).map((variant) => (
              <ListRow key={variant} title={`Row ${variant}`} icon={<FileText />} variant={variant} actions={[{ label: 'Edit', onPress: () => {} }]} />
            ))}
          </ThemeScope>
        ))}
      </>,
    )
    await expectNoAxeViolations(container)
  })
})

describe('ListRow in right-to-left (ar)', () => {
  it('renders mirrored where directional and passes axe', async () => {
    const { container } = renderRtl(<ListRow title="الاستبيان أ" actions={[{ label: 'فتح', onPress: () => {} }]} />)
    expect(rtlDom.screen.getByRole('button', { name: /فتح/ })).toBeInTheDocument()
    await axeRtl(container)
  })
})
