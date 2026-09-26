import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { ThemeScope } from '../../internal/ThemeScope'
import { CategoryLabel, CategoryTabs, type CategoryItem } from './CategoryTabs'
import * as rtlDom from '@testing-library/react'
import { expectNoAxeViolations as axeRtl } from '../../../test/axe'
import { renderRtl } from '../../../test/rtl'

const items: CategoryItem[] = [
  { key: 'pt', value: 'pt-v', code: 'PT', name: 'PT Portugal', marker: 1 },
  { key: 'br', code: 'BR', name: 'Brasil', marker: 2 },
  { key: 'ee', code: 'EE', name: 'EE', marker: 3 },
]

describe('CategoryTabs', () => {
  it('shows the code and the name without the code', () => {
    render(<CategoryTabs label="Country" items={items} selected={null} onSelect={() => {}} />)
    const pt = screen.getByRole('radio', { name: /PT/ })
    expect(pt).toHaveTextContent('PT')
    expect(pt.querySelector('.fk-category-tabs__name')).toHaveTextContent(/^Portugal$/)
  })

  it('keeps the full name when removing the code leaves nothing', () => {
    render(<CategoryTabs label="Country" items={items} selected={null} onSelect={() => {}} />)
    const ee = screen.getAllByRole('radio')[2]!
    expect(ee.querySelector('.fk-category-tabs__name')).toHaveTextContent(/^EE$/)
  })

  it('reports the value (not the key) and shows it selected', async () => {
    const onSelect = vi.fn()
    const { rerender } = render(<CategoryTabs label="Country" items={items} selected={null} onSelect={onSelect} />)
    await userEvent.click(screen.getByRole('radio', { name: /Portugal/ }))
    expect(onSelect).toHaveBeenCalledWith('pt-v')
    rerender(<CategoryTabs label="Country" items={items} selected="pt-v" onSelect={onSelect} />)
    expect(screen.getByRole('radio', { name: /Portugal/ })).toHaveAttribute('aria-checked', 'true')
  })

  it('does not bubble activation to an enclosing clickable card', async () => {
    const onCard = vi.fn()
    const onSelect = vi.fn()
    render(
      // eslint-disable-next-line jsx-a11y/click-events-have-key-events
      <div onClick={onCard}>
        <CategoryTabs label="Country" items={items} selected={null} onSelect={onSelect} />
      </div>,
    )
    await userEvent.click(screen.getByRole('radio', { name: /Brasil/ }))
    expect(onSelect).toHaveBeenCalledWith('br')
    expect(onCard).not.toHaveBeenCalled()
  })

  it('clears with allowNone and keeps the filter otherwise', async () => {
    const onSelect = vi.fn()
    const { rerender } = render(<CategoryTabs label="Country" items={items} selected="br" onSelect={onSelect} allowNone />)
    await userEvent.click(screen.getByRole('radio', { name: /Brasil/ }))
    expect(onSelect).toHaveBeenLastCalledWith(null)
    onSelect.mockClear()
    rerender(<CategoryTabs label="Country" items={items} selected="br" onSelect={onSelect} />)
    await userEvent.click(screen.getByRole('radio', { name: /Brasil/ }))
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('moves between categories with arrow keys', async () => {
    const onSelect = vi.fn()
    render(<CategoryTabs label="Country" items={items} selected="br" onSelect={onSelect} />)
    await userEvent.tab()
    const radios = screen.getAllByRole('radio')
    const start = radios.indexOf(document.activeElement as HTMLElement)
    expect(start).toBeGreaterThanOrEqual(0)
    await userEvent.keyboard('{ArrowRight}')
    expect(radios[start + 1]).toHaveFocus()
  })

  it('CategoryLabel shows the same content in both sizes, named by the full name', () => {
    render(
      <>
        <CategoryLabel code="PT" name="Portugal" marker={1} size="small" />
        <CategoryLabel code="PT" name="Portugal" marker={1} />
      </>,
    )
    const labels = document.querySelectorAll('.fk-category-label')
    expect(labels[0]!.textContent).toBe(labels[1]!.textContent)
    expect(labels[0]).toHaveAttribute('data-size', 'small')
    expect(screen.getAllByText('Portugal')).toHaveLength(2)
  })

  it('scrolls with an edge fade on phones and outlines the selection in forced colours', () => {
    const css = cssOf('components/category-tabs/CategoryTabs.css')
    expect(css).toMatch(/overflow-x:\s*auto/)
    expect(mediaBlock(css, /\(max-width:\s*639\.98px\)/)).toMatch(/mask-image/)
    expect(mediaBlock(css, /\(forced-colors:\s*active\)/)).toMatch(/Highlight/)
  })

  it('has no axe violations, light and dark', async () => {
    const { container } = render(
      <>
        {(['light', 'dark'] as const).map((scheme) => (
          <ThemeScope key={scheme} scheme={scheme}>
            <CategoryTabs label={`Country ${scheme}`} items={items} selected="br" onSelect={() => {}} />
            <CategoryLabel code="PT" name="Portugal" marker={1} />
          </ThemeScope>
        ))}
      </>,
    )
    await expectNoAxeViolations(container)
  })
})

describe('CategoryTabs in right-to-left (ar)', () => {
  it('renders mirrored where directional and passes axe', async () => {
    const { container } = renderRtl(<CategoryTabs label="الدولة" items={[{ key: 'eg', code: 'EG', name: 'مصر', marker: 1 }, { key: 'sa', code: 'SA', name: 'السعودية', marker: 3 }]} selected="eg" onSelect={() => {}} />)
    expect(rtlDom.screen.getByRole('radio', { name: /مصر/ })).toBeInTheDocument()
    await axeRtl(container)
  })
})
